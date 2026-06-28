import pool from '../utils/db.js';

// Helper: build slug from title
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function getCourses(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, thumbnail_url, price, created_at
       FROM courses WHERE is_published = true ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

export async function getCourse(req, res) {
  try {
    const { rows: courseRows } = await pool.query(
      `SELECT * FROM courses WHERE slug = $1`,
      [req.params.slug]
    );
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });

    const course = courseRows[0];

    // Only non-admin users are blocked from unpublished courses
    if (!course.is_published && req.session?.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { rows: modules } = await pool.query(
      `SELECT id, title, position FROM modules WHERE course_id = $1 ORDER BY position`,
      [course.id]
    );

    for (const mod of modules) {
      const { rows: lessons } = await pool.query(
        `SELECT id, title, video_url, duration, position, is_preview
         FROM lessons WHERE module_id = $1 ORDER BY position`,
        [mod.id]
      );
      // Strip video_url from non-preview lessons for unauthenticated/non-enrolled users
      // (enrollment check happens on the /learn route; here we just expose metadata)
      mod.lessons = lessons.map(l => ({
        ...l,
        video_url: l.is_preview ? l.video_url : undefined,
      }));
    }

    res.json({ ...course, modules });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
}

// ── ADMIN: COURSES ────────────────────────────────────────────────────────────

export async function createCourse(req, res) {
  const { title, description, thumbnail_url, price = 0, is_published = false } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const slug = slugify(title);
  try {
    const { rows } = await pool.query(
      `INSERT INTO courses (slug, title, description, thumbnail_url, price, is_published)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [slug, title, description, thumbnail_url, price, is_published]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A course with this title already exists' });
    res.status(500).json({ error: 'Failed to create course' });
  }
}

export async function updateCourse(req, res) {
  const { id } = req.params;
  const { title, description, thumbnail_url, price, is_published } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE courses
       SET title         = COALESCE($1, title),
           description   = COALESCE($2, description),
           thumbnail_url = COALESCE($3, thumbnail_url),
           price         = COALESCE($4, price),
           is_published  = COALESCE($5, is_published),
           updated_at    = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, thumbnail_url, price, is_published, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
}

export async function deleteCourse(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
}

// ── ADMIN: MODULES ────────────────────────────────────────────────────────────

export async function createModule(req, res) {
  const { course_id, title, position = 0 } = req.body;
  if (!course_id || !title) return res.status(400).json({ error: 'course_id and title are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO modules (course_id, title, position) VALUES ($1, $2, $3) RETURNING *`,
      [course_id, title, position]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create module' });
  }
}

export async function updateModule(req, res) {
  const { id } = req.params;
  const { title, position } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE modules SET title = COALESCE($1, title), position = COALESCE($2, position)
       WHERE id = $3 RETURNING *`,
      [title, position, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Module not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update module' });
  }
}

export async function deleteModule(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM modules WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete module' });
  }
}

// ── ADMIN: LESSONS ────────────────────────────────────────────────────────────

export async function createLesson(req, res) {
  const { module_id, title, video_url, duration, position = 0, is_preview = false } = req.body;
  if (!module_id || !title) return res.status(400).json({ error: 'module_id and title are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO lessons (module_id, title, video_url, duration, position, is_preview)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [module_id, title, video_url, duration, position, is_preview]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lesson' });
  }
}

export async function updateLesson(req, res) {
  const { id } = req.params;
  const { title, video_url, duration, position, is_preview } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE lessons
       SET title      = COALESCE($1, title),
           video_url  = COALESCE($2, video_url),
           duration   = COALESCE($3, duration),
           position   = COALESCE($4, position),
           is_preview = COALESCE($5, is_preview)
       WHERE id = $6 RETURNING *`,
      [title, video_url, duration, position, is_preview, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Lesson not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
}

export async function deleteLesson(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
}

// ── ADMIN: RESOURCES ──────────────────────────────────────────────────────────

export async function createResource(req, res) {
  const { lesson_id, title, url, type = 'link' } = req.body;
  if (!lesson_id || !title || !url) return res.status(400).json({ error: 'lesson_id, title, and url are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO resources (lesson_id, title, url, type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [lesson_id, title, url, type]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
}

export async function deleteResource(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM resources WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
}

// ── ENROLLED: LESSON DETAIL + RESOURCES ──────────────────────────────────────

export async function getLessonDetail(req, res) {
  const { id } = req.params;
  const userId = req.session?.user?.id;
  const isAdmin = req.session?.user?.role === 'admin';

  try {
    const { rows: lessonRows } = await pool.query(
      `SELECT l.*, m.course_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = $1`,
      [id]
    );
    if (!lessonRows.length) return res.status(404).json({ error: 'Lesson not found' });
    const lesson = lessonRows[0];

    if (!isAdmin && userId) {
      const { rows: enroll } = await pool.query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [userId, lesson.course_id]
      );
      if (!enroll.length && !lesson.is_preview) {
        return res.status(403).json({ error: 'Not enrolled' });
      }
    }

    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
}

export async function getLessonResources(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT id, title, url, type FROM resources WHERE lesson_id = $1',
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
}

// ── ADMIN: FULL COURSE WITH ALL RESOURCES ─────────────────────────────────────

export async function getAdminCourses(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, thumbnail_url, price, is_published, created_at
       FROM courses ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

export async function getAdminCourse(req, res) {
  try {
    const { rows: courseRows } = await pool.query(
      `SELECT * FROM courses WHERE id = $1`, [req.params.id]
    );
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });
    const course = courseRows[0];

    const { rows: modules } = await pool.query(
      `SELECT id, title, position FROM modules WHERE course_id = $1 ORDER BY position`,
      [course.id]
    );

    for (const mod of modules) {
      const { rows: lessons } = await pool.query(
        `SELECT id, title, video_url, duration, position, is_preview FROM lessons
         WHERE module_id = $1 ORDER BY position`,
        [mod.id]
      );
      for (const lesson of lessons) {
        const { rows: resources } = await pool.query(
          `SELECT id, title, url, type FROM resources WHERE lesson_id = $1`,
          [lesson.id]
        );
        lesson.resources = resources;
      }
      mod.lessons = lessons;
    }

    res.json({ ...course, modules });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
}
