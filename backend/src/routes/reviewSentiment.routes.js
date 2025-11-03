import express from "express";
import {
  analyzeSingleReview,
  analyzeBatchReviews,
  getReviewStatistics,
  filterReviewsBySentiment,
  analyzeLocationReviews,
  getLocationAnalysisStats,
  recalculateSentimentStatistics,
  getLocationSentiments,
} from "../controllers/reviewSentiment.controller.js";
import { asyncHandler } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

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

// ============================================
// AUTHENTICATED ROUTES - Location-based batch analysis
// ============================================

/**
 * @route GET /api/reviews/analysis-stats/:locationId
 * @desc Get analysis statistics for a location (check coverage before analyzing)
 * @access Private (requires authentication)
 * @description This endpoint returns analysis coverage statistics showing how many reviews
 *              are analyzed vs unanalyzed. Use this BEFORE calling analyze-location to check
 *              if analysis is needed. This is FAST - only counts documents, no API calls.
 */
router.get("/analysis-stats/:locationId", authenticate, asyncHandler(getLocationAnalysisStats));

/**
 * @route POST /api/reviews/analyze-location/:locationId
 * @desc Analyze sentiment for NEW reviews of a specific location (optimized batch processing)
 * @access Private (requires authentication)
 * @description ⭐ OPTIMIZED: Only analyzes NEW reviews that haven't been analyzed yet.
 *              This endpoint filters out already-analyzed reviews and only sends new reviews
 *              to OpenAI API, saving 80-95% on API costs for subsequent runs.
 *              Results are saved to the ReviewSummary collection.
 *              This should be called AFTER scraping is complete.
 */
router.post("/analyze-location/:locationId", authenticate, asyncHandler(analyzeLocationReviews));

/**
 * @route POST /api/reviews/recalculate-sentiment/:locationId
 * @desc Recalculate sentiment statistics from existing ReviewSummary data (FAST - no OpenAI calls)
 * @access Private (requires authentication)
 * @description This endpoint recalculates sentiment statistics from existing ReviewSummary documents.
 *              Use this when you want to update location statistics without re-analyzing reviews.
 *              This is much faster than analyze-location and doesn't consume OpenAI credits.
 */
router.post("/recalculate-sentiment/:locationId", authenticate, asyncHandler(recalculateSentimentStatistics));

/**
 * @route GET /api/reviews/location/:locationId
 * @desc Get all sentiment analysis results for a specific location
 * @access Private (requires authentication)
 */
router.get("/location/:locationId", authenticate, asyncHandler(getLocationSentiments));

export default router;
