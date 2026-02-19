import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getBuckets,
  getBucket,
  importBucketToSheet,
  createSheetFromBucket,
  upsertBucket,
} from '../controllers/sheetBucket.controller.js';

const router = express.Router();

// Public routes (anyone can view buckets)
router.get('/', getBuckets);
router.get('/:id', getBucket);

// Protected routes (require authentication)
router.post('/import', protect, importBucketToSheet);
router.post('/create-sheet', protect, createSheetFromBucket);

// Admin route (could add admin middleware)
router.post('/upsert', protect, upsertBucket);

export default router;
