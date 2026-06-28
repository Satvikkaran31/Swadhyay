import pool from '../utils/db.js';

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const ALLOWED_VIDEO_HOSTS = [
  'youtube.com', 'www.youtube.com', 'youtu.be',
  'vimeo.com', 'player.vimeo.com',
];

function isAllowedVideoUrl(url) {
  if (!url) return true;
  try {
    const { hostname } = new URL(url);
    return ALLOWED_VIDEO_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

// Reshape flat JOIN rows into nested course → modules → lessons [→ resources]
function reshapeCourseRows(rows, { includeResources = false } = {}) {
  if (!rows.length) return null;
  const r = rows[0];
  const course = {
    id: r.id, slug: r.slug, title: r.title, description: r.description,
    thumbnail_url: r.thumbnail_url, price: r.price,
    is_published: r.is_published, created_at: r.created_at, updated_at: r.updated_at,
    modules: [],
  };
  const moduleMap = new Map();
  const lessonMap = new Map();
  for (const row of rows) {
    if (!row.m_id) continue;
    if (!moduleMap.has(row.m_id)) {
      const mod = { id: row.m_id, title: row.m_title, position: row.m_pos, lessons: [] };
      moduleMap.set(row.m_id, mod);
      course.modules.push(mod);
    }
    if (!row.l_id) continue;
    if (!lessonMap.has(row.l_id)) {
      const lesson = {
        id: row.l_id, title: row.l_title, duration: row.l_duration,
        position: row.l_pos, is_preview: row.l_is_preview,
        video_url: (includeResources || row.l_is_preview) ? row.l_video_url : undefined,
      };
      if (includeResources) lesson.resources = [];
      lessonMap.set(row.l_id, lesson);
      moduleMap.get(row.m_id).lessons.push(lesson);
    }
    if (includeResources && row.r_id) {
      const lesson = lessonMap.get(row.l_id);
      if (!lesson.resources.some(x => x.id === row.r_id)) {
        lesson.resources.push({ id: row.r_id, title: row.r_title, url: row.r_url, type: row.r_type });
      }
    }
  }
  return course;
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function getCourses(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, description, thumbnail_url, price, created_at
       FROM courses WHERE is_published = true ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

export async function getCourse(req, res) {
  try {
    const isAdmin = req.session?.user?.role === 'admin';
    const { rows } = await pool.query(
      `SELECT
         c.id, c.slug, c.title, c.description, c.thumbnail_url, c.price,
         c.is_published, c.created_at, c.updated_at,
         m.id AS m_id, m.title AS m_title, m.position AS m_pos,
         l.id AS l_id, l.title AS l_title, l.video_url AS l_video_url,
         l.duration AS l_duration, l.position AS l_pos, l.is_preview AS l_is_preview
       FROM courses c
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       WHERE c.slug = $1
       ORDER BY m.position, l.position`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    if (!rows[0].is_published && !isAdmin) return res.status(404).json({ error: 'Course not found' });
    res.json(reshapeCourseRows(rows));
  } catch {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
}

// ── ADMIN: COURSES ────────────────────────────────────────────────────────────

export async function createCourse(req, res) {
  const { title, description, thumbnail_url, price = 0, is_published = false } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (price < 0) return res.status(400).json({ error: 'Price cannot be negative' });

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
  if (price !== undefined && price < 0) return res.status(400).json({ error: 'Price cannot be negative' });
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
  } catch {
    res.status(500).json({ error: 'Failed to update course' });
  }
}

export async function deleteCourse(req, res) {
  try {
    await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
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
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Failed to update module' });
  }
}

export async function deleteModule(req, res) {
  try {
    await pool.query('DELETE FROM modules WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete module' });
  }
}

// ── ADMIN: LESSONS ────────────────────────────────────────────────────────────

export async function createLesson(req, res) {
  const { module_id, title, video_url, duration, position = 0, is_preview = false } = req.body;
  if (!module_id || !title) return res.status(400).json({ error: 'module_id and title are required' });
  if (!isAllowedVideoUrl(video_url)) {
    return res.status(400).json({ error: 'Video URL must be from YouTube or Vimeo' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO lessons (module_id, title, video_url, duration, position, is_preview)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [module_id, title, video_url, duration, position, is_preview]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create lesson' });
  }
}

export async function updateLesson(req, res) {
  const { id } = req.params;
  const { title, video_url, duration, position, is_preview } = req.body;
  if (!isAllowedVideoUrl(video_url)) {
    return res.status(400).json({ error: 'Video URL must be from YouTube or Vimeo' });
  }
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
  } catch {
    res.status(500).json({ error: 'Failed to update lesson' });
  }
}

export async function deleteLesson(req, res) {
  try {
    await pool.query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Failed to create resource' });
  }
}

export async function deleteResource(req, res) {
  try {
    await pool.query('DELETE FROM resources WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
}

export async function getLessonResources(req, res) {
  const { id } = req.params;
  const userId = req.session?.user?.id;
  const isAdmin = req.session?.user?.role === 'admin';

  try {
    const { rows: lessonRows } = await pool.query(
      `SELECT l.is_preview, m.course_id
       FROM lessons l JOIN modules m ON m.id = l.module_id
       WHERE l.id = $1`,
      [id]
    );
    if (!lessonRows.length) return res.status(404).json({ error: 'Lesson not found' });

    const { is_preview, course_id } = lessonRows[0];

    if (!isAdmin && !is_preview) {
      if (!userId) return res.status(401).json({ error: 'Authentication required' });
      const { rows: enroll } = await pool.query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [userId, course_id]
      );
      if (!enroll.length) return res.status(403).json({ error: 'Enrollment required to access resources' });
    }

    const { rows } = await pool.query(
      'SELECT id, title, url, type FROM resources WHERE lesson_id = $1',
      [id]
    );
    res.json(rows);
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

export async function getAdminCourse(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id, c.slug, c.title, c.description, c.thumbnail_url, c.price,
         c.is_published, c.created_at, c.updated_at,
         m.id AS m_id, m.title AS m_title, m.position AS m_pos,
         l.id AS l_id, l.title AS l_title, l.video_url AS l_video_url,
         l.duration AS l_duration, l.position AS l_pos, l.is_preview AS l_is_preview,
         r.id AS r_id, r.title AS r_title, r.url AS r_url, r.type AS r_type
       FROM courses c
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       LEFT JOIN resources r ON r.lesson_id = l.id
       WHERE c.id = $1
       ORDER BY m.position, l.position, r.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    res.json(reshapeCourseRows(rows, { includeResources: true }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
}
