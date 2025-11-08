import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  verifyToken,
  googleCallback
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import passport from '../config/passport.config.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clears refresh token cookie)
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public (but requires valid refresh token in cookie)
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if the access token is valid
 * @access  Private (requires authentication)
 */
router.get('/verify', authenticate, verifyToken);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=authentication_failed`
  }),
  googleCallback
);

export default router;
