import { addScrapeJob, getJobStatus, getLocationJobs } from '../services/job.service.js';
import { validateGoogleMapsUrl } from '../services/scraper.service.js';
import Location from '../models/Location.model.js';
import { scraperQueue } from '../config/queue.config.js';

/**
 * Start a new scraping job
 * @route POST /api/scraper/start
 * @access Private (requires authentication)
 */
export const startScrape = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { locationId, url, maxReviews = 100 } = req.body;

    // Validate required fields
    if (!locationId || !url) {
      return res.status(400).json({
        success: false,
        message: 'locationId and url are required',
      });
    }

    // Validate Google Maps URL
    if (!validateGoogleMapsUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Maps URL format',
      });
    }

    // Validate maxReviews range
    if (maxReviews < 1 || maxReviews > 800) {
      return res.status(400).json({
        success: false,
        message: 'maxReviews must be between 1 and 800',
      });
    }

    // Find location and verify ownership
    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Verify user owns this location
    if (location.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to scrape this location',
      });
    }

    // Check if location is already being scraped
    if (location.scrapeStatus === 'scraping' || location.scrapeStatus === 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Location is already being scraped',
        currentStatus: location.scrapeStatus,
      });
    }

    // Add job to queue
    const jobResult = await addScrapeJob({
      locationId: locationId,
      url: url,
      maxReviews: maxReviews,
      userId: req.user._id.toString(),
    });

    console.log(`Scrape job created: ${jobResult.jobId} for location ${locationId}`);

    return res.status(201).json({
      success: true,
      message: 'Scraping job started successfully',
      data: {
        jobId: jobResult.jobId,
        locationId: jobResult.locationId,
        status: jobResult.status,
        createdAt: jobResult.createdAt,
      },
    });
  } catch (error) {
    console.error('Error starting scrape:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to start scraping job',
      error: error.message,
    });
  }
};

/**
 * Get real-time job progress via Server-Sent Events (SSE)
 * @route GET /api/scraper/progress/:jobId
 * @access Private (requires authentication)
 */
export const getJobProgress = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'jobId is required',
      });
    }

    // Get initial job status to verify it exists
    const initialStatus = await getJobStatus(jobId);

    if (!initialStatus.exists) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Progress stream connected' })}\n\n`);

    // Create polling interval to check job status
    const pollInterval = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);

        if (!status.exists) {
          res.write(`data: ${JSON.stringify({ type: 'error', message: 'Job not found' })}\n\n`);
          clearInterval(pollInterval);
          res.end();
          return;
        }

        // Send progress update
        const progressData = {
          type: 'progress',
          jobId: status.jobId,
          state: status.state,
          progress: status.progress || {},
          createdAt: status.createdAt,
          processedOn: status.processedOn,
          finishedOn: status.finishedOn,
        };

        res.write(`data: ${JSON.stringify(progressData)}\n\n`);

        // If job is complete or failed, send final event and close connection
        if (status.state === 'completed') {
          res.write(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Scraping completed successfully',
            jobId: status.jobId,
            result: status.progress
          })}\n\n`);
          clearInterval(pollInterval);
          res.end();
        } else if (status.state === 'failed') {
          res.write(`data: ${JSON.stringify({
            type: 'failed',
            message: 'Scraping job failed',
            jobId: status.jobId,
            error: status.failedReason
          })}\n\n`);
          clearInterval(pollInterval);
          res.end();
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        clearInterval(pollInterval);
        res.end();
      }
    }, 1000); // Poll every 1 second

    // Handle client disconnect
    req.on('close', () => {
      console.log(`Client disconnected from job ${jobId} progress stream`);
      clearInterval(pollInterval);
      res.end();
    });

    // Handle errors
    res.on('error', (error) => {
      console.error('SSE error:', error);
      clearInterval(pollInterval);
      res.end();
    });

  } catch (error) {
    console.error('Error setting up progress stream:', error);

    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to set up progress stream',
        error: error.message,
      });
    }
  }
};

/**
 * Get current job status
 * @route GET /api/scraper/status/:jobId
 * @access Private (requires authentication) OR Public for test jobs
 */
export const getJobStatusController = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if this is a test job
    const isTestJob = jobId && jobId.includes('test-');

    // Check authentication (skip for test jobs)
    if (!isTestJob && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'jobId is required',
      });
    }

    const status = await getJobStatus(jobId);

    if (!status.exists) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        jobId: status.jobId,
        state: status.state,
        progress: status.progress || {},
        data: status.data,
        failedReason: status.failedReason,
        createdAt: status.createdAt,
        processedOn: status.processedOn,
        finishedOn: status.finishedOn,
      },
    });
  } catch (error) {
    console.error('Error getting job status:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message,
    });
  }
};

/**
 * Get scrape history for a location
 * @route GET /api/scraper/history/:locationId
 * @access Private (requires authentication)
 */
export const getLocationScrapeHistory = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { locationId } = req.params;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'locationId is required',
      });
    }

    // Verify location exists and user owns it
    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Verify ownership
    if (location.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this location',
      });
    }

    // Get all jobs for this location
    const jobs = await getLocationJobs(locationId);

    return res.status(200).json({
      success: true,
      data: {
        locationId: locationId,
        locationName: location.name,
        totalJobs: jobs.length,
        jobs: jobs,
        scrapeConfig: location.scrapeConfig,
        currentStatus: location.scrapeStatus,
      },
    });
  } catch (error) {
    console.error('Error getting location scrape history:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get scrape history',
      error: error.message,
    });
  }
};

/**
 * Cancel a running scrape job
 * @route DELETE /api/scraper/cancel/:jobId
 * @access Private (requires authentication)
 */
export const cancelScrapeJob = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'jobId is required',
      });
    }

    // Get job from queue
    const job = await scraperQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Verify user owns this job
    if (job.data.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this job',
      });
    }

    const state = await job.getState();

    // Check if job can be cancelled
    if (state === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed job',
        state: state,
      });
    }

    if (state === 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a failed job',
        state: state,
      });
    }

    // Remove the job from queue
    await job.remove();

    // Update location status
    if (job.data.locationId) {
      await Location.findByIdAndUpdate(job.data.locationId, {
        scrapeStatus: 'failed',
        lastScrapeError: {
          message: 'Job cancelled by user',
          timestamp: new Date(),
        },
      });
    }

    console.log(`Job ${jobId} cancelled by user ${req.user._id}`);

    return res.status(200).json({
      success: true,
      message: 'Scrape job cancelled successfully',
      data: {
        jobId: jobId,
        previousState: state,
      },
    });
  } catch (error) {
    console.error('Error cancelling job:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: error.message,
    });
  }
};

/**
 * Test endpoint - Start scraping without authentication or location
 * @route POST /api/scraper/test
 * @access Public (for testing only)
 */
export const testScrape = async (req, res) => {
  try {
    const { url, maxReviews = 20 } = req.body;

    // Validate required fields
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'url is required',
      });
    }

    // Validate Google Maps URL
    if (!validateGoogleMapsUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Maps URL format',
      });
    }

    // Validate maxReviews range
    if (maxReviews < 1 || maxReviews > 800) {
      return res.status(400).json({
        success: false,
        message: 'maxReviews must be between 1 and 800',
      });
    }

    // Add job to queue with a temporary test location ID
    const testLocationId = `test-${Date.now()}`;
    const jobResult = await addScrapeJob({
      locationId: testLocationId,
      url: url,
      maxReviews: maxReviews,
      userId: 'test-user',
    });

    console.log(`Test scrape job created: ${jobResult.jobId}`);

    return res.status(201).json({
      success: true,
      message: 'Test scraping job started successfully',
      data: {
        jobId: jobResult.jobId,
        url: url,
        maxReviews: maxReviews,
        status: jobResult.status,
        createdAt: jobResult.createdAt,
        note: 'This is a test endpoint. Reviews will not be saved to a location.',
      },
    });
  } catch (error) {
    console.error('Error starting test scrape:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to start test scraping job',
      error: error.message,
    });
  }
};

export default {
  startScrape,
  getJobProgress,
  getJobStatusController,
  getLocationScrapeHistory,
  cancelScrapeJob,
  testScrape,
};
