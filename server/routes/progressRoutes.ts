import express from 'express';
import { ensureAuthenticated } from '../controllers/auth.js';
import { markComplete, getCourseProgress } from '../controllers/progressController.js';

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/complete', markComplete);
router.get('/:course_id', getCourseProgress);

export default router;
