import { scraperQueue } from '../config/queue.config.js';
import { executeScraper } from './scraper.service.js';
import { transformReviews } from '../utils/reviewTransformer.js';
import { analyzeSentiment } from '../utils/openaiClient.js';
import Location from '../models/Location.model.js';
import Review from '../models/Review.model.js';

/**
 * Add a new scrape job to the queue
 * @param {Object} jobData - Job data
 * @param {string} jobData.locationId - MongoDB location ID
 * @param {string} jobData.url - Google Maps URL
 * @param {number} jobData.maxReviews - Maximum reviews to scrape
 * @param {string} jobData.userId - User ID who initiated the scrape
 * @returns {Promise<Object>} - Job object
 */
export const addScrapeJob = async (jobData) => {
  const { locationId, url, maxReviews = 100, userId } = jobData;

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

  // Add job to queue
  const job = await scraperQueue.add(
    {
      locationId,
      url,
      maxReviews,
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
  const { locationId, url, maxReviews } = job.data;

  console.log(
    `Processing scrape job ${job.id} for location ${locationId}`
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
      message: 'Starting scraper...',
    });

    // Execute scraper with progress tracking
    const scraperResult = await executeScraper({
      url,
      maxReviews,
      onProgress: async (progressData) => {
        await job.progress({
          stage: 'scraping',
          percentage: progressData.percentage || 0,
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
      percentage: 50,
      message: 'Transforming review data...',
    });

    // Transform reviews to unified format
    const transformedReviews = transformReviews(rawReviews, url);

    // Update progress
    await job.progress({
      stage: 'analyzing',
      percentage: 60,
      message: `Analyzing sentiment for ${transformedReviews.length} reviews...`,
    });

    // Analyze sentiment for each review
    const reviewsWithSentiment = [];
    let processedCount = 0;

    for (const review of transformedReviews) {
      try {
        // Analyze sentiment
        const sentimentResult = await analyzeSentiment(review.text);

        if (sentimentResult.success) {
          reviewsWithSentiment.push({
            ...review,
            sentiment: sentimentResult.data.sentiment,
            sentimentScore: sentimentResult.data.score,
            sentimentBreakdown: {
              positive: sentimentResult.data.confidence || 0,
              neutral: 0,
              negative: 0,
            },
            keywords: {
              positive: sentimentResult.data.keywords || [],
              negative: [],
            },
            analyzedAt: new Date(),
          });
        } else {
          // Include review without sentiment if analysis fails
          reviewsWithSentiment.push({
            ...review,
            sentiment: 'neutral',
            sentimentScore: 0,
            analyzedAt: new Date(),
          });
        }

        processedCount++;
        const percentage = 60 + Math.round((processedCount / transformedReviews.length) * 30);

        await job.progress({
          stage: 'analyzing',
          percentage,
          message: `Analyzed ${processedCount}/${transformedReviews.length} reviews`,
        });
      } catch (error) {
        console.error(`Error analyzing sentiment for review:`, error);
        // Include review without sentiment
        reviewsWithSentiment.push({
          ...review,
          sentiment: 'neutral',
          sentimentScore: 0,
          analyzedAt: new Date(),
        });
      }
    }

    // Update progress
    await job.progress({
      stage: 'saving',
      percentage: 90,
      message: 'Saving reviews to database...',
    });

    // Save reviews to database (skip if test job)
    const savedReviews = [];
    if (!isTestJob) {
      for (const reviewData of reviewsWithSentiment) {
        try {
          // Check if review already exists for this user
          const existingReview = await Review.findOne({
            userId,
            googleReviewId: reviewData.googleReviewId,
          });

          if (existingReview) {
            // Update existing review
            Object.assign(existingReview, {
              ...reviewData,
              userId,
              locationId,
              scrapedAt: new Date(),
            });
            await existingReview.save();
            savedReviews.push(existingReview);
          } else {
            // Create new review
            const newReview = new Review({
              ...reviewData,
              userId,
              locationId,
              scrapedAt: new Date(),
            });
            await newReview.save();
            savedReviews.push(newReview);
          }
        } catch (error) {
          console.error('Error saving review:', error);
        }
      }

      // Update location with scrape metadata
      const location = await Location.findById(locationId);
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

        // Recalculate sentiment
        await location.calculateSentiment();
        await location.addSentimentHistory();
      }
    } else {
      console.log('Test job: Skipping database save for reviews');
    }

    // Final progress update
    await job.progress({
      stage: 'completed',
      percentage: 100,
      message: `Successfully processed ${savedReviews.length} reviews`,
    });

    console.log(
      `Job ${job.id} completed successfully. Saved ${savedReviews.length} reviews.`
    );

    return {
      success: true,
      reviewsScraped: rawReviews.length,
      reviewsSaved: savedReviews.length,
      locationId,
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
