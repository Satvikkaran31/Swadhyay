import pool from '../utils/db.js';

export async function getInstructor(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM instructor_profiles WHERE is_primary = true ORDER BY id LIMIT 1'
    );
    res.json(rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Failed to fetch instructor' });
  }
}

export async function updateInstructor(req, res) {
  const { name, title, bio, avatar_url } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const { rows } = await pool.query(
      `UPDATE instructor_profiles
       SET name = $1, title = $2, bio = $3, avatar_url = $4, updated_at = NOW()
       WHERE is_primary = true
       RETURNING *`,
      [name.trim(), title ?? null, bio ?? null, avatar_url ?? null]
    );
    if (!rows.length) return res.status(404).json({ error: 'Instructor profile not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update instructor' });
  }
}
