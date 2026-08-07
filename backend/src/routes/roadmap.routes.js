import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getRoadmapProgress, saveRoadmapProgress } from '../controllers/roadmap.controller.js';

const router = express.Router();
router.use(protect);
router.route('/progress').get(getRoadmapProgress).put(saveRoadmapProgress);

export default router;
