import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.js';
import {
  getPublicTestimonials,
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialActive,
  seedDefaultTestimonials,
  uploadTestimonialAvatar,
} from '../controllers/testimonial.controller.js';

const router = express.Router();

// Public route for Landing Page
router.get('/', getPublicTestimonials);

// Admin-only management routes
router.use(protect);
router.use(requireAdmin);

router.get('/admin', getAdminTestimonials);
router.post('/', createTestimonial);
router.put('/:id', updateTestimonial);
router.delete('/:id', deleteTestimonial);
router.put('/:id/toggle', toggleTestimonialActive);
router.post('/seed', seedDefaultTestimonials);
router.post('/upload-avatar', upload.single('image'), uploadTestimonialAvatar);

export default router;
