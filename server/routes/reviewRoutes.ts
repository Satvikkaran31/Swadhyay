import express from 'express';
import { ensureAuthenticated } from '../controllers/auth.js';
import { isAdmin } from '../controllers/adminMiddleware.js';
import { getCourseReviews, submitReview, deleteReview } from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getCourseReviews);
router.post('/', ensureAuthenticated, submitReview);
router.delete('/:id', ensureAuthenticated, deleteReview);

export default router;
