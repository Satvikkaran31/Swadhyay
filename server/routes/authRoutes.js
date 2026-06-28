import express from 'express';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import pool from '../utils/db.js';

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
  const { code, redirect_uri } = req.body;

  try {
    const { tokens } = await client.getToken({ code, redirect_uri });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Upsert user into persistent users table
    const { rows } = await pool.query(
      `INSERT INTO users (google_id, name, email, picture, role)
       VALUES ($1, $2, $3, $4,
         CASE WHEN $3 = $5 THEN 'admin' ELSE 'student' END
       )
       ON CONFLICT (google_id) DO UPDATE
         SET name    = EXCLUDED.name,
             picture = EXCLUDED.picture,
             role    = CASE WHEN users.email = $5 THEN 'admin' ELSE 'student' END
       RETURNING id, name, email, picture, role`,
      [payload.sub, payload.name, payload.email, payload.picture, process.env.ADMIN_EMAIL]
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
    };

    req.session.user = user;
    req.session.tokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };

    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session not saved' });
      res.json({ success: true, user: req.session.user });
    });
  } catch (error) {
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
