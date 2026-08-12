import pool from '../utils/db.js';

export const getNote = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { lesson_id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT content FROM lesson_notes WHERE user_id = $1 AND lesson_id = $2',
      [userId, lesson_id]
    );
    res.json({ content: rows[0]?.content ?? '' });
  } catch {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

export const saveNote = async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { lesson_id } = req.params;
  const { content } = req.body;
  try {
    const { rows: enrollCheck } = await pool.query(
      `SELECT e.id FROM enrollments e
       JOIN modules m ON m.course_id = e.course_id
       JOIN lessons l ON l.module_id = m.id
       WHERE l.id = $1 AND e.user_id = $2`,
      [lesson_id, userId]
    );
    if (!enrollCheck.length) return res.status(403).json({ error: 'Not enrolled in this course' });

    await pool.query(
      `INSERT INTO lesson_notes (user_id, lesson_id, content, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET content=$3, updated_at=NOW()`,
      [userId, lesson_id, content ?? '']
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save note' });
  }
};
