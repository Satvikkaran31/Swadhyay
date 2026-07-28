import express from 'express';
import { ensureAuthenticated } from '../controllers/auth.js';
import { getNote, saveNote } from '../controllers/notesController.js';

const router = express.Router();

router.use(ensureAuthenticated);
router.get('/:lesson_id', getNote);
router.put('/:lesson_id', saveNote);

export default router;
