import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { sendVerification, verifyEmail } from '../controllers/email.controller.js';

const router = express.Router();

router.post('/send-verification', protect, sendVerification);
router.get('/verify/:token', verifyEmail);

export default router;
