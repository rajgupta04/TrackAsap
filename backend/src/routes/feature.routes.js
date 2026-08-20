import express from 'express';
import { getPublicFeatures } from '../controllers/feature.controller.js';

const router = express.Router();

// Public route for frontend client
router.get('/', getPublicFeatures);

export default router;
