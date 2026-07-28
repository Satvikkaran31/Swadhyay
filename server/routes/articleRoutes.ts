import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getArticles,
  getArticle,
  getRelatedArticles,
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getAdminStats,
} from '../controllers/articleController.js';

const router = express.Router();

router.get('/admin/stats', isAdmin, getAdminStats);
router.get('/admin/all', isAdmin, getAdminArticles);
router.get('/', getArticles);
router.get('/:slug/related', getRelatedArticles);
router.get('/:slug', getArticle);
router.post('/', isAdmin, createArticle);
router.put('/:id', isAdmin, updateArticle);
router.delete('/:id', isAdmin, deleteArticle);

export default router;
