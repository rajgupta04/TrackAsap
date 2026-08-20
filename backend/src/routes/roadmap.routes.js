import express from 'express';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';
import { getRoadmapProgress, saveRoadmapProgress } from '../controllers/roadmap.controller.js';
import { getRoadmapWorlds } from '../controllers/roadmapAdmin.controller.js';

const router = express.Router();

// Public / optional auth route to get live worlds from Cosmos DB
router.get('/worlds', optionalProtect, getRoadmapWorlds);

// User Progress Routes
router.route('/progress')
  .get(protect, getRoadmapProgress)
  .put(protect, saveRoadmapProgress);

export default router;
