import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createOrUpdateDailyLog,
  getDailyLog,
  getAllDailyLogs,
  getStreak,
  getWeeklySummary,
  deleteDailyLog,
} from '../controllers/dailyLog.controller.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getAllDailyLogs)
  .post(createOrUpdateDailyLog);

router.get('/streak', getStreak);
router.get('/weekly-summary', getWeeklySummary);

router.route('/:date')
  .get(getDailyLog)
  .delete(deleteDailyLog);

export default router;
