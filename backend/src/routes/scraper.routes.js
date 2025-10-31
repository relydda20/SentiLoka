import express from 'express';
import {
  startScrape,
  getJobProgress,
  getJobStatusController,
  getLocationScrapeHistory,
  cancelScrapeJob,
  testScrape,
} from '../controllers/scraper.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route POST /api/scraper/test
 * @desc Test endpoint - scrape without authentication or location
 * @access Public (for testing only)
 * @body {
 *   url: string (required - Google Maps URL),
 *   maxReviews: number (optional, default: 20, max: 800)
 * }
 */
router.post('/test', asyncHandler(testScrape));

/**
 * @route GET /api/scraper/test-status/:jobId
 * @desc Get test job status without authentication
 * @access Public (for testing only)
 */
router.get('/test-status/:jobId', asyncHandler(getJobStatusController));

// Apply authentication middleware to all other routes
router.use(authenticate);

/**
 * @route POST /api/scraper/start
 * @desc Start a new scraping job
 * @access Private
 * @body {
 *   locationId: string (required),
 *   url: string (required - Google Maps URL),
 *   maxReviews: number (optional, default: 100, max: 800)
 * }
 */
router.post('/start', asyncHandler(startScrape));

/**
 * @route GET /api/scraper/progress/:jobId
 * @desc Get real-time job progress via Server-Sent Events (SSE)
 * @access Private
 * @description Opens an SSE connection that streams progress updates every 1 second
 * @returns Server-Sent Events stream with progress data
 */
router.get('/progress/:jobId', getJobProgress);

/**
 * @route GET /api/scraper/status/:jobId
 * @desc Get current job status (single request, not SSE)
 * @access Private
 * @returns Current job status and progress
 */
router.get('/status/:jobId', asyncHandler(getJobStatusController));

/**
 * @route GET /api/scraper/history/:locationId
 * @desc Get scrape history for a specific location
 * @access Private
 * @returns List of all scrape jobs for the location
 */
router.get('/history/:locationId', asyncHandler(getLocationScrapeHistory));

/**
 * @route DELETE /api/scraper/cancel/:jobId
 * @desc Cancel a running scrape job
 * @access Private
 * @returns Confirmation of job cancellation
 */
router.delete('/cancel/:jobId', asyncHandler(cancelScrapeJob));

export default router;
