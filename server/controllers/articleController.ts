import pool from '../utils/db.js';
import { slugify } from '../utils/slugify.js';

export const getArticles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, excerpt, thumbnail_url, author, tags, published_at, created_at
       FROM articles WHERE is_published = true ORDER BY published_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getArticles error:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

export const getArticle = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM articles WHERE slug = $1 AND is_published = true',
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getArticle error:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

export const getRelatedArticles = async (req, res) => {
  try {
    const { rows: current } = await pool.query(
      'SELECT id, tags FROM articles WHERE slug = $1 AND is_published = true',
      [req.params.slug]
    );
    if (!current.length) return res.json([]);
    const { id, tags } = current[0];
    if (!tags?.length) return res.json([]);

    const { rows } = await pool.query(
      `SELECT id, slug, title, excerpt, thumbnail_url, author, tags, published_at
       FROM articles
       WHERE is_published = true AND id != $1 AND tags && $2
       ORDER BY published_at DESC LIMIT 3`,
      [id, tags]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch related articles' });
  }
};

export const getAdminArticles = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, slug, title, excerpt, thumbnail_url, author, tags, is_published, published_at, created_at
       FROM articles ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAdminArticles error:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

export const createArticle = async (req, res) => {
  const { title, excerpt, content, thumbnail_url, author = 'Neha', tags = [], is_published = false } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const slug = slugify(title);
  const published_at = is_published ? new Date() : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO articles (slug, title, excerpt, content, thumbnail_url, author, tags, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [slug, title, excerpt, content, thumbnail_url, author, tags, is_published, published_at]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'An article with this title already exists' });
    console.error('createArticle error:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

export const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, excerpt, content, thumbnail_url, author, tags, is_published } = req.body;

  try {
    const { rows: current } = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (current.length === 0) return res.status(404).json({ error: 'Article not found' });
    const curr = current[0];

    let published_at = curr.published_at;
    if (is_published && !curr.is_published && !curr.published_at) {
      published_at = new Date();
    }

    const { rows } = await pool.query(
      `UPDATE articles
       SET title=$1, excerpt=$2, content=$3, thumbnail_url=$4, author=$5,
           tags=$6, is_published=$7, published_at=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [
        title ?? curr.title,
        excerpt ?? curr.excerpt,
        content ?? curr.content,
        thumbnail_url ?? curr.thumbnail_url,
        author ?? curr.author,
        tags ?? curr.tags,
        is_published ?? curr.is_published,
        published_at,
        id,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('updateArticle error:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteArticle error:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const [enrollments, revenue, courses, articles, subscribers] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM enrollments'),
      pool.query(
        `SELECT COALESCE(SUM(c.price), 0) AS revenue
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.payment_id IS NOT NULL`
      ),
      pool.query('SELECT COUNT(*) FROM courses'),
      pool.query('SELECT COUNT(*) FROM articles WHERE is_published = true'),
      pool.query('SELECT COUNT(*) FROM newsletter_subscribers'),
    ]);

    res.json({
      total_enrollments: parseInt(enrollments.rows[0].count, 10),
      revenue: parseInt(revenue.rows[0].revenue, 10),
      total_courses: parseInt(courses.rows[0].count, 10),
      published_articles: parseInt(articles.rows[0].count, 10),
      newsletter_subscribers: parseInt(subscribers.rows[0].count, 10),
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
