import express from 'express';
import {
  runCode,
  submitCode,
  getMySubmissions,
  getProblemStats,
} from '../controllers/judge.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/run', protect, runCode);
router.post('/submit', protect, submitCode);
router.get('/submissions/:problemId', protect, getMySubmissions);
router.get('/stats/:problemId', getProblemStats);

export default router;
