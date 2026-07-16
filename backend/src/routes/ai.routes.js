import express from 'express';
import { autofillProblem } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All AI routes require authentication to prevent abuse
router.use(protect);

router.post('/autofill-problem', autofillProblem);

export default router;
