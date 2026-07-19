import express from 'express';
import { getOverview, getPerformanceMetrics, getPopularFeatures, getActivityLogs } from './analytics.controller.js';
import { protect, requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All analytics routes are highly restricted to admins only
router.use(protect, requireAdmin);

router.get('/overview', getOverview);
router.get('/performance', getPerformanceMetrics);
router.get('/features', getPopularFeatures);
router.get('/activity-logs', getActivityLogs);

export default router;
