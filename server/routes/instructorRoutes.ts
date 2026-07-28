import express from 'express';
import { isAdmin } from '../controllers/adminMiddleware.js';
import { getInstructor, updateInstructor } from '../controllers/instructorController.js';

const router = express.Router();

router.get('/', getInstructor);
router.put('/', isAdmin, updateInstructor);

export default router;
