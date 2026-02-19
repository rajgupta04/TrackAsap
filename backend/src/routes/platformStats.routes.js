import express from 'express';
import {
  getLeetCodeStats,
  getCodeforcesStats,
  getCodeChefStats,
  getAllPlatformStats,
} from '../controllers/platformStats.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all platform stats at once
router.get('/all', getAllPlatformStats);

// Individual platform stats
router.get('/leetcode/:username', getLeetCodeStats);
router.get('/codeforces/:handle', getCodeforcesStats);
router.get('/codechef/:username', getCodeChefStats);

export default router;
