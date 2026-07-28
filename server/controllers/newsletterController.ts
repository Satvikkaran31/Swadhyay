import pool from '../utils/db.js';
import rateLimit from 'express-rate-limit';
import validator from 'validator';

export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const subscribe = async (req, res) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  try {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase().trim()]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

export const getSubscribers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
};
