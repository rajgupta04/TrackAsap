import express from 'express';
import {
  getProblems,
  getProblemBySlug,
  searchJudgeProblems,
  getAllAdminProblems,
  getPendingProblems,
  reviewProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  getMyAuthoredProblems,
  uploadProblemDiagram,
} from '../controllers/judgeProblem.controller.js';
import { protect, optionalProtect, requireSetter, requireAdmin } from '../middleware/auth.middleware.js';
import uploadProblemImage from '../middleware/uploadProblemImage.js';

const router = express.Router();

// Public routes with optional auth for tracking solved status
router.get('/', optionalProtect, getProblems);
router.get('/search', optionalProtect, searchJudgeProblems);

// Admin Routes (must be before /:slug so it doesn't get captured as a slug)
router.get('/admin/all', protect, requireAdmin, getAllAdminProblems);
router.get('/admin/pending', protect, requireAdmin, getPendingProblems);
router.put('/admin/review/:id', protect, requireAdmin, reviewProblem);

router.get('/:slug', optionalProtect, getProblemBySlug);

// Setter / Admin protected routes
router.post('/', protect, requireSetter, createProblem);
router.get('/setter/my-problems', protect, requireSetter, getMyAuthoredProblems);
router.put('/:id', protect, requireSetter, updateProblem);
router.delete('/:id', protect, requireSetter, deleteProblem);
router.post(
  '/upload-image',
  protect,
  requireSetter,
  uploadProblemImage.single('image'),
  uploadProblemDiagram
);

export default router;
