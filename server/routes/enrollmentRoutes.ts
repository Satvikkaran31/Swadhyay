import express from 'express';
import { ensureAuthenticated } from '../controllers/auth.js';
import { enroll, checkEnrollment, getMyEnrollments } from '../controllers/enrollmentController.js';

const router = express.Router();

router.use(ensureAuthenticated);

router.post('/', enroll);
router.get('/mine', getMyEnrollments);
router.get('/check/:course_id', checkEnrollment);

export default router;
