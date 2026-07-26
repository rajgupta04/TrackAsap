import express from 'express';
import { runCode } from '../controllers/compiler.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/run', protect, runCode);

export default router;
