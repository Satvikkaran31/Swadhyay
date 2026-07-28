import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import { subscribe, getSubscribers, newsletterLimiter } from '../controllers/newsletterController.js';

const router = express.Router();

router.post('/subscribe', newsletterLimiter, subscribe);
router.get('/subscribers', isAdmin, getSubscribers);

export default router;
