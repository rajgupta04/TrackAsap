import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getMonthlyLeaderboard,
  getCollegeLeaderboard,
  getCurrentUserRank,
} from '../controllers/leaderboard.controller.js';

const router = express.Router();

// Public routes (anyone can see leaderboard)
router.get('/global', getGlobalLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
router.get('/monthly', getMonthlyLeaderboard);
router.get('/college/:collegeName', getCollegeLeaderboard);

// Protected routes (require login)
router.get('/me', protect, getCurrentUserRank);

export default router;
