import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  generateDailyPlan,
  saveDailyPlan,
  startPlanSession,
  toggleTaskCompleted,
  updatePlanTasks,
  endPlanSession,
  getActivePlan,
  getPlanHistory,
  getPlanById,
} from '../controllers/dailyPlan.controller.js';

const router = express.Router();

// All daily plan routes require authentication
router.use(protect);

router.post('/generate', generateDailyPlan);
router.post('/save', saveDailyPlan);
router.get('/active', getActivePlan);
router.get('/history', getPlanHistory);
router.get('/:id', getPlanById);
router.patch('/:id/start-session', startPlanSession);
router.patch('/:id/toggle-task', toggleTaskCompleted);
router.patch('/:id/update-tasks', updatePlanTasks);
router.patch('/:id/end-session', endPlanSession);

export default router;
