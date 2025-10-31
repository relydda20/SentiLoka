import express from "express";
import {
  analyzeSingleReview,
  analyzeBatchReviews,
  getReviewStatistics,
  filterReviewsBySentiment,
} from "../controllers/reviewSentiment.controller.js";
import { asyncHandler } from "../middleware/validation.middleware.js";

const router = express.Router();

/**
 * @route POST /api/reviews/analyze
 * @desc Analyze sentiment of a single review
 * @access Public
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
 * @access Public
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
 * @access Public
 * @body {
 *   analyzedReviews: Array<{...analyzed review data}>
 * }
 */
router.post("/statistics", asyncHandler(getReviewStatistics));

/**
 * @route POST /api/reviews/filter
 * @desc Filter analyzed reviews by sentiment or score
 * @access Public
 * @body {
 *   analyzedReviews: Array<{...analyzed review data}>,
 *   sentiment?: 'positive' | 'negative' | 'neutral',
 *   minScore?: number,
 *   maxScore?: number
 * }
 */
router.post("/filter", asyncHandler(filterReviewsBySentiment));

export default router;
