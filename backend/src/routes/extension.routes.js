import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  submitFromExtension,
  getExtensionStatus,
} from '../controllers/extension.controller.js';

const router = express.Router();

router.post('/submit', protect, submitFromExtension);
router.get('/status', protect, getExtensionStatus);

export default router;
