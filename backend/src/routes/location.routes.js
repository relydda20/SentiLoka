import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import locationController from '../controllers/location.controller.js';

const router = express.Router();

// Get all locations by user
router.get('/:userId', locationController.getAllLocationsByUser);

// Get all reviews from a location
router.get('/:locationId/reviews', locationController.getReviewsByLocation);

// Get location by ID
router.get('/:locationId', locationController.getLocationById);

// Add new location
router.post('/:userId/locations', locationController.addLocation);

// Edit location
router.put('/:locationId', locationController.editLocation);

// Delete location
router.delete('/:locationId', locationController.deleteLocation);

export default router;

