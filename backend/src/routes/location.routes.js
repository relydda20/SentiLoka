import express from 'express';
import {
  createLocation,
  getLocations,
  getLocation,
  updateLocationStatus,
} from '../controllers/location.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/locations
 * @desc Create a new location
 * @access Private
 */
router.post('/', createLocation);

/**
 * @route GET /api/locations
 * @desc Get all locations for current user
 * @access Private
 */
router.get('/', getLocations);

/**
 * @route GET /api/locations/:id
 * @desc Get single location by ID
 * @access Private
 */
router.get('/:id', getLocation);

/**
 * @route PATCH /api/locations/:id/status
 * @desc Update location scrape status
 * @access Private
 */
router.patch('/:id/status', updateLocationStatus);

export default router;
