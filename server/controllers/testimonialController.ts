import pool from '../utils/db.js';

export const getTestimonials = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, role, quote, avatar_url, position
       FROM testimonials WHERE is_published = true ORDER BY position ASC, id ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};

export const getAdminTestimonials = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM testimonials ORDER BY position ASC, id ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
};

export const createTestimonial = async (req, res) => {
  const { name, role, quote, avatar_url, is_published = false, position = 0 } = req.body;
  if (!name || !quote) return res.status(400).json({ error: 'name and quote are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO testimonials (name, role, quote, avatar_url, is_published, position)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, role, quote, avatar_url, is_published, position]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
};

export const updateTestimonial = async (req, res) => {
  const { id } = req.params;
  const { name, role, quote, avatar_url, is_published, position } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE testimonials
       SET name=$1, role=$2, quote=$3, avatar_url=$4, is_published=$5, position=$6
       WHERE id=$7 RETURNING *`,
      [name, role, quote, avatar_url, is_published, position, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
};
