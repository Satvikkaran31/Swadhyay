import express from 'express';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import pool from '../utils/db.js';
import { captureLeadFromLogin } from '../controllers/analyticsController.js';

const ALLOWED_REDIRECT_URIS = [
  'postmessage',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://swadhyay.co',
  'https://swadhyay-pa3f.onrender.com',
];

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/google', authLimiter, async (req, res) => {
  const { code, redirect_uri, visitor_id } = req.body;

  if (!ALLOWED_REDIRECT_URIS.includes(redirect_uri)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  try {
    const { tokens } = await client.getToken({ code, redirect_uri });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Empty token payload');

    // Auto-admin emails: ADMIN_EMAIL and/or ADMIN_EMAILS (comma/space separated),
    // case-insensitive. Anyone else logs in as 'student' (and can be promoted in
    // the admin panel). Manual promotions are preserved on re-login.
    const adminEmails = [
      ...(process.env.ADMIN_EMAIL || '').split(/[,\s]+/),
      ...(process.env.ADMIN_EMAILS || '').split(/[,\s]+/),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);

    // Upsert user into persistent users table
    const { rows } = await pool.query(
      `WITH vals AS (
         SELECT $1::text AS google_id, $2::text AS name,
                $3::text AS email,     $4::text AS picture,
                $5::text[] AS admin_emails
       )
       INSERT INTO users (google_id, name, email, picture, role)
       SELECT v.google_id, v.name, v.email, v.picture,
              CASE WHEN lower(v.email) = ANY(v.admin_emails) THEN 'admin' ELSE 'student' END
       FROM vals v
       ON CONFLICT (google_id) DO UPDATE
         SET name    = EXCLUDED.name,
             picture = EXCLUDED.picture,
             role    = CASE WHEN lower(users.email) = ANY($5::text[])
                            THEN 'admin' ELSE users.role END
       RETURNING id, name, email, picture, role, linkedin_url`,
      [payload.sub, payload.name, payload.email, payload.picture, adminEmails]
    );

    const dbUser = rows[0];

    const user = {
      id: dbUser.id,
      google_id: payload.sub,
      name: dbUser.name,
      email: dbUser.email,
      picture: dbUser.picture,
      role: dbUser.role,
      verified: payload.email_verified,
      linkedin_url: dbUser.linkedin_url ?? null,
    };

    // Regenerate session ID after login to prevent session fixation attacks
    req.session.regenerate((regenErr) => {
      if (regenErr) return res.status(500).json({ error: 'Session could not be regenerated' });
      req.session.user = user;
      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: 'Session not saved' });
        // Auto-capture this authenticated visitor as a CRM lead (non-blocking).
        captureLeadFromLogin(user, typeof visitor_id === 'string' ? visitor_id : null);
        res.json({ success: true, user: req.session.user });
      });
    });
  } catch (error) {
    console.error('[auth/google] error:', error.message, JSON.stringify((error as any)?.response?.data ?? {}));
    if (error.message.includes('redirect_uri_mismatch')) {
      return res.status(400).json({ error: 'Redirect URI mismatch.' });
    }
    if (error.message.includes('invalid_grant')) {
      return res.status(400).json({ error: 'Invalid authorization code.' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ success: true, user: req.session.user });
  }
  return res.status(200).json({ success: true, user: null });
});

router.put('/profile', async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Not authenticated' });
  const { linkedin_url } = req.body;
  const sanitized = (linkedin_url ?? '').toString().trim().slice(0, 500) || null;
  if (sanitized && !sanitized.includes('linkedin.com/in/')) {
    return res.status(400).json({ error: 'URL must be a LinkedIn profile URL (linkedin.com/in/…)' });
  }
  try {
    await pool.query(
      `UPDATE users SET linkedin_url = $1 WHERE id = $2`,
      [sanitized, req.session.user.id]
    );
    (req.session as any).user = { ...req.session.user, linkedin_url: sanitized };
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session save failed' });
      res.json({ success: true, linkedin_url: sanitized });
    });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({ success: true });
  });
});

export default router;
