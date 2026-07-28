import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getCourses, getCourse, getCourseLearning, getCertificateEligibility,
  createCourse, updateCourse, deleteCourse, batchSaveCourse,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
  createResource, deleteResource,
  getAdminCourses, getAdminCourse,
  getLessonDetail, getLessonResources,
} from '../controllers/courseController.js';
import reviewRoutes from './reviewRoutes.js';
import { ensureAuthenticated } from '../controllers/auth.js';

const router = express.Router();

// ── Specific paths first (before /:slug catch-all) ────────────────────────────

router.get('/admin/all', isAdmin, getAdminCourses);
router.get('/admin/:id', isAdmin, getAdminCourse);

router.get('/lessons/:id/resources', getLessonResources);
router.get('/lessons/:id', getLessonDetail);

// ── Public ───────────────────────────────────────────────��────────────────────
router.get('/', getCourses);
router.get('/:slug/learn', getCourseLearning);
router.get('/:slug/certificate', ensureAuthenticated, getCertificateEligibility);
router.use('/:slug/reviews', reviewRoutes);
router.get('/:slug', getCourse);

// ── Mutations ───────────────────���────────────────────────────────��────────────
router.post('/', isAdmin, createCourse);
router.put('/:id', isAdmin, updateCourse);
router.delete('/:id', isAdmin, deleteCourse);
router.post('/:courseId/batch-save', isAdmin, batchSaveCourse);

router.post('/modules/create', isAdmin, createModule);
router.put('/modules/:id', isAdmin, updateModule);
router.delete('/modules/:id', isAdmin, deleteModule);

router.post('/lessons/create', isAdmin, createLesson);
router.put('/lessons/:id', isAdmin, updateLesson);
router.delete('/lessons/:id', isAdmin, deleteLesson);

router.post('/resources/create', isAdmin, createResource);
router.delete('/resources/:id', isAdmin, deleteResource);

export default router;
