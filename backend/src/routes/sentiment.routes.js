import express from "express";
import {
  analyzeSingleText,
  analyzeSingleTextStream,
  analyzeBatchTexts,
  healthCheck,
} from "../controllers/sentiment.controller.js";
import {
  validateSentimentRequest,
  validateBatchSentimentRequest,
  asyncHandler,
} from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @route GET /api/sentiment/health
 * @desc Health check for sentiment analysis service
 * @access Public
 */
router.get("/health", asyncHandler(healthCheck));

// All routes below require authentication
router.use(authenticate);

/**
 * @route POST /api/sentiment/analyze
 * @desc Analyze sentiment of a single text
 * @access Private
 * @body { text: string }
 */
router.post(
  "/analyze",
  validateSentimentRequest,
  asyncHandler(analyzeSingleText)
);

/**
 * @route POST /api/sentiment/analyze-stream
 * @desc Analyze sentiment with streaming response (SSE)
 * @access Private
 * @body { text: string }
 */
router.post(
  "/analyze-stream",
  validateSentimentRequest,
  asyncHandler(analyzeSingleTextStream)
);

/**
 * @route POST /api/sentiment/batch-analyze
 * @desc Batch analyze sentiment of multiple texts
 * @access Private
 * @body { texts: string[] }
 */
router.post(
  "/batch-analyze",
  validateBatchSentimentRequest,
  asyncHandler(analyzeBatchTexts)
);

export default router;
