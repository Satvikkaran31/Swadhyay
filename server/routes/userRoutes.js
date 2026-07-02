import express from 'express';
import { getUsers, updateUserRole } from '../controllers/userController.js';
import { isAdmin } from '../controllers/adminMiddleware.js';

const router = express.Router();

router.get('/', isAdmin, getUsers);
router.patch('/:id/role', isAdmin, updateUserRole);

export default router;
