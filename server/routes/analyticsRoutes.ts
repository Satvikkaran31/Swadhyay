import express from 'express';
import rateLimit from 'express-rate-limit';
import { isAdmin } from '../controllers/adminMiddleware.js';
import { trackEvent, getAnalyticsOverview } from '../controllers/analyticsController.js';

const router = express.Router();

// Public ingest — generous cap so normal browsing is never throttled, but a
// runaway/abusive client is bounded. Keyed per IP.
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many events' },
});

router.post('/track', trackLimiter, trackEvent);

// Admin-only reporting.
router.get('/overview', isAdmin, getAnalyticsOverview);

export default router;
