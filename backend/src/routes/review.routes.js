import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import reviewController from '../controllers/review.controller.js';

const router = express.Router();

// Get all reviews
router.get('/', reviewController.getAllReviews);

// Get reviews for a specific location with pagination (RAW reviews)
router.get('/location/:locationId', authenticate, reviewController.getLocationReviews);

// Get sentiment statistics for a location
router.get('/:locationId/stats', reviewController.getSentimentStats);

// Get reviews by sentiment
router.get('/:locationId/sentiment/:sentiment', reviewController.getReviewsBySentiment);

// Get recent reviews
router.get('/:locationId/recent', reviewController.getRecentReviews);

// Get review by ID
router.get('/:reviewId', reviewController.getReviewById);

// Add new review
router.post('/:locationId', reviewController.addReview);

// Edit review
router.put('/:reviewId', reviewController.editReview);

// Delete review
router.delete('/:reviewId', reviewController.deleteReview);

export default router;
