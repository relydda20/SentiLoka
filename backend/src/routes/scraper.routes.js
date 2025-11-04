import express from 'express';
import {
  startScrape,
  getJobProgress,
  getJobStatusController,
  getLocationScrapeHistory,
  cancelScrapeJob,
  testScrape,
  getScraperCacheStatus,
  flushScraperCache,
  clearScraperCache,
  getAllScraperCacheStats,
} from '../controllers/scraper.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/validation.middleware.js';

const router = express.Router();

/**
 * @route POST /api/scraper/test
 * @desc Test endpoint - scrape without authentication or location
 * @access Public (for testing only)
 * @body {
 *   url: string (required - Google Maps URL)
 * }
 * @note Scrapes ALL available reviews (no limit)
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
 * @desc Start a new scraping job - scrapes ALL available reviews
 * @access Private
 * @body {
 *   locationId: string (required),
 *   url: string (required - Google Maps URL)
 * }
 * @note No review limit - will scrape all available reviews from Google Maps
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

/**
 * @route GET /api/scraper/cache/:locationId
 * @desc Get scraper cache status for a location
 * @access Private
 * @returns Current cache status (number of cached reviews, metadata)
 */
router.get('/cache/:locationId', asyncHandler(getScraperCacheStatus));

/**
 * @route POST /api/scraper/flush/:locationId
 * @desc Manually flush scraper cache to database
 * @access Private
 * @body {
 *   batchSize: number (optional, default: 100)
 * }
 * @returns Flush result with counts (inserted, updated, failed)
 */
router.post('/flush/:locationId', asyncHandler(flushScraperCache));

/**
 * @route DELETE /api/scraper/cache/:locationId
 * @desc Clear scraper cache without saving to database
 * @access Private
 * @returns Number of reviews cleared
 */
router.delete('/cache/:locationId', asyncHandler(clearScraperCache));

/**
 * @route GET /api/scraper/cache-stats
 * @desc Get all scraper cache statistics (admin/debug)
 * @access Private
 * @returns Statistics about all cached reviews across all locations
 */
router.get('/cache-stats', asyncHandler(getAllScraperCacheStats));

export default router;
