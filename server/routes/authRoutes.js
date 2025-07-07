import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    const googleRes = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const user = googleRes.data;

    // Set session user
    req.session.user = {
      name: user.name,
      email: user.email,
      sub: user.sub,
      picture: user.picture
    };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error('Google login verification failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});
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
    secure: process.env.NODE_ENV === "production", // Set secure flag in production
  });

    res.json({ success: true });
  });
});


export default router;
