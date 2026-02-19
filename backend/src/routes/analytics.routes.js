import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getDashboardData,
  getProblemsTrend,
  getPlatformDistribution,
  getDifficultyBreakdown,
  getHeatmapData,
  getCodeforcesRating,
  getWeightProgress,
} from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardData);
router.get('/problems-trend', getProblemsTrend);
router.get('/platform-distribution', getPlatformDistribution);
router.get('/difficulty-breakdown', getDifficultyBreakdown);
router.get('/heatmap', getHeatmapData);
router.get('/codeforces-rating', getCodeforcesRating);
router.get('/weight-progress', getWeightProgress);

export default router;
