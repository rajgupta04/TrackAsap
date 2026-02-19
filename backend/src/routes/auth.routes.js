import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  register,
  login,
  getMe,
  updateProfile,
} from '../controllers/auth.controller.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
