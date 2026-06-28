import pool from '../utils/db.js';

export async function enroll(req, res) {
  const userId = req.session.user.id;
  const { course_id, payment_id } = req.body;

  if (!course_id) return res.status(400).json({ error: 'course_id is required' });

  try {
    // For paid courses, verify payment_id is present
    const { rows: courseRows } = await pool.query(
      'SELECT price FROM courses WHERE id = $1', [course_id]
    );
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });

    if (courseRows[0].price > 0 && !payment_id) {
      return res.status(400).json({ error: 'payment_id is required for paid courses' });
    }

    const { rows } = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, payment_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, course_id) DO NOTHING
       RETURNING *`,
      [userId, course_id, payment_id || null]
    );

    res.status(201).json({ success: true, enrollment: rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll' });
  }
}

export async function checkEnrollment(req, res) {
  const userId = req.session.user.id;
  const { course_id } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, course_id]
    );
    res.json({ enrolled: rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check enrollment' });
  }
}

export async function getMyEnrollments(req, res) {
  const userId = req.session.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.slug, c.title, c.description, c.thumbnail_url, c.price,
              e.enrolled_at,
              COUNT(DISTINCT l.id)::int AS total_lessons,
              COUNT(DISTINCT p.lesson_id)::int AS completed_lessons
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = $1
       WHERE e.user_id = $1
       GROUP BY c.id, c.slug, c.title, c.description, c.thumbnail_url, c.price, e.enrolled_at
       ORDER BY e.enrolled_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
}
