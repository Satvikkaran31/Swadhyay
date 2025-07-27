import express from 'express';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Google login route
router.post('/google', async (req, res) => {
  const { code, redirect_uri } = req.body;

  try {
    // Exchange authorization code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri,
    });

    // Verify the ID token and extract user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      verified: payload.email_verified,
    };

    req.session.user = user;
    req.session.tokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session not saved' });
      }
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

// Get current user session
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ success: true, user: req.session.user });
  }
  return res.status(200).json({ success: true, user: null });
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

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
