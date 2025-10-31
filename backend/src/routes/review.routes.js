import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import reviewController from '../controllers/review.controller.js';

const router = express.Router();

// Get all reviews
router.get('/', authenticate, reviewController.getAllReviews);

// Get sentiment statistics for a location
router.get('/:locationId/stats', authenticate, reviewController.getSentimentStats);

// Get reviews by sentiment
router.get('/:locationId/sentiment/:sentiment', authenticate, reviewController.getReviewsBySentiment);

// Get recent reviews
router.get('/:locationId/recent', authenticate, reviewController.getRecentReviews);

// Get review by ID
router.get('/:reviewId', authenticate, reviewController.getReviewById);

// Add new review
router.post('/:locationId', authenticate, reviewController.addReview);

// Edit review
router.put('/:reviewId', authenticate, reviewController.editReview);

// Delete review
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

export default router;
