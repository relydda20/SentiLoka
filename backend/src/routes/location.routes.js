import express from 'express';

// const router = express.Router();

// // Get all locations by user
// router.get('/:userId', locationController.getAllLocationsByUser);

// // Get all reviews from a location
// router.get('/:locationId/reviews', locationController.getReviewsByLocation);

// // Get location by ID
// router.get('/:locationId', locationController.getLocationById);

// // Add new location
// router.post('/:userId/locations', locationController.addLocation);

// // Edit location
// router.put('/:locationId', locationController.editLocation);

// // Delete location
// router.delete('/:locationId', locationController.deleteLocation);

// export default router;

import {
  createLocation,
  getLocations,
  getLocation,
  updateLocationStatus,
  deleteLocation,
} from '../controllers/location.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/locations
 * @desc Create a new location or link existing location
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
 * @desc Update location scrape status (for testing/debugging)
 * @access Private
 */
router.patch('/:id/status', updateLocationStatus);

/**
 * @route DELETE /api/locations/:id
 * @desc Remove location from user's tracked locations (soft delete)
 * @access Private
 */
router.delete('/:id', deleteLocation);

export default router;
