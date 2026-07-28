import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import {
  getTestimonials, getAdminTestimonials,
  createTestimonial, updateTestimonial, deleteTestimonial,
} from '../controllers/testimonialController.js';

const router = express.Router();

router.get('/', getTestimonials);
router.get('/admin/all', isAdmin, getAdminTestimonials);
router.post('/', isAdmin, createTestimonial);
router.put('/:id', isAdmin, updateTestimonial);
router.delete('/:id', isAdmin, deleteTestimonial);

export default router;
