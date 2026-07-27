import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createTask,
  getTasks,
  toggleTaskLog,
  getTaskLogs,
  deleteTask,
  getTaskStreak,
  usePowerUp,
} from '../controllers/task.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(createTask);

router.post('/toggle', toggleTaskLog);
router.post('/use-powerup', usePowerUp);
router.get('/logs', getTaskLogs);
router.get('/streak', getTaskStreak);

router
  .route('/:id')
  .delete(deleteTask);

export default router;
