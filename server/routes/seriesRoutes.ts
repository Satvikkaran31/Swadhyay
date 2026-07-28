import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getSeries, getSeriesDetail,
  getAdminSeries, createSeries, updateSeries, deleteSeries,
} from '../controllers/seriesController.js';

const router = express.Router();

router.get('/admin/all', isAdmin, getAdminSeries);

router.get('/', getSeries);
router.get('/:slug', getSeriesDetail);

router.post('/', isAdmin, createSeries);
router.put('/:id', isAdmin, updateSeries);
router.delete('/:id', isAdmin, deleteSeries);

export default router;
