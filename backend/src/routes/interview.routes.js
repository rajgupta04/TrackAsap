import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createSession,
  getSession,
  listSessions,
  getSessionToken,
  addTranscriptTurn,
  submitEvaluation,
  evaluateSession,
  deleteSession,
  getUserContext,
  uploadResume,
} from '../controllers/interview.controller.js';
import multer from 'multer';

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
router.post('/session/:id/evaluate', evaluateSession);
router.post('/upload-resume', resumeUpload.single('resume'), uploadResume);
router.delete('/session/:id', deleteSession);

export default router;
