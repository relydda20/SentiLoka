import { scraperQueue } from '../config/queue.config.js';
import { executeScraper } from './scraper.service.js';
import { transformReviews } from '../utils/reviewTransformer.js';
import Location from '../models/Location.model.js';
import { invalidateLocationCache } from './redis-cache.service.js';
import { invalidateCacheForLocation } from './chatbot-cache.service.js';
import {
  cacheScrapedReviews,
  flushScrapedReviewsToDatabase,
  getCachedReviewCount,
  autoFlushIfNeeded,
} from './scraper-cache.service.js';

/**
 * Add a new scrape job to the queue
 * @param {Object} jobData - Job data
 * @param {string} jobData.locationId - MongoDB location ID
 * @param {string} jobData.url - Google Maps URL
 * @param {string} jobData.userId - User ID who initiated the scrape
 * @returns {Promise<Object>} - Job object
 */
export const addScrapeJob = async (jobData) => {
  const { locationId, url, userId } = jobData;

  // Validate required fields
  if (!locationId || !url) {
    throw new Error('locationId and url are required');
  }

  // Update location status to pending (skip if test location)
  if (!locationId.startsWith('test-')) {
    await Location.findByIdAndUpdate(locationId, {
      scrapeStatus: 'pending',
    });
  }

  // Add job to queue - will scrape ALL available reviews (no limit)
  const job = await scraperQueue.add(
    {
      locationId,
      url,
      userId,
      createdAt: new Date().toISOString(),
    },
    {
      jobId: `scrape-${locationId}-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );

  console.log(`Job ${job.id} added to queue for location ${locationId}`);

  return {
    jobId: job.id,
    locationId,
    status: 'queued',
    createdAt: new Date(),
  };
};

/**
 * Get job status and progress
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Job status
 */
export const getJobStatus = async (jobId) => {
  const job = await scraperQueue.getJob(jobId);

  if (!job) {
    return {
      exists: false,
      message: 'Job not found',
    };
  }

  const state = await job.getState();
  const progress = job.progress();
  const failedReason = job.failedReason;

  return {
    exists: true,
    jobId: job.id,
    state,
    progress,
    data: job.data,
    failedReason,
    createdAt: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
};

/**
 * Get all jobs for a location
 * @param {string} locationId - Location ID
 * @returns {Promise<Array>} - Array of jobs
 */
export const getLocationJobs = async (locationId) => {
  const jobs = await scraperQueue.getJobs([
    'waiting',
    'active',
    'completed',
    'failed',
  ]);

  const locationJobs = jobs.filter(
    (job) => job.data.locationId === locationId
  );

  return Promise.all(
    locationJobs.map(async (job) => ({
      jobId: job.id,
      state: await job.getState(),
      progress: job.progress(),
      data: job.data,
      createdAt: job.timestamp,
      finishedOn: job.finishedOn,
    }))
  );
};

/**
 * Process scraper job with sentiment analysis
 * @param {Object} job - Bull job object
 */
export const processScrapeJob = async (job) => {
  const { locationId, url } = job.data;

  console.log(
    `Processing scrape job ${job.id} for location ${locationId} - scraping ALL available reviews`
  );

  try {
    // Check if this is a test job
    const isTestJob = locationId.startsWith('test-');

    // Fetch location to get userId (skip if test location)
    let location = null;
    let userId = null;
    if (!isTestJob) {
      location = await Location.findById(locationId);
      if (!location) {
        throw new Error('Location not found');
      }
      userId = location.userId;

      // Update location status
      location.scrapeStatus = 'scraping';
      await location.save();
    }

    // Update job progress
    await job.progress({
      stage: 'scraping',
      percentage: 0,
      message: 'Starting scraper - collecting all available reviews...',
    });

    // Execute scraper with progress tracking - no maxReviews limit
    const scraperResult = await executeScraper({
      url,
      onProgress: async (progressData) => {
        await job.progress({
          stage: 'scraping',
          reviewsScraped: progressData.reviewsScraped || 0,
          message: progressData.message,
        });
      },
    });

    if (!scraperResult.success) {
      throw new Error('Scraper failed to complete successfully');
    }

    const rawReviews = scraperResult.data.reviews || [];
    console.log(`Scraped ${rawReviews.length} reviews`);

    // Update progress
    await job.progress({
      stage: 'transforming',
      percentage: 60,
      message: 'Transforming review data...',
    });

    // Transform reviews to unified format
    const transformedReviews = transformReviews(rawReviews, url);

    // Update progress
    await job.progress({
      stage: 'caching',
      percentage: 70,
      message: 'Caching scraped reviews to Redis...',
    });

    // Cache reviews to Redis first (fast operation)
    let cachedCount = 0;
    if (!isTestJob) {
      cachedCount = await cacheScrapedReviews(locationId, userId, transformedReviews);
      console.log(`✓ Cached ${cachedCount} reviews to Redis for location ${locationId}`);
      
      // Check if we should auto-flush (if cache is getting large)
      await autoFlushIfNeeded(locationId, userId, 500);
    }

    // Update progress
    await job.progress({
      stage: 'flushing',
      percentage: 80,
      message: 'Flushing cached reviews to database...',
    });

    // Flush cached reviews to database in batches (efficient bulk operation)
    let flushResult = { inserted: 0, updated: 0, failed: 0 };
    if (!isTestJob) {
      flushResult = await flushScrapedReviewsToDatabase(locationId, userId, 100);
      console.log(`✓ Flushed reviews to database:`, flushResult);
    }

    const savedReviewsCount = flushResult.inserted + flushResult.updated;

    // Update location with scrape metadata (skip if test job)
    if (!isTestJob) {
      location = await Location.findById(locationId);
      if (location) {
        location.scrapeStatus = 'completed';
        location.scrapeConfig.lastScraped = new Date();

        // Calculate next scheduled scrape based on frequency
        if (location.scrapeConfig.scrapeFrequency === 'daily') {
          const nextScrape = new Date();
          nextScrape.setDate(nextScrape.getDate() + 1);
          location.scrapeConfig.nextScheduledScrape = nextScrape;
        } else if (location.scrapeConfig.scrapeFrequency === 'weekly') {
          const nextScrape = new Date();
          nextScrape.setDate(nextScrape.getDate() + 7);
          location.scrapeConfig.nextScheduledScrape = nextScrape;
        }

        await location.save();

        // Invalidate old caches (they're now stale)
        await invalidateCacheForLocation(userId.toString(), locationId);
        await invalidateLocationCache(locationId, userId.toString());
        console.log(`🗑️ Invalidated old caches for location ${locationId}`);

        // Note: Reviews will be cached on-demand when frontend fetches them
        // Sentiment calculation will be done after batch analysis
        // via POST /api/reviews/analyze-location/:locationId endpoint
      }
    } else {
      console.log('Test job: Skipping database save for reviews');
    }

    // Final progress update
    await job.progress({
      stage: 'completed',
      percentage: 100,
      message: `Successfully saved ${savedReviewsCount} reviews via Redis cache. Use batch analysis endpoint to analyze sentiment.`,
    });

    console.log(
      `Job ${job.id} completed successfully. Cached and saved ${savedReviewsCount} reviews (sentiment analysis pending).`
    );

    return {
      success: true,
      reviewsScraped: rawReviews.length,
      reviewsCached: cachedCount,
      reviewsSaved: savedReviewsCount,
      insertedNew: flushResult.inserted,
      updatedExisting: flushResult.updated,
      locationId,
      message: 'Reviews cached and saved successfully via Redis. Run batch sentiment analysis via POST /api/reviews/analyze-location/:locationId',
    };
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);

    // Update location status to failed (skip if test location)
    if (!locationId.startsWith('test-')) {
      await Location.findByIdAndUpdate(locationId, {
        scrapeStatus: 'failed',
        lastScrapeError: {
          message: error.message,
          timestamp: new Date(),
        },
      });
    }

    throw error;
  }
};

/**
 * Initialize job processor
 */
export const initializeJobProcessor = () => {
  scraperQueue.process(async (job) => {
    return await processScrapeJob(job);
  });

  console.log('Job processor initialized');
};

/**
 * Get queue statistics
 * @returns {Promise<Object>} - Queue stats
 */
export const getQueueStats = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    scraperQueue.getWaitingCount(),
    scraperQueue.getActiveCount(),
    scraperQueue.getCompletedCount(),
    scraperQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
};

/**
 * Remove completed jobs older than specified days
 * @param {number} days - Number of days
 * @returns {Promise<number>} - Number of jobs removed
 */
export const cleanOldJobs = async (days = 7) => {
  const timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
  const jobs = await scraperQueue.clean(timestamp, 'completed');
  console.log(`Cleaned ${jobs.length} old completed jobs`);
  return jobs.length;
};

export default {
  addScrapeJob,
  getJobStatus,
  getLocationJobs,
  processScrapeJob,
  initializeJobProcessor,
  getQueueStats,
  cleanOldJobs,
};
