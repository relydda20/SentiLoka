import express from 'express';
import {
  getUserBySlug,
  updateUserProfile,
  changeUserPassword
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/users/:slug
 * @desc    Get public user profile by slug
 * @access  Public
 */
router.get('/:slug', getUserBySlug);

/**
 * @route   PUT /api/users/profile
 * @desc    Update authenticated user's profile
 * @access  Private
 */
router.put('/profile', authenticate, updateUserProfile);

/**
 * @route   POST /api/users/change-password
 * @desc    Change authenticated user's password
 * @access  Private
 */
router.post('/change-password', authenticate, changeUserPassword);

export default router;
