import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
  syncToGitHub,
} from '../controllers/github.controller.js';

const router = express.Router();

// OAuth flow
router.get('/auth-url', protect, getAuthUrl);
router.get('/callback', handleCallback); // public — GitHub redirects here

// Status & management
router.get('/status', protect, getStatus);
router.delete('/disconnect', protect, disconnect);

// Sync
router.post('/sync', protect, syncToGitHub);

export default router;
