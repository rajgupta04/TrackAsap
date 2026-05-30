import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getUsers,
  toggleBanUser,
  adminDeletePost,
  getAdminStats,
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id/ban', toggleBanUser);
router.delete('/posts/:id', adminDeletePost);

export default router;
