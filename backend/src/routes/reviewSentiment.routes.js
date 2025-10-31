import express from "express";
import {
  analyzeSingleReview,
  analyzeBatchReviews,
  getReviewStatistics,
  filterReviewsBySentiment,
  analyzeLocationReviews,
  getLocationSentiments,
} from "../controllers/reviewSentiment.controller.js";
import { asyncHandler } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/reviews/analyze
 * @desc Analyze sentiment of a single review
 * @access Private
 * @body {
 *   author: string,
 *   rating: number,
 *   description: string | { en: string }
 * }
 */
router.post("/analyze", asyncHandler(analyzeSingleReview));

/**
 * @route POST /api/reviews/batch-analyze
 * @desc Batch analyze sentiment of multiple reviews with parallel processing
 * @access Private
 * @body {
 *   reviews: Array<{
 *     author: string,
 *     rating: number,
 *     description: string | { en: string }
 *   }>,
 *   batchSize?: number (default: 15),
 *   concurrentBatches?: number (default: 10)
 * }
 */
router.post("/batch-analyze", asyncHandler(analyzeBatchReviews));

/**
 * @route POST /api/reviews/statistics
 * @desc Calculate statistics from analyzed reviews
 * @access Private
 * @body {
 *   analyzedReviews: Array<{...analyzed review data}>
 * }
 */
router.post("/statistics", asyncHandler(getReviewStatistics));

/**
 * @route POST /api/reviews/filter
 * @desc Filter analyzed reviews by sentiment or score
 * @access Private
 * @body {
 *   analyzedReviews: Array<{...analyzed review data}>,
 *   sentiment?: 'positive' | 'negative' | 'neutral',
 *   minScore?: number,
 *   maxScore?: number
 * }
 */
router.post("/filter", asyncHandler(filterReviewsBySentiment));

/**
 * @route POST /api/reviews/analyze-location/:locationId
 * @desc Analyze sentiment for all reviews of a specific location
 * @access Private
 * @description One-click sentiment analysis for all reviews of a user's location
 */
router.post("/analyze-location/:locationId", asyncHandler(analyzeLocationReviews));

/**
 * @route GET /api/reviews/location/:locationId
 * @desc Get all sentiment analysis results for a specific location
 * @access Private
 * @query sentiment? - Filter by sentiment type
 * @query limit? - Max results (default: 100)
 */
router.get("/location/:locationId", asyncHandler(getLocationSentiments));

export default router;
