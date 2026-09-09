// End-to-end workflow integration tests: real controllers, live DB, full cleanup.
//   RESEND_API_KEY=x npx tsx _test_workflows.mts
import 'dotenv/config';
import pool from './utils/db.js';
import { enroll, checkEnrollment, getMyEnrollments } from './controllers/enrollmentController.js';
import { markComplete, getCourseProgress } from './controllers/progressController.js';
import { getNote, saveNote } from './controllers/notesController.js';
import { submitReview, getCourseReviews, deleteReview } from './controllers/reviewController.js';
import { getCourseLearning, getCertificateEligibility,
         createCourse, updateCourse, deleteCourse,
         createModule, deleteModule, createLesson, deleteLesson } from './controllers/courseController.js';
import { createArticle, updateArticle, deleteArticle } from './controllers/articleController.js';
import { createSeries, updateSeries, deleteSeries } from './controllers/seriesController.js';
import { createTestimonial, updateTestimonial, deleteTestimonial } from './controllers/testimonialController.js';
import { getInstructor, updateInstructor } from './controllers/instructorController.js';
import { updateUserRole } from './controllers/userController.js';
import { createLead, updateLead, deleteLead, getLeads, getCRMStats,
         createTemplate, updateTemplate, deleteTemplate } from './controllers/crmController.js';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ FAIL: ${m}`); } };
function mockRes() {
  const r: any = { _status: 200, _json: undefined, _ended: false };
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (j: any) => { r._json = j; return r; };
  r.end = () => { r._ended = true; return r; };
  r.set = () => r; r.send = (b: any) => { r._json = b; return r; };
  return r;
}
const req = (o: any = {}) => ({ body: {}, query: {}, params: {}, headers: {}, session: undefined, ...o });
const sess = (id: number, role = 'student') => ({ user: { id, role, email: `u${id}@t`, name: 'T' } });
const call = async (fn: any, r: any) => { const res = mockRes(); await fn(r, res); return res; };

const COURSE = { slug: 'leadership-presence', id: 3, lesson: 61 };
const OTHER  = { slug: 'who-am-i', id: 2 };
const TAG = 'wftest-' + Date.now();

async function run() {
  // Disposable learner
  const u = (await pool.query(
    `INSERT INTO users (google_id, name, email, role) VALUES ($1,$2,$3,'student') RETURNING id`,
    [`${TAG}-gid`, 'WF Test User', `${TAG}@test.local`]
  )).rows[0];
  const UID = u.id;
  console.log(`\n(test learner id=${UID})`);

  console.log('\n── ENROLLMENT ──');
  let r = await call(enroll, req({ session: sess(UID), body: { course_id: COURSE.id } }));
  ok(r._status >= 200 && r._status < 300, `enroll → ${r._status}`);
  const enrolled = (await pool.query('SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2', [UID, COURSE.id])).rowCount === 1;
  ok(enrolled, 'enrollment row created');
  r = await call(enroll, req({ session: sess(UID), body: { course_id: COURSE.id } }));
  const dupCount = (await pool.query('SELECT count(*) FROM enrollments WHERE user_id=$1 AND course_id=$2', [UID, COURSE.id])).rows[0].count;
  ok(Number(dupCount) === 1, `duplicate enroll does not duplicate (count=${dupCount})`);
  r = await call(checkEnrollment, req({ session: sess(UID), params: { course_id: String(COURSE.id) } }));
  ok(r._json?.enrolled === true, 'checkEnrollment → enrolled:true');
  r = await call(checkEnrollment, req({ session: sess(UID), params: { course_id: String(OTHER.id) } }));
  ok(r._json?.enrolled === false, 'checkEnrollment other course → enrolled:false');
  r = await call(getMyEnrollments, req({ session: sess(UID) }));
  ok(Array.isArray(r._json) && r._json.some((c: any) => c.id === COURSE.id), 'getMyEnrollments includes course');

  console.log('\n── LEARN ACCESS ──');
  r = await call(getCourseLearning, req({ session: sess(UID), params: { slug: COURSE.slug } }));
  ok(r._status === 200 && r._json?.modules?.length > 0, 'enrolled learner gets curriculum');
  ok(r._json?.modules?.[0]?.lessons?.[0]?.content !== undefined || r._json?.modules?.[0]?.lessons?.[0]?.video_url !== undefined, 'lessons include content/video');
  r = await call(getCourseLearning, req({ session: sess(UID), params: { slug: OTHER.slug } }));
  ok(r._status === 403, `learn on non-enrolled course → 403 (got ${r._status})`);
  r = await call(getCourseLearning, req({ session: sess(1, 'admin'), params: { slug: OTHER.slug } }));
  ok(r._status === 200, 'admin bypasses enrollment on learn');

  console.log('\n── PROGRESS ──');
  r = await call(markComplete, req({ session: sess(UID), body: { lesson_id: COURSE.lesson } }));
  ok(r._status >= 200 && r._status < 300, `markComplete → ${r._status}`);
  r = await call(getCourseProgress, req({ session: sess(UID), params: { course_id: String(COURSE.id) } }));
  ok(Array.isArray(r._json?.completed_lesson_ids) && r._json.completed_lesson_ids.includes(COURSE.lesson), 'progress reflects completed lesson');

  console.log('\n── NOTES ──');
  await call(saveNote, req({ session: sess(UID), params: { lesson_id: String(COURSE.lesson) }, body: { content: 'my note text' } }));
  r = await call(getNote, req({ session: sess(UID), params: { lesson_id: String(COURSE.lesson) } }));
  ok(r._json?.content === 'my note text', 'note saved and read back');
  await call(saveNote, req({ session: sess(UID), params: { lesson_id: String(COURSE.lesson) }, body: { content: 'edited' } }));
  r = await call(getNote, req({ session: sess(UID), params: { lesson_id: String(COURSE.lesson) } }));
  ok(r._json?.content === 'edited', 'note update overwrites');

  console.log('\n── REVIEWS ──');
  r = await call(submitReview, req({ session: sess(UID), params: { slug: COURSE.slug }, body: { rating: 5, body: 'great' } }));
  ok(r._status === 201, `submit review (enrolled) → ${r._status}`);
  r = await call(submitReview, req({ session: sess(UID), params: { slug: COURSE.slug }, body: { rating: 0 } }));
  ok(r._status === 400, `rating 0 rejected → ${r._status}`);
  r = await call(submitReview, req({ session: sess(UID), params: { slug: COURSE.slug }, body: { rating: 6 } }));
  ok(r._status === 400, `rating 6 rejected → ${r._status}`);
  r = await call(submitReview, req({ session: sess(UID), params: { slug: OTHER.slug }, body: { rating: 5 } }));
  ok(r._status === 403, `review on non-enrolled course → ${r._status}`);
  r = await call(submitReview, req({ session: sess(UID), params: { slug: COURSE.slug }, body: { rating: 3, body: 'updated' } }));
  const rv = (await pool.query('SELECT rating,body FROM reviews WHERE user_id=$1 AND course_id=$2', [UID, COURSE.id])).rows[0];
  ok(Number(rv.rating) === 3 && rv.body === 'updated', 'review upsert updates existing (no duplicate)');
  r = await call(getCourseReviews, req({ params: { slug: COURSE.slug } }));
  ok(Array.isArray(r._json) && r._json.some((x: any) => x.body === 'updated'), 'getCourseReviews returns it');

  console.log('\n── CERTIFICATE ──');
  r = await call(getCertificateEligibility, req({ session: sess(UID), params: { slug: COURSE.slug } }));
  ok(r._status === 200 && typeof r._json === 'object', `certificate eligibility responds (eligible=${r._json?.eligible})`);

  console.log('\n── ADMIN: COURSE CRUD ──');
  r = await call(createCourse, req({ session: sess(1, 'admin'), body: { title: `${TAG} Course`, description: 'd', price: 0 } }));
  const cId = r._json?.id; ok(r._status === 201 && !!cId, `createCourse → id ${cId}`);
  r = await call(createModule, req({ session: sess(1, 'admin'), body: { course_id: cId, title: 'M1' } }));
  const mId = r._json?.id; ok(!!mId, `createModule → id ${mId}`);
  r = await call(createLesson, req({ session: sess(1, 'admin'), body: { module_id: mId, title: 'L1', type: 'text', content: 'hi' } }));
  const lId = r._json?.id; ok(!!lId, `createLesson → id ${lId}`);
  r = await call(updateCourse, req({ session: sess(1, 'admin'), params: { id: String(cId) }, body: { title: `${TAG} Renamed`, price: 100 } }));
  const newTitle = (await pool.query('SELECT title,price FROM courses WHERE id=$1', [cId])).rows[0];
  ok(newTitle.title === `${TAG} Renamed`, 'updateCourse persisted');
  await call(deleteLesson, req({ session: sess(1, 'admin'), params: { id: String(lId) } }));
  await call(deleteModule, req({ session: sess(1, 'admin'), params: { id: String(mId) } }));
  r = await call(deleteCourse, req({ session: sess(1, 'admin'), params: { id: String(cId) } }));
  ok((await pool.query('SELECT 1 FROM courses WHERE id=$1', [cId])).rowCount === 0, 'deleteCourse removed it');

  console.log('\n── ADMIN: ARTICLE / SERIES / TESTIMONIAL CRUD ──');
  r = await call(createArticle, req({ session: sess(1, 'admin'), body: { title: `${TAG} Art`, content: 'body', author: 'Neha Sharma' } }));
  const aId = r._json?.id; ok(!!aId, `createArticle → ${aId}`);
  await call(updateArticle, req({ session: sess(1, 'admin'), params: { id: String(aId) }, body: { title: `${TAG} Art2`, is_published: true } }));
  ok((await pool.query('SELECT title FROM articles WHERE id=$1', [aId])).rows[0]?.title === `${TAG} Art2`, 'updateArticle persisted');
  await call(deleteArticle, req({ session: sess(1, 'admin'), params: { id: String(aId) } }));
  ok((await pool.query('SELECT 1 FROM articles WHERE id=$1', [aId])).rowCount === 0, 'deleteArticle removed it');

  r = await call(createSeries, req({ session: sess(1, 'admin'), body: { title: `${TAG} Series`, description: 'd' } }));
  const sId = r._json?.id; ok(!!sId, `createSeries → ${sId}`);
  await call(updateSeries, req({ session: sess(1, 'admin'), params: { id: String(sId) }, body: { title: `${TAG} Series2`, description: 'd2' } }));
  ok((await pool.query('SELECT title FROM series WHERE id=$1', [sId])).rows[0]?.title === `${TAG} Series2`, 'updateSeries persisted');
  await call(deleteSeries, req({ session: sess(1, 'admin'), params: { id: String(sId) } }));
  ok((await pool.query('SELECT 1 FROM series WHERE id=$1', [sId])).rowCount === 0, 'deleteSeries removed it');

  r = await call(createTestimonial, req({ session: sess(1, 'admin'), body: { name: `${TAG} T`, role: 'CEO', quote: 'q' } }));
  const tId = r._json?.id; ok(!!tId, `createTestimonial → ${tId}`);
  await call(updateTestimonial, req({ session: sess(1, 'admin'), params: { id: String(tId) }, body: { name: `${TAG} T`, role: 'CTO', quote: 'q2', is_published: true } }));
  ok((await pool.query('SELECT role FROM testimonials WHERE id=$1', [tId])).rows[0]?.role === 'CTO', 'updateTestimonial persisted');
  await call(deleteTestimonial, req({ session: sess(1, 'admin'), params: { id: String(tId) } }));
  ok((await pool.query('SELECT 1 FROM testimonials WHERE id=$1', [tId])).rowCount === 0, 'deleteTestimonial removed it');

  console.log('\n── ADMIN: INSTRUCTOR (non-destructive) ──');
  r = await call(getInstructor, req({}));
  const bio0 = r._json?.bio;
  r = await call(updateInstructor, req({ session: sess(1, 'admin'), body: { ...r._json } }));
  ok(r._status >= 200 && r._status < 300, `updateInstructor round-trip → ${r._status}`);
  ok((await pool.query('SELECT bio FROM instructor_profiles LIMIT 1')).rows[0]?.bio === bio0, 'instructor bio unchanged (round-trip)');

  console.log('\n── ADMIN: USER ROLE ──');
  await call(updateUserRole, req({ session: sess(1, 'admin'), params: { id: String(UID) }, body: { role: 'admin' } }));
  ok((await pool.query('SELECT role FROM users WHERE id=$1', [UID])).rows[0]?.role === 'admin', 'updateUserRole → admin');
  await call(updateUserRole, req({ session: sess(1, 'admin'), params: { id: String(UID) }, body: { role: 'student' } }));
  ok((await pool.query('SELECT role FROM users WHERE id=$1', [UID])).rows[0]?.role === 'student', 'updateUserRole → student (revert)');

  console.log('\n── ADMIN: CRM LEAD + TEMPLATE ──');
  r = await call(createLead, req({ session: sess(1, 'admin'), body: { name: 'Lead X', email: `${TAG}-lead@test.local`, source: 'manual' } }));
  const leadId = r._json?.id ?? r._json?.lead?.id; ok(!!leadId, `createLead → ${leadId}`);
  await call(updateLead, req({ session: sess(1, 'admin'), params: { id: String(leadId) }, body: { status: 'qualified' } }));
  ok((await pool.query('SELECT status FROM leads WHERE id=$1', [leadId])).rows[0]?.status === 'qualified', 'updateLead status persisted');
  r = await call(getLeads, req({ session: sess(1, 'admin'), query: {} }));
  ok(Array.isArray(r._json) && r._json.some((l: any) => l.id === leadId), 'getLeads returns new lead');
  r = await call(getCRMStats, req({ session: sess(1, 'admin') }));
  ok(r._json?.leads && typeof r._json.leads.total_count !== 'undefined', 'getCRMStats returns lead counts');
  r = await call(createTemplate, req({ session: sess(1, 'admin'), body: { name: `${TAG} tmpl`, subject: 'Hi {{name}}', body: 'Hello {{name}}' } }));
  const tmplId = r._json?.id; ok(!!tmplId, `createTemplate → ${tmplId}`);
  await call(updateTemplate, req({ session: sess(1, 'admin'), params: { id: String(tmplId) }, body: { name: `${TAG} tmpl2`, subject: 's', body: 'b' } }));
  ok((await pool.query('SELECT name FROM email_templates WHERE id=$1', [tmplId])).rows[0]?.name === `${TAG} tmpl2`, 'updateTemplate persisted');
  await call(deleteTemplate, req({ session: sess(1, 'admin'), params: { id: String(tmplId) } }));
  ok((await pool.query('SELECT 1 FROM email_templates WHERE id=$1', [tmplId])).rowCount === 0, 'deleteTemplate removed it');
  await call(deleteLead, req({ session: sess(1, 'admin'), params: { id: String(leadId) } }));
  ok((await pool.query('SELECT 1 FROM leads WHERE id=$1', [leadId])).rowCount === 0, 'deleteLead removed it');

  // ── CLEANUP ──
  await pool.query('DELETE FROM lesson_notes WHERE user_id=$1', [UID]);
  await pool.query('DELETE FROM leads WHERE email LIKE $1', [`${TAG}%`]);
  await pool.query('DELETE FROM users WHERE id=$1', [UID]); // cascades enrollments/progress/reviews
  const leftovers = (await pool.query(
    `SELECT (SELECT count(*) FROM courses WHERE title LIKE $1)
          + (SELECT count(*) FROM articles WHERE title LIKE $1)
          + (SELECT count(*) FROM series WHERE title LIKE $1)
          + (SELECT count(*) FROM testimonials WHERE name LIKE $1)
          + (SELECT count(*) FROM users WHERE email LIKE $2) AS n`,
    [`${TAG}%`, `${TAG}%`]
  )).rows[0].n;
  ok(Number(leftovers) === 0, `cleanup complete, no test rows left (leftovers=${leftovers})`);

  console.log(`\n════ RESULT: ${pass} passed, ${fail} failed ════`);
  await pool.end();
  process.exit(fail ? 1 : 0);
}
run().catch(async e => { console.error('HARNESS ERROR:', e); try { await pool.end(); } catch {} process.exit(1); });
