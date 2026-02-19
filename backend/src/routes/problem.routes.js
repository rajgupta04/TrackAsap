import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createProblem,
  getProblems,
  getProblem,
  updateProblem,
  deleteProblem,
  getProblemsByDate,
  getProblemStats,
} from '../controllers/problem.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProblems)
  .post(createProblem);

router.get('/stats', getProblemStats);
router.get('/by-date/:date', getProblemsByDate);

router.route('/:id')
  .get(getProblem)
  .put(updateProblem)
  .delete(deleteProblem);

export default router;
