import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getPosts,
  createPost,
  likePost,
  commentPost,
  deletePost,
  cloneSheet,
  trackDownload,
} from '../controllers/discussion.controller.js';
import { hubUpload } from '../middleware/uploadHubAttachment.js';

const router = express.Router();

// All discussion/hub routes require authentication
router.use(protect);

router.get('/', getPosts);
router.post('/', hubUpload.single('file'), createPost);
router.post('/clone-sheet', cloneSheet);
router.post('/:id/like', likePost);
router.post('/:id/comment', commentPost);
router.post('/:id/download', trackDownload);
router.delete('/:id', deletePost);

export default router;
