import express from 'express';
import { trackBatchEvents } from '../controllers/telemetry.controller.js';

const router = express.Router();

// Ingestion endpoint (public / token-aware)
router.post('/events', trackBatchEvents);
router.post('/beacon', trackBatchEvents);

export default router;
