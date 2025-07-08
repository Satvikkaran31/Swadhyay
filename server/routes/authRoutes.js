import express from 'express';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

// Initialize Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // redirect_uri will be provided in each request
);

// Updated: Handle authorization code instead of access token
router.post('/google', async (req, res) => {
  const { code, redirect_uri } = req.body;

  try {
    console.log('Received authorization code:', code);
    console.log('Redirect URI:', redirect_uri);

    // Exchange authorization code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri, // Must match what was sent to Google
    });

    console.log('Tokens received:', { 
      access_token: tokens.access_token ? 'present' : 'missing',
      id_token: tokens.id_token ? 'present' : 'missing' 
    });

    // Verify the ID token and get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('User payload:', payload);

    // Extract user information
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      verified: payload.email_verified,
    };

  req.session.user = user;
  req.session.tokens = tokens;

// Ensure session is saved before sending response
  req.session.save((err) => {
  if (err) {
    console.error('Failed to save session:', err);
    return res.status(500).json({ error: 'Session not saved' });
  }

  console.log('Session saved:', req.session.user);
  res.json({ success: true, user: req.session.user });
});

  } catch (error) {
    console.error('Google auth error:', error);
    
    // More specific error handling
    if (error.message.includes('redirect_uri_mismatch')) {
      return res.status(400).json({ 
        error: 'Redirect URI mismatch. Check your Google Cloud Console settings.' 
      });
    }
    
    if (error.message.includes('invalid_grant')) {
      return res.status(400).json({ 
        error: 'Invalid authorization code. Please try logging in again.' 
      });
    }

    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// Check authentication status
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ 
      success: true, 
      user: req.session.user 
    });
  } else {
    res.status(401).json({ 
      error: 'Not authenticated' 
    });
  }
});

// Logout route (unchanged)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }

    // Clear the cookie in the browser
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ success: true });
  });
});

export default router;