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
  searchGlobalProblems,
  addSolution,
  updateSolution,
  deleteSolution,
} from '../controllers/problem.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProblems)
  .post(createProblem);

router.get('/stats', getProblemStats);
router.get('/search-global', searchGlobalProblems);
router.get('/by-date/:date', getProblemsByDate);

router.route('/:id')
  .get(getProblem)
  .put(updateProblem)
  .delete(deleteProblem);

// Solution sub-resource routes
router.post('/:id/solutions', addSolution);
router.put('/:id/solutions/:solutionId', updateSolution);
router.delete('/:id/solutions/:solutionId', deleteSolution);

export default router;
