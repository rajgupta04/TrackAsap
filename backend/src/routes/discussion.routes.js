import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getPosts,
  createPost,
  likePost,
  commentPost,
  deletePost,
  cloneSheet,
} from '../controllers/discussion.controller.js';

const router = express.Router();

// All discussion routes require authentication
router.use(protect);

router.get('/', getPosts);
router.post('/', createPost);
router.post('/clone-sheet', cloneSheet);
router.post('/:id/like', likePost);
router.post('/:id/comment', commentPost);
router.delete('/:id', deletePost);

export default router;
