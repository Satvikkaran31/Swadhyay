import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getCourses, getCourse, getCourseLearning,
  createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
  createResource, deleteResource,
  getAdminCourses, getAdminCourse,
  getLessonDetail, getLessonResources,
} from '../controllers/courseController.js';

const router = express.Router();

// ── Specific paths first (before /:slug catch-all) ────────────────────────────

// Admin — course management
router.get('/admin/all', isAdmin, getAdminCourses);
router.get('/admin/:id', isAdmin, getAdminCourse);

// Lesson detail (enrolled users + admin)
router.get('/lessons/:id/resources', getLessonResources);
router.get('/lessons/:id', getLessonDetail);

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getCourses);
router.get('/:slug/learn', getCourseLearning);  // authenticated enrolled view
router.get('/:slug', getCourse);                // must come after all fixed paths

// ── Mutations ─────────────────────────────────────────────────────────────────
router.post('/', isAdmin, createCourse);
router.put('/:id', isAdmin, updateCourse);
router.delete('/:id', isAdmin, deleteCourse);

router.post('/modules/create', isAdmin, createModule);
router.put('/modules/:id', isAdmin, updateModule);
router.delete('/modules/:id', isAdmin, deleteModule);

router.post('/lessons/create', isAdmin, createLesson);
router.put('/lessons/:id', isAdmin, updateLesson);
router.delete('/lessons/:id', isAdmin, deleteLesson);

router.post('/resources/create', isAdmin, createResource);
router.delete('/resources/:id', isAdmin, deleteResource);

export default router;
