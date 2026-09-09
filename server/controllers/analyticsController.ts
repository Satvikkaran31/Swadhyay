import pool from '../utils/db.js';
import { scheduleAutomationsForLead } from './crmController.js';

// Whitelisted event types the public tracker may record. Anything else is dropped.
const VALID_EVENTS = new Set([
  'page_view', 'course_view', 'lesson_view', 'video_play', 'cta_click', 'signup',
]);

const clip = (v: unknown, n: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, n) : null;
};

// Coarse device class from the User-Agent — more trustworthy than a client field.
function deviceFromUA(ua: string | undefined): string {
  if (!ua) return 'unknown';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Public, unauthenticated ingest endpoint. The frontend beacons one row per
 * meaningful interaction. We resolve the person as far as we can (session user →
 * matching lead → anonymous visitor_id) and keep each identified lead's
 * engagement counters fresh so the CRM can prioritise warm contacts.
 */
export async function trackEvent(req, res) {
  // Always ack fast — analytics must never block or error the user's browsing.
  res.status(204).end();

  try {
    const visitorId = clip(req.body?.visitor_id, 64);
    const eventType = clip(req.body?.event_type, 32) || 'page_view';
    if (!visitorId || !VALID_EVENTS.has(eventType)) return;

    const path       = clip(req.body?.path, 512);
    const referrer   = clip(req.body?.referrer, 512);
    const utmSource  = clip(req.body?.utm_source, 128);
    const utmMedium  = clip(req.body?.utm_medium, 128);
    const utmCampaign = clip(req.body?.utm_campaign, 128);
    const device     = deviceFromUA(req.headers['user-agent']);

    const sessionUser = req.session?.user;
    const userId = sessionUser?.id ?? null;

    // Resolve course_id: trust an explicit id, else map a /courses/:slug path.
    let courseId: number | null = null;
    const rawCourseId = Number(req.body?.course_id);
    if (Number.isInteger(rawCourseId) && rawCourseId > 0) {
      courseId = rawCourseId;
    } else if (path) {
      const m = path.match(/^\/courses\/([^/?#]+)/);
      if (m) {
        const { rows } = await pool.query('SELECT id FROM courses WHERE slug = $1', [m[1]]);
        courseId = rows[0]?.id ?? null;
      }
    }

    // Link to an existing lead by identity (logged-in email) or by visitor_id.
    let leadId: number | null = null;
    if (sessionUser?.email) {
      const { rows } = await pool.query('SELECT id FROM leads WHERE lower(email) = lower($1)', [sessionUser.email]);
      leadId = rows[0]?.id ?? null;
    }
    if (!leadId) {
      const { rows } = await pool.query('SELECT id FROM leads WHERE visitor_id = $1 LIMIT 1', [visitorId]);
      leadId = rows[0]?.id ?? null;
    }

    await pool.query(
      `INSERT INTO page_views
         (visitor_id, user_id, lead_id, event_type, path, course_id, referrer, utm_source, utm_medium, utm_campaign, device)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [visitorId, userId, leadId, eventType, path, courseId, referrer, utmSource, utmMedium, utmCampaign, device]
    );

    if (leadId) {
      await pool.query(
        `UPDATE leads
            SET last_seen_at     = NOW(),
                first_seen_at    = COALESCE(first_seen_at, NOW()),
                visitor_id       = COALESCE(visitor_id, $2),
                page_view_count  = page_view_count + 1,
                -- Monotonic: activity only ever raises the score; never drop a
                -- higher score already earned (e.g. the login/booking bonus).
                engagement_score = LEAST(100, GREATEST(engagement_score, (page_view_count + 1) * 5 + 10))
          WHERE id = $1`,
        [leadId, visitorId]
      );
    }
  } catch (err: any) {
    console.error('analytics.trackEvent error:', err.message);
  }
}

/**
 * Auto-capture a signed-in visitor as a CRM lead. Called from the Google login
 * handler so every person who authenticates becomes a contact automatically,
 * carrying their anonymous browsing history across via visitor_id.
 */
export async function captureLeadFromLogin(
  user: { name?: string; email?: string },
  visitorId?: string | null
) {
  if (!user?.email) return;
  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (name, email, source, status, visitor_id, first_seen_at, last_seen_at, engagement_score)
       VALUES ($1, $2, 'login', 'new', $3, NOW(), NOW(), 25)
       ON CONFLICT (lower(email)) DO UPDATE
         SET name          = CASE WHEN leads.name = leads.email THEN EXCLUDED.name ELSE leads.name END,
             visitor_id    = COALESCE(leads.visitor_id, EXCLUDED.visitor_id),
             first_seen_at = COALESCE(leads.first_seen_at, NOW()),
             last_seen_at  = NOW(),
             updated_at    = NOW()
       RETURNING id, (xmax = 0) AS is_insert`,
      [user.name || user.email, user.email.toLowerCase().trim(), visitorId?.slice(0, 64) || null]
    );
    // Back-fill any anonymous events from this browser onto the new lead.
    if (visitorId && rows[0]) {
      await pool.query(
        'UPDATE page_views SET lead_id = $1 WHERE visitor_id = $2 AND lead_id IS NULL',
        [rows[0].id, visitorId.slice(0, 64)]
      );
    }
    if (rows[0]?.is_insert) {
      await scheduleAutomationsForLead(rows[0].id, 'login');
    }
  } catch (err: any) {
    console.error('analytics.captureLeadFromLogin error:', err.message);
  }
}

/**
 * Admin analytics roll-up over the last `days` window. One endpoint feeds the
 * whole dashboard: KPIs, daily traffic, top courses/pages, sources, devices,
 * the acquisition funnel, and a live activity feed.
 */
export async function getAnalyticsOverview(req, res) {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
  const since = `${days} days`;

  try {
    const [
      kpis, timeseries, topCourses, topPages, sources, devices, funnel, recent, scoreboard,
    ] = await Promise.all([
      // ── Headline KPIs for the window ──
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE event_type = 'page_view')            AS page_views,
           COUNT(DISTINCT visitor_id)                                  AS unique_visitors,
           COUNT(*) FILTER (WHERE event_type = 'course_view')          AS course_views,
           COUNT(DISTINCT visitor_id) FILTER (WHERE user_id IS NOT NULL) AS known_visitors
         FROM page_views
         WHERE created_at >= NOW() - $1::interval`,
        [since]
      ),
      // ── Daily traffic timeseries (zero-filled) ──
      pool.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
                COALESCE(COUNT(pv.id) FILTER (WHERE pv.event_type = 'page_view'), 0)::int AS page_views,
                COALESCE(COUNT(DISTINCT pv.visitor_id), 0)::int                           AS visitors
         FROM generate_series(
                (NOW() - $1::interval)::date, NOW()::date, INTERVAL '1 day'
              ) AS d(day)
         LEFT JOIN page_views pv ON pv.created_at::date = d.day
         GROUP BY d.day ORDER BY d.day`,
        [since]
      ),
      // ── Most-viewed courses ──
      pool.query(
        `SELECT c.id AS course_id, c.title, c.slug,
                COUNT(pv.id)::int                  AS views,
                COUNT(DISTINCT pv.visitor_id)::int AS unique_visitors
         FROM page_views pv
         JOIN courses c ON c.id = pv.course_id
         WHERE pv.created_at >= NOW() - $1::interval AND pv.course_id IS NOT NULL
         GROUP BY c.id, c.title, c.slug
         ORDER BY views DESC LIMIT 10`,
        [since]
      ),
      // ── Most-visited pages ──
      pool.query(
        `SELECT path,
                COUNT(*)::int                  AS views,
                COUNT(DISTINCT visitor_id)::int AS unique_visitors
         FROM page_views
         WHERE created_at >= NOW() - $1::interval AND event_type = 'page_view' AND path IS NOT NULL
         GROUP BY path ORDER BY views DESC LIMIT 12`,
        [since]
      ),
      // ── Traffic sources (utm_source, else referrer host, else direct) ──
      pool.query(
        `SELECT source, COUNT(DISTINCT visitor_id)::int AS visitors
         FROM (
           SELECT visitor_id,
                  COALESCE(
                    NULLIF(utm_source, ''),
                    CASE WHEN referrer IS NULL OR referrer = '' THEN 'direct'
                         ELSE regexp_replace(referrer, '^https?://(www\\.)?([^/]+).*$', '\\2') END
                  ) AS source
           FROM page_views
           WHERE created_at >= NOW() - $1::interval
         ) s
         GROUP BY source ORDER BY visitors DESC LIMIT 10`,
        [since]
      ),
      // ── Device split ──
      pool.query(
        `SELECT COALESCE(device, 'unknown') AS device, COUNT(DISTINCT visitor_id)::int AS visitors
         FROM page_views
         WHERE created_at >= NOW() - $1::interval
         GROUP BY device ORDER BY visitors DESC`,
        [since]
      ),
      // ── Acquisition funnel ──
      pool.query(
        `SELECT
           (SELECT COUNT(DISTINCT visitor_id) FROM page_views WHERE created_at >= NOW() - $1::interval) AS visitors,
           (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - $1::interval)                        AS leads,
           (SELECT COUNT(*) FROM enrollments WHERE enrolled_at >= NOW() - $1::interval)                 AS enrollments`,
        [since]
      ),
      // ── Live activity feed ──
      pool.query(
        `SELECT pv.event_type, pv.path, pv.device, pv.created_at,
                COALESCE(u.name, l.name) AS person, pv.visitor_id, c.title AS course_title
         FROM page_views pv
         LEFT JOIN users u   ON u.id = pv.user_id
         LEFT JOIN leads l   ON l.id = pv.lead_id
         LEFT JOIN courses c ON c.id = pv.course_id
         ORDER BY pv.created_at DESC LIMIT 20`
      ),
      // ── Most engaged leads (lead-quality scoreboard) ──
      pool.query(
        `SELECT id, name, email, source, status, engagement_score, page_view_count, last_seen_at
         FROM leads
         WHERE engagement_score > 0
         ORDER BY engagement_score DESC, last_seen_at DESC NULLS LAST
         LIMIT 10`
      ),
    ]);

    const k = kpis.rows[0] || {};
    const f = funnel.rows[0] || {};

    res.json({
      range_days: days,
      kpis: {
        page_views:      Number(k.page_views || 0),
        unique_visitors: Number(k.unique_visitors || 0),
        course_views:    Number(k.course_views || 0),
        known_visitors:  Number(k.known_visitors || 0),
        new_leads:       Number(f.leads || 0),
        enrollments:     Number(f.enrollments || 0),
      },
      timeseries: timeseries.rows,
      top_courses: topCourses.rows,
      top_pages: topPages.rows,
      sources: sources.rows,
      devices: devices.rows,
      funnel: {
        visitors:    Number(f.visitors || 0),
        leads:       Number(f.leads || 0),
        enrollments: Number(f.enrollments || 0),
      },
      recent_activity: recent.rows,
      top_leads: scoreboard.rows,
    });
  } catch (err: any) {
    console.error('analytics.getAnalyticsOverview error:', err.message);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
}
