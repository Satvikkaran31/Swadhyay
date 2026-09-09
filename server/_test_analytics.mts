// Integration test harness for the analytics feature. Invokes the real route
// handlers with mock req/res against the live dev DB, then cleans up. Run:
//   RESEND_API_KEY=x npx tsx _test_analytics.mts
import 'dotenv/config';
import pool from './utils/db.js';
import { trackEvent, captureLeadFromLogin, getAnalyticsOverview } from './controllers/analyticsController.js';

let pass = 0, fail = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
};

function mockRes() {
  const r: any = { _status: 200, _json: undefined, _ended: false, _body: undefined };
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (j: any) => { r._json = j; return r; };
  r.end = () => { r._ended = true; return r; };
  r.set = () => r;
  r.send = (b: any) => { r._body = b; return r; };
  return r;
}
const req = (o: any = {}) => ({ body: {}, query: {}, headers: {}, session: undefined, ...o });

const TAG = 'test-' + Date.now();
const vid = (s: string) => `${TAG}-${s}`;
const countPV = async (v: string) =>
  Number((await pool.query('SELECT count(*) FROM page_views WHERE visitor_id=$1', [v])).rows[0].count);

async function run() {
  console.log('\n── trackEvent ──');
  {
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('a'), event_type: 'page_view', path: '/' }, headers: { 'user-agent': 'Mozilla/5.0 (Windows)' } }), r);
    ok(r._status === 204 && r._ended, 'valid page_view → 204');
    ok((await countPV(vid('a'))) === 1, 'page_view row inserted');
    const dev = (await pool.query('SELECT device FROM page_views WHERE visitor_id=$1', [vid('a')])).rows[0].device;
    ok(dev === 'desktop', `desktop UA → device=desktop (got ${dev})`);
  }
  {
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('m'), event_type: 'page_view' }, headers: { 'user-agent': 'iPhone Mobi' } }), r);
    const dev = (await pool.query('SELECT device FROM page_views WHERE visitor_id=$1', [vid('m')])).rows[0]?.device;
    ok(dev === 'mobile', `mobile UA → device=mobile (got ${dev})`);
  }
  {
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('t'), event_type: 'page_view' }, headers: { 'user-agent': 'iPad Tablet' } }), r);
    const dev = (await pool.query('SELECT device FROM page_views WHERE visitor_id=$1', [vid('t')])).rows[0]?.device;
    ok(dev === 'tablet', `iPad UA → device=tablet (got ${dev})`);
  }
  {
    // course_view with explicit id
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('c'), event_type: 'course_view', course_id: 2, path: '/courses/who-am-i' } }), r);
    const cid = (await pool.query('SELECT course_id FROM page_views WHERE visitor_id=$1', [vid('c')])).rows[0]?.course_id;
    ok(cid === 2, `explicit course_id honoured (got ${cid})`);
  }
  {
    // server resolves course_id from /courses/:slug when client omits it
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('r'), event_type: 'page_view', path: '/courses/who-am-i' } }), r);
    const cid = (await pool.query('SELECT course_id FROM page_views WHERE visitor_id=$1', [vid('r')])).rows[0]?.course_id;
    ok(cid === 2, `course_id resolved from path slug (got ${cid})`);
  }
  {
    // bad slug → null course_id, still 204
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('badslug'), event_type: 'page_view', path: '/courses/does-not-exist' } }), r);
    const cid = (await pool.query('SELECT course_id FROM page_views WHERE visitor_id=$1', [vid('badslug')])).rows[0]?.course_id;
    ok(cid === null, 'unknown slug → course_id null');
  }
  {
    // invalid event type dropped
    const r = mockRes();
    await trackEvent(req({ body: { visitor_id: vid('x'), event_type: 'evil' } }), r);
    ok(r._status === 204, 'invalid event_type still → 204');
    ok((await countPV(vid('x'))) === 0, 'invalid event_type → no row');
  }
  {
    // missing visitor_id dropped
    const r = mockRes();
    await trackEvent(req({ body: { event_type: 'page_view' } }), r);
    ok(r._status === 204, 'missing visitor_id still → 204');
  }
  {
    // oversized fields clipped, injection-safe (parameterised)
    const r = mockRes();
    const huge = 'x'.repeat(5000);
    await trackEvent(req({ body: { visitor_id: vid('big'), event_type: 'page_view', path: huge, referrer: "'; DROP TABLE leads;--" } }), r);
    const row = (await pool.query('SELECT path, referrer FROM page_views WHERE visitor_id=$1', [vid('big')])).rows[0];
    ok(row.path.length === 512, `path clipped to 512 (got ${row.path.length})`);
    ok(row.referrer === "'; DROP TABLE leads;--", 'SQL-injection string stored inertly (parameterised)');
    ok((await pool.query("SELECT to_regclass('public.leads')")).rows[0].to_regclass === 'leads', 'leads table survived injection attempt');
  }

  console.log('\n── captureLeadFromLogin ──');
  const email = `${TAG}@example.com`;
  {
    // seed an anonymous event, then log in and expect back-fill
    await trackEvent(req({ body: { visitor_id: vid('login'), event_type: 'page_view', path: '/pricing' } }), mockRes());
    await captureLeadFromLogin({ name: 'Test Person', email }, vid('login'));
    const lead = (await pool.query('SELECT * FROM leads WHERE lower(email)=lower($1)', [email])).rows[0];
    ok(!!lead, 'lead created on login');
    ok(lead?.source === 'login', `lead source=login (got ${lead?.source})`);
    ok(lead?.engagement_score === 25, `initial engagement_score=25 (got ${lead?.engagement_score})`);
    ok(lead?.visitor_id === vid('login'), 'visitor_id linked to lead');
    const backfilled = Number((await pool.query('SELECT count(*) FROM page_views WHERE visitor_id=$1 AND lead_id=$2', [vid('login'), lead.id])).rows[0].count);
    ok(backfilled === 1, `prior anon event back-filled onto lead (got ${backfilled})`);
  }
  {
    // idempotent: second login must not duplicate and must not clobber a real name
    await captureLeadFromLogin({ name: 'Different Name', email }, vid('login'));
    const rows = (await pool.query('SELECT * FROM leads WHERE lower(email)=lower($1)', [email])).rows;
    ok(rows.length === 1, 'repeat login → no duplicate lead');
    ok(rows[0].name === 'Test Person', 'existing real name preserved on re-login');
  }
  {
    // no email → no-op, no throw
    let threw = false;
    try { await captureLeadFromLogin({ name: 'x' } as any, null); } catch { threw = true; }
    ok(!threw, 'captureLeadFromLogin with no email is a safe no-op');
  }
  {
    // a subsequent tracked event as the logged-in user bumps engagement
    const lead = (await pool.query('SELECT * FROM leads WHERE lower(email)=lower($1)', [email])).rows[0];
    const before = lead.engagement_score, pvBefore = lead.page_view_count;
    // Use a real user id (session users always reference a live users row in prod).
    const realUserId = (await pool.query('SELECT id FROM users ORDER BY id LIMIT 1')).rows[0].id;
    await trackEvent(req({ body: { visitor_id: vid('login'), event_type: 'page_view', path: '/' }, session: { user: { id: realUserId, email: 'no-lead-match@example.com' } } }), mockRes());
    const after = (await pool.query('SELECT * FROM leads WHERE lower(email)=lower($1)', [email])).rows[0];
    ok(after.page_view_count === pvBefore + 1, `page_view_count incremented ${pvBefore}→${after.page_view_count}`);
    ok(after.engagement_score >= before, `engagement_score never drops below earned (${before}→${after.engagement_score})`);
    ok(after.last_seen_at !== null, 'last_seen_at set');
    // Fire several more events; the score must climb past the initial login bonus.
    for (let i = 0; i < 6; i++) {
      await trackEvent(req({ body: { visitor_id: vid('login'), event_type: 'page_view', path: '/courses' } }), mockRes());
    }
    const climbed = (await pool.query('SELECT engagement_score, page_view_count FROM leads WHERE lower(email)=lower($1)', [email])).rows[0];
    ok(climbed.engagement_score > before, `engagement_score climbs with activity (${before}→${climbed.engagement_score} over ${climbed.page_view_count} views)`);
    ok(climbed.engagement_score <= 100, 'engagement_score capped at 100');
  }

  console.log('\n── getAnalyticsOverview ──');
  {
    const r = mockRes();
    await getAnalyticsOverview(req({ query: { days: '30' } }), r);
    ok(r._status === 200, `overview → 200 (got ${r._status})`);
    const d = r._json;
    ok(d && typeof d === 'object', 'overview returns an object');
    ok(d.range_days === 30, `range_days=30 (got ${d?.range_days})`);
    for (const key of ['kpis', 'timeseries', 'top_courses', 'top_pages', 'sources', 'devices', 'funnel', 'recent_activity', 'top_leads']) {
      ok(key in d, `payload has "${key}"`);
    }
    ok(Array.isArray(d.timeseries) && d.timeseries.length === 31, `timeseries zero-filled to 31 days (got ${d.timeseries?.length})`);
    ok(typeof d.kpis.page_views === 'number', 'kpis.page_views is a number (not a pg string)');
    ok(typeof d.funnel.visitors === 'number', 'funnel.visitors is a number');
    ok(Array.isArray(d.top_courses) && d.top_courses.every((c: any) => typeof c.views === 'number'), 'top_courses views are numbers');
    // Ordering: top_courses descending by views
    const views = d.top_courses.map((c: any) => c.views);
    ok(views.every((v: number, i: number) => i === 0 || views[i - 1] >= v), 'top_courses sorted desc by views');
  }
  {
    // clamping: 0/NaN fall back to the 30-day default; valid values clamp to [1,365]
    const lo = mockRes(); await getAnalyticsOverview(req({ query: { days: '0' } }), lo);
    ok(lo._json.range_days === 30, `days=0 falls back to default 30 (got ${lo._json?.range_days})`);
    const neg = mockRes(); await getAnalyticsOverview(req({ query: { days: '-5' } }), neg);
    ok(neg._json.range_days === 1, `days=-5 clamps up to 1 (got ${neg._json?.range_days})`);
    const hi = mockRes(); await getAnalyticsOverview(req({ query: { days: '9999' } }), hi);
    ok(hi._json.range_days === 365, `days=9999 clamps to 365 (got ${hi._json?.range_days})`);
    const bad = mockRes(); await getAnalyticsOverview(req({ query: { days: 'abc' } }), bad);
    ok(bad._json.range_days === 30, `days=abc defaults to 30 (got ${bad._json?.range_days})`);
  }

  // ── cleanup ──
  console.log('\n── cleanup ──');
  const delPV = await pool.query('DELETE FROM page_views WHERE visitor_id LIKE $1', [`${TAG}%`]);
  const delLead = await pool.query('DELETE FROM leads WHERE lower(email)=lower($1)', [email]);
  console.log(`  removed ${delPV.rowCount} page_views, ${delLead.rowCount} lead`);
  ok((await pool.query('SELECT count(*) FROM page_views WHERE visitor_id LIKE $1', [`${TAG}%`])).rows[0].count === '0', 'all test events cleaned');

  console.log(`\n═══ ${pass} passed, ${fail} failed ═══`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}

run().catch(async (e) => { console.error('HARNESS ERROR:', e); await pool.end().catch(() => {}); process.exit(2); });
