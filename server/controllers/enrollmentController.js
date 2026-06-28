import pool from '../utils/db.js';
import transporter from '../utils/mailer.js';

export async function enroll(req, res) {
  const userId = req.session.user.id;
  const { course_id, payment_id } = req.body;

  if (!course_id) return res.status(400).json({ error: 'course_id is required' });

  try {
    const { rows: courseRows } = await pool.query(
      'SELECT title, price FROM courses WHERE id = $1', [course_id]
    );
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });

    const course = courseRows[0];
    if (course.price > 0 && !payment_id) {
      return res.status(400).json({ error: 'payment_id is required for paid courses' });
    }

    const { rows } = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, payment_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, course_id) DO NOTHING
       RETURNING *`,
      [userId, course_id, payment_id || null]
    );

    // Send confirmation email (non-blocking — don't fail enrollment if mail fails)
    if (rows[0]) {
      const { email, name } = req.session.user;
      transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: `You're enrolled in "${course.title}"`,
        html: `
          <h2>Enrollment confirmed!</h2>
          <p>Hi ${name},</p>
          <p>You're now enrolled in <strong>${course.title}</strong>.</p>
          <p>Head over to <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/my-learning">My Learning</a> to start watching.</p>
          <p>Happy learning!</p>
        `,
      }).catch(err => console.error('Enrollment email error:', err.message));
    }

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
