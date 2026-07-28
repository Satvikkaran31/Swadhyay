import pool from '../utils/db.js';

export const getCourseReviews = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name, u.picture
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN courses c ON c.id = r.course_id
       WHERE c.slug = $1
       ORDER BY r.created_at DESC`,
      [req.params.slug]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const submitReview = async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const { rating, body } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const { rows: courseRows } = await pool.query(
      'SELECT id FROM courses WHERE slug = $1', [req.params.slug]
    );
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });
    const courseId = courseRows[0].id;

    const { rows: enroll } = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );
    if (!enroll.length) {
      return res.status(403).json({ error: 'You must be enrolled to leave a review' });
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (user_id, course_id, rating, body)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, course_id) DO UPDATE SET rating=$3, body=$4, created_at=NOW()
       RETURNING id, rating, body, created_at`,
      [userId, courseId, rating, body || null]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

export const deleteReview = async (req, res) => {
  const userId = req.session.user?.id;
  const isAdmin = req.session.user?.role === 'admin';
  try {
    const where = isAdmin ? 'id = $1' : 'id = $1 AND user_id = $2';
    const params = isAdmin ? [req.params.id] : [req.params.id, userId];
    await pool.query(`DELETE FROM reviews WHERE ${where}`, params);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
