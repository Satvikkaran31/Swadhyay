import pool from '../utils/db.js';

export async function markComplete(req, res) {
  const userId = req.session.user.id;
  const { lesson_id } = req.body;

  if (!lesson_id) return res.status(400).json({ error: 'lesson_id is required' });

  try {
    // Verify user is enrolled in the course this lesson belongs to
    const { rows: enrollCheck } = await pool.query(
      `SELECT e.id FROM enrollments e
       JOIN modules m ON m.course_id = e.course_id
       JOIN lessons l ON l.module_id = m.id
       WHERE l.id = $1 AND e.user_id = $2`,
      [lesson_id, userId]
    );
    if (!enrollCheck.length) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    await pool.query(
      `INSERT INTO progress (user_id, lesson_id) VALUES ($1, $2)
       ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      [userId, lesson_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark lesson complete' });
  }
}

export async function getCourseProgress(req, res) {
  const userId = req.session.user.id;
  const { course_id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT p.lesson_id FROM progress p
       JOIN lessons l ON l.id = p.lesson_id
       JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = $1 AND p.user_id = $2`,
      [course_id, userId]
    );
    res.json({ completed_lesson_ids: rows.map(r => r.lesson_id) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
}
