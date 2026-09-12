import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createSession,
  getSession,
  listSessions,
  getSessionToken,
  addTranscriptTurn,
  submitEvaluation,
  deleteSession,
  getUserContext,
} from '../controllers/interview.controller.js';

const router = express.Router();

// All interview routes require user authentication
router.use(protect);

router.post('/session', createSession);
router.get('/sessions', listSessions);
router.get('/user-context', getUserContext);
router.get('/session/:id', getSession);
router.post('/session/:id/token', getSessionToken);
router.post('/session/:id/transcript', addTranscriptTurn);
router.post('/session/:id/evaluation', submitEvaluation);
router.delete('/session/:id', deleteSession);

export default router;
