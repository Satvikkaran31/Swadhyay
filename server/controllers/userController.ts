import pool from '../utils/db.js';

export const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, picture, role, linkedin_url, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role`,
      [role, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    // Invalidate all active sessions for this user so the role change takes immediate effect
    await pool.query(
      `DELETE FROM user_sessions WHERE (sess->'user'->>'id')::int = $1`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
};
