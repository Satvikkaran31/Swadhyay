import pool from '../utils/db.js';
import { slugify } from '../utils/slugify.js';

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function getSeries(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.slug, s.title, s.description, s.thumbnail_url, s.position,
              COUNT(c.id)::int AS course_count
       FROM series s
       LEFT JOIN courses c ON c.series_id = s.id AND c.is_published = true
       WHERE s.is_published = true
       GROUP BY s.id
       ORDER BY s.position ASC, s.created_at ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch series' });
  }
}

export async function getSeriesDetail(req, res) {
  try {
    const { rows: seriesRows } = await pool.query(
      `SELECT id, slug, title, description, thumbnail_url, features, is_published, position FROM series WHERE slug = $1`,
      [req.params.slug]
    );
    if (!seriesRows.length) return res.status(404).json({ error: 'Series not found' });
    const series = seriesRows[0];
    if (!series.is_published && req.session?.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Series not found' });
    }

    const isAdminUser = req.session?.user?.role === 'admin';
    const [coursesResult, studentsResult] = await Promise.all([
      pool.query(
        `SELECT c.id, c.slug, c.title, c.short_description, c.description,
                c.thumbnail_url, c.price, c.level, c.language, c.is_published, c.created_at,
                COUNT(DISTINCT l.id)::int AS total_lessons,
                COALESCE(SUM(l.duration), 0)::int AS total_duration,
                COUNT(DISTINCT e.id)::int AS enrollment_count
         FROM courses c
         LEFT JOIN modules m ON m.course_id = c.id
         LEFT JOIN lessons l ON l.module_id = m.id
         LEFT JOIN enrollments e ON e.course_id = c.id
         WHERE c.series_id = $1 AND (c.is_published = true OR $2 = true)
         GROUP BY c.id
         ORDER BY c.created_at ASC`,
        [series.id, isAdminUser]
      ),
      pool.query(
        `SELECT COUNT(DISTINCT e.id)::int AS total_students
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE c.series_id = $1`,
        [series.id]
      ),
    ]);

    res.json({
      ...series,
      courses: coursesResult.rows,
      total_students: studentsResult.rows[0]?.total_students ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch series' });
  }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export async function getAdminSeries(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, s.slug, s.title, s.description, s.thumbnail_url, s.features,
              s.is_published, s.position, s.created_at, s.updated_at,
              COUNT(c.id)::int AS course_count
       FROM series s
       LEFT JOIN courses c ON c.series_id = s.id
       GROUP BY s.id
       ORDER BY s.position ASC, s.created_at ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch series' });
  }
}

export async function createSeries(req, res) {
  const { title, description, thumbnail_url, features, is_published = false, position = 0 } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const slug = slugify(title);
  try {
    const { rows } = await pool.query(
      `INSERT INTO series (slug, title, description, thumbnail_url, features, is_published, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [slug, title, description, thumbnail_url, JSON.stringify(features ?? []), is_published, position]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'A series with this title already exists' });
    res.status(500).json({ error: 'Failed to create series' });
  }
}

export async function updateSeries(req, res) {
  const { id } = req.params;
  const { title, description, thumbnail_url, features, is_published, position } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE series
       SET title         = COALESCE($1, title),
           description   = $2,
           thumbnail_url = COALESCE($3, thumbnail_url),
           features      = COALESCE($4, features),
           is_published  = COALESCE($5, is_published),
           position      = COALESCE($6, position),
           updated_at    = NOW()
       WHERE id = $7 RETURNING *`,
      [title, description ?? null, thumbnail_url, features !== undefined ? JSON.stringify(features) : undefined, is_published, position, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Series not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update series' });
  }
}

export async function deleteSeries(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM series WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Series not found' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete series' });
  }
}
