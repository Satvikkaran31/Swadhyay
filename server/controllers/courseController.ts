import pool from '../utils/db.js';
import { slugify } from '../utils/slugify.js';

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
function reshapeCourseRows(rows, { includeResources = false, includeVideoUrls = false } = {}) {
  if (!rows.length) return null;
  const r = rows[0];
  const course = {
    id: r.id, slug: r.slug, title: r.title,
    description: r.description, short_description: r.short_description,
    what_youll_learn: r.what_youll_learn ?? [],
    requirements: r.requirements ?? [],
    level: r.level ?? 'all-levels', language: r.language ?? 'English',
    thumbnail_url: r.thumbnail_url, price: r.price,
    is_published: r.is_published, created_at: r.created_at, updated_at: r.updated_at,
    series_id: r.series_id,
    series: r.series_title ? { id: r.series_id, title: r.series_title, slug: r.series_slug } : null,
    enrollment_count: r.enrollment_count ?? 0,
    modules: [],
  };
  const moduleMap = new Map();
  const lessonMap = new Map();
  for (const row of rows) {
    if (!row.m_id) continue;
    if (!moduleMap.has(row.m_id)) {
      const mod = { id: row.m_id, title: row.m_title, description: row.m_desc ?? null, position: row.m_pos, lessons: [] };
      moduleMap.set(row.m_id, mod);
      course.modules.push(mod);
    }
    if (!row.l_id) continue;
    if (!lessonMap.has(row.l_id)) {
      const showVideo = includeVideoUrls || includeResources || row.l_is_preview;
      const lesson: Record<string, any> = {
        id: row.l_id, title: row.l_title, duration: row.l_duration,
        position: row.l_pos, is_preview: row.l_is_preview,
        type: row.l_type ?? 'video',
        content: (includeVideoUrls || includeResources) ? (row.l_content ?? null) : undefined,
        video_url: showVideo ? row.l_video_url : undefined,
      };
      if (includeResources) lesson.resources = [];
      lessonMap.set(row.l_id, lesson);
      moduleMap.get(row.m_id).lessons.push(lesson);
    }
    if (includeResources && row.r_id) {
      const lesson = lessonMap.get(row.l_id);
      if (!lesson.resources.some((x: any) => x.id === row.r_id)) {
        lesson.resources.push({ id: row.r_id, title: row.r_title, url: row.r_url, type: row.r_type });
      }
    }
  }
  (course as any).total_duration = course.modules.reduce(
    (sum: number, m: any) => sum + m.lessons.reduce((s: number, l: any) => s + (l.duration ?? 0), 0),
    0
  );
  return course;
}

// ── PUBLIC ─────────────────────────────���───────────────────────────────��──────

export async function getCourses(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.slug, c.title, c.description, c.short_description,
              c.thumbnail_url, c.price, c.level, c.language, c.created_at,
              c.series_id, s.title AS series_title, s.slug AS series_slug,
              COUNT(DISTINCT l.id)::int AS total_lessons,
              COALESCE(SUM(l.duration), 0)::int AS total_duration
       FROM courses c
       LEFT JOIN series s ON s.id = c.series_id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       WHERE c.is_published = true
       GROUP BY c.id, s.id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

export async function getCourse(req, res) {
  try {
    const isAdminUser = req.session?.user?.role === 'admin';
    const { rows } = await pool.query(
      `SELECT
         c.id, c.slug, c.title, c.description, c.short_description,
         c.what_youll_learn, c.requirements, c.level, c.language,
         c.thumbnail_url, c.price, c.is_published, c.created_at, c.updated_at,
         c.series_id, s.title AS series_title, s.slug AS series_slug,
         (SELECT COUNT(*)::int FROM enrollments WHERE course_id = c.id) AS enrollment_count,
         m.id AS m_id, m.title AS m_title, m.description AS m_desc, m.position AS m_pos,
         l.id AS l_id, l.title AS l_title, l.type AS l_type, l.content AS l_content,
         l.video_url AS l_video_url, l.duration AS l_duration, l.position AS l_pos, l.is_preview AS l_is_preview
       FROM courses c
       LEFT JOIN series s ON s.id = c.series_id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       WHERE c.slug = $1
       ORDER BY m.position, l.position`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    if (!rows[0].is_published && !isAdminUser) return res.status(404).json({ error: 'Course not found' });
    res.json(reshapeCourseRows(rows));
  } catch {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
}

export async function getCourseLearning(req, res) {
  const userId = req.session?.user?.id;
  const isAdmin = req.session?.user?.role === 'admin';

  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const [{ rows: courseCheck }, enrollCheck] = await Promise.all([
      pool.query('SELECT id FROM courses WHERE slug = $1', [req.params.slug]),
      isAdmin
        ? Promise.resolve(null)
        : pool.query(
            `SELECT e.id FROM enrollments e
             JOIN courses c ON c.id = e.course_id
             WHERE c.slug = $1 AND e.user_id = $2`,
            [req.params.slug, userId]
          ),
    ]);

    if (!courseCheck.length) return res.status(404).json({ error: 'Course not found' });
    if (!isAdmin && !enrollCheck.rows.length) {
      return res.status(403).json({ error: 'Not enrolled' });
    }

    const { rows } = await pool.query(
      `SELECT
         c.id, c.slug, c.title, c.description, c.thumbnail_url, c.price,
         c.is_published, c.created_at, c.updated_at,
         m.id AS m_id, m.title AS m_title, m.description AS m_desc, m.position AS m_pos,
         l.id AS l_id, l.title AS l_title, l.type AS l_type, l.content AS l_content,
         l.video_url AS l_video_url, l.duration AS l_duration, l.position AS l_pos, l.is_preview AS l_is_preview
       FROM courses c
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       WHERE c.slug = $1
       ORDER BY m.position, l.position`,
      [req.params.slug]
    );

    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    res.json(reshapeCourseRows(rows, { includeVideoUrls: true }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
}

// ── ADMIN: COURSES ────────────────────────────────────────────────────────────

export async function createCourse(req, res) {
  const {
    title, description, short_description, thumbnail_url,
    price = 0, is_published = false, series_id = null,
    what_youll_learn = [], requirements = [],
    level = 'all-levels', language = 'English',
  } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (price < 0) return res.status(400).json({ error: 'Price cannot be negative' });

  const slug = slugify(title);
  try {
    const { rows } = await pool.query(
      `INSERT INTO courses (slug, title, description, short_description, thumbnail_url, price,
                            is_published, series_id, what_youll_learn, requirements, level, language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [slug, title, description, short_description, thumbnail_url, price,
       is_published, series_id || null, what_youll_learn, requirements, level, language]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'A course with this title already exists' });
    res.status(500).json({ error: 'Failed to create course' });
  }
}

export async function updateCourse(req, res) {
  const { id } = req.params;
  const {
    title, description, short_description, thumbnail_url, price, is_published,
    series_id, what_youll_learn, requirements, level, language,
  } = req.body;
  if (price !== undefined && price < 0) return res.status(400).json({ error: 'Price cannot be negative' });
  try {
    const { rows } = await pool.query(
      `UPDATE courses
       SET title              = COALESCE($1, title),
           description        = COALESCE($2, description),
           short_description  = COALESCE($3, short_description),
           thumbnail_url      = COALESCE($4, thumbnail_url),
           price              = COALESCE($5, price),
           is_published       = COALESCE($6, is_published),
           series_id          = $7,
           what_youll_learn   = COALESCE($8, what_youll_learn),
           requirements       = COALESCE($9, requirements),
           level              = COALESCE($10, level),
           language           = COALESCE($11, language),
           updated_at         = NOW()
       WHERE id = $12 RETURNING *`,
      [title, description, short_description, thumbnail_url, price, is_published,
       series_id ?? null, what_youll_learn, requirements, level, language, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update course' });
  }
}

/**
 * Atomic batch-save: saves course + all modules + all lessons in one transaction.
 * Deletes modules/lessons removed from the payload.
 */
export async function batchSaveCourse(req, res) {
  const { courseId } = req.params;
  const { modules, ...courseMeta } = req.body;

  if (!courseMeta?.title) return res.status(400).json({ error: 'Course title is required' });
  const price = Number(courseMeta.price);
  if (isNaN(price) || price < 0) return res.status(400).json({ error: 'Price must be a non-negative number' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: courseRows } = await client.query(
      `UPDATE courses
       SET title             = $1,
           description       = $2,
           short_description = $3,
           thumbnail_url     = $4,
           price             = $5,
           is_published      = $6,
           series_id         = $7,
           what_youll_learn  = $8,
           requirements      = $9,
           level             = $10,
           language          = $11,
           updated_at        = NOW()
       WHERE id = $12 RETURNING *`,
      [
        courseMeta.title,
        courseMeta.description ?? null,
        courseMeta.short_description ?? null,
        courseMeta.thumbnail_url ?? null,
        price,
        Boolean(courseMeta.is_published),
        courseMeta.series_id ?? null,
        courseMeta.what_youll_learn ?? [],
        courseMeta.requirements ?? [],
        courseMeta.level ?? 'all-levels',
        courseMeta.language ?? 'English',
        courseId,
      ]
    );
    if (!courseRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Course not found' });
    }

    const mods = modules ?? [];

    for (const mod of mods) {
      for (const lesson of mod.lessons ?? []) {
        if (lesson.video_url && !isAllowedVideoUrl(lesson.video_url)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Lesson "${lesson.title}": video URL must be YouTube or Vimeo` });
        }
      }
    }

    const existingMods: Array<typeof mods[0] & { pos: number }> = [];
    const newMods: Array<typeof mods[0] & { pos: number }> = [];
    for (let mi = 0; mi < mods.length; mi++) {
      if (mods[mi].id) existingMods.push({ ...mods[mi], pos: mi });
      else newMods.push({ ...mods[mi], pos: mi });
    }
    const existingLessons: Array<{ id: number; title: string; type: string; content: string|null; video_url: string|null; duration: number|null; pos: number; is_preview: boolean }> = [];

    for (let mi = 0; mi < mods.length; mi++) {
      for (let li = 0; li < (mods[mi].lessons ?? []).length; li++) {
        const l = mods[mi].lessons[li];
        if (l.id) {
          existingLessons.push({ id: l.id, title: l.title, type: l.type || 'video', content: l.content ?? null, video_url: l.video_url || null, duration: l.duration ? Number(l.duration) : null, pos: li, is_preview: Boolean(l.is_preview) });
        }
      }
    }

    if (existingMods.length) {
      const offset = existingMods.length * 4;
      const vals = existingMods.map((_, i) => `($${i * 4 + 1}::int, $${i * 4 + 2}::text, $${i * 4 + 3}::text, $${i * 4 + 4}::int)`).join(',');
      await client.query(
        `UPDATE modules AS m SET title = v.title, description = v.description, position = v.pos
         FROM (VALUES ${vals}) AS v(id, title, description, pos)
         WHERE m.id = v.id AND m.course_id = $${offset + 1}`,
        [...existingMods.flatMap(m => [m.id, m.title, m.description ?? null, m.pos]), courseId]
      );
    }

    if (existingLessons.length) {
      const offset = existingLessons.length * 8;
      const vals = existingLessons.map((_, i) => `($${i * 8 + 1}::int, $${i * 8 + 2}::text, $${i * 8 + 3}::text, $${i * 8 + 4}::text, $${i * 8 + 5}::text, $${i * 8 + 6}::int, $${i * 8 + 7}::int, $${i * 8 + 8}::boolean)`).join(',');
      await client.query(
        `UPDATE lessons AS l SET title = v.title, type = v.type, content = v.content, video_url = v.video_url, duration = v.duration, position = v.pos, is_preview = v.is_preview
         FROM (VALUES ${vals}) AS v(id, title, type, content, video_url, duration, pos, is_preview)
         WHERE l.id = v.id
           AND l.module_id IN (SELECT id FROM modules WHERE course_id = $${offset + 1})`,
        [...existingLessons.flatMap(l => [l.id, l.title, l.type, l.content, l.video_url, l.duration, l.pos, l.is_preview]), courseId]
      );
    }

    const modulePosToId = new Map<number, number>(existingMods.map(m => [m.pos, m.id]));
    for (const mod of newMods) {
      const { rows } = await client.query(
        `INSERT INTO modules (course_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING id`,
        [courseId, mod.title, mod.description ?? null, mod.pos]
      );
      modulePosToId.set(mod.pos, rows[0].id);
    }

    const keptModuleIds: number[] = [];
    const keptLessonIds: number[] = [];

    for (let mi = 0; mi < mods.length; mi++) {
      const modId = modulePosToId.get(mi)!;
      keptModuleIds.push(modId);
      for (let li = 0; li < (mods[mi].lessons ?? []).length; li++) {
        const lesson = mods[mi].lessons[li];
        if (lesson.id) {
          keptLessonIds.push(lesson.id);
        } else {
          const { rows } = await client.query(
            `INSERT INTO lessons (module_id, title, type, content, video_url, duration, position, is_preview) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [modId, lesson.title, lesson.type || 'video', lesson.content ?? null, lesson.video_url || null, lesson.duration ? Number(lesson.duration) : null, li, Boolean(lesson.is_preview)]
          );
          keptLessonIds.push(rows[0].id);
        }
      }
    }

    await client.query(
      `DELETE FROM lessons WHERE module_id = ANY($1::int[]) AND NOT (id = ANY($2::int[]))`,
      [keptModuleIds, keptLessonIds]
    );

    if (keptModuleIds.length) {
      await client.query(
        `DELETE FROM modules WHERE course_id = $1 AND id NOT IN (${keptModuleIds.map((_, i) => `$${i + 2}`).join(',')})`,
        [courseId, ...keptModuleIds]
      );
    } else {
      await client.query(`DELETE FROM modules WHERE course_id = $1`, [courseId]);
    }

    await client.query('COMMIT');
    res.json({ success: true, course: courseRows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('batchSaveCourse error:', err.message);
    res.status(500).json({ error: 'Failed to save course' });
  } finally {
    client.release();
  }
}

export async function deleteCourse(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Course not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete course' });
  }
}

export async function createModule(req, res) {
  const { course_id, title, description, position = 0 } = req.body;
  if (!course_id || !title) return res.status(400).json({ error: 'course_id and title are required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO modules (course_id, title, description, position) VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, title, description ?? null, position]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create module' });
  }
}

export async function updateModule(req, res) {
  const { id } = req.params;
  const { title, description, position } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE modules SET title = COALESCE($1, title), description = COALESCE($2, description), position = COALESCE($3, position)
       WHERE id = $4 RETURNING *`,
      [title, description, position, id]
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

export async function createLesson(req, res) {
  const { module_id, title, type = 'video', content = null, video_url, duration, position = 0, is_preview = false } = req.body;
  if (!module_id || !title) return res.status(400).json({ error: 'module_id and title are required' });
  const ALLOWED_TYPES = ['video', 'text'];
  if (type && !ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: 'Lesson type must be video or text' });
  if (!isAllowedVideoUrl(video_url)) {
    return res.status(400).json({ error: 'Video URL must be from YouTube or Vimeo' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO lessons (module_id, title, type, content, video_url, duration, position, is_preview)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [module_id, title, type, content, video_url, duration, position, is_preview]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create lesson' });
  }
}

export async function updateLesson(req, res) {
  const { id } = req.params;
  const { title, type, content, video_url, duration, position, is_preview } = req.body;
  if (!isAllowedVideoUrl(video_url)) {
    return res.status(400).json({ error: 'Video URL must be from YouTube or Vimeo' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE lessons
       SET title      = COALESCE($1, title),
           type       = COALESCE($2, type),
           content    = COALESCE($3, content),
           video_url  = COALESCE($4, video_url),
           duration   = COALESCE($5, duration),
           position   = COALESCE($6, position),
           is_preview = COALESCE($7, is_preview)
       WHERE id = $8 RETURNING *`,
      [title, type, content, video_url, duration, position, is_preview, id]
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

    if (!isAdmin) {
      if (!lesson.is_preview) {
        if (!userId) return res.status(401).json({ error: 'Authentication required' });
        const { rows: enroll } = await pool.query(
          'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
          [userId, lesson.course_id]
        );
        if (!enroll.length) return res.status(403).json({ error: 'Not enrolled' });
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

export async function getCertificateEligibility(req, res) {
  const userId = req.session?.user?.id;
  const isAdmin = req.session?.user?.role === 'admin';
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  try {
    const { rows: courseRows } = await pool.query(
      'SELECT id, title FROM courses WHERE slug = $1', [req.params.slug]
    );
    if (!courseRows.length) return res.status(404).json({ error: 'Course not found' });
    const course = courseRows[0];

    if (!isAdmin) {
      const { rows: enroll } = await pool.query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [userId, course.id]
      );
      if (!enroll.length) return res.status(403).json({ eligible: false, reason: 'not_enrolled' });
    }

    const { rows: lessons } = await pool.query(
      `SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = $1`,
      [course.id]
    );
    const total = lessons.length;
    if (total === 0) return res.json({ eligible: false, reason: 'no_lessons' });

    const { rows: progress } = await pool.query(
      `SELECT COUNT(*) AS count, MAX(p.completed_at) AS last_completed
       FROM progress p
       JOIN lessons l ON l.id = p.lesson_id
       JOIN modules m ON m.id = l.module_id
       WHERE m.course_id = $1 AND p.user_id = $2`,
      [course.id, userId]
    );
    const completed = parseInt(progress[0].count, 10);
    const eligible = completed >= total;
    res.json({
      eligible,
      completed,
      total,
      course_title: course.title,
      learner_name: req.session.user!.name,
      completed_at: eligible ? (progress[0].last_completed ?? null) : null,
    });
  } catch {
    res.status(500).json({ error: 'Failed to check certificate eligibility' });
  }
}

export async function getAdminCourses(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.slug, c.title, c.description, c.short_description,
              c.thumbnail_url, c.price, c.is_published, c.created_at, c.level,
              c.series_id, s.title AS series_title,
              COUNT(DISTINCT e.id)::int AS enrollment_count,
              COUNT(DISTINCT l.id)::int AS total_lessons
       FROM courses c
       LEFT JOIN series s ON s.id = c.series_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       GROUP BY c.id, s.id
       ORDER BY c.created_at DESC`
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
         c.id, c.slug, c.title, c.description, c.short_description,
         c.what_youll_learn, c.requirements, c.level, c.language,
         c.thumbnail_url, c.price, c.is_published, c.series_id,
         c.created_at, c.updated_at,
         m.id AS m_id, m.title AS m_title, m.description AS m_desc, m.position AS m_pos,
         l.id AS l_id, l.title AS l_title, l.type AS l_type, l.content AS l_content,
         l.video_url AS l_video_url, l.duration AS l_duration, l.position AS l_pos, l.is_preview AS l_is_preview,
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
