-- Remove all seeded demo analytics data. Run with:
--   psql "$POSTGRES_URL" -f server/scripts_clear_demo_analytics.sql
DELETE FROM page_views WHERE visitor_id LIKE 'demo-%';
DELETE FROM leads      WHERE email LIKE 'demo.lead.%';
