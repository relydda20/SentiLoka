import Review from '../models/Review.model.js';
import ReviewSummary from '../models/ReviewSummary.model.js';
import { processReviewsParallel } from '../utils/reviewSentimentAnalyzer.js';
import { CONFIG } from '../config/sentiment-analysis-config.js';
import { getCachedLocationReviews, cacheLocationReviews } from './redis-cache.service.js';

/**
 * Get reviews that haven't been analyzed yet (with caching optimization)
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object containing all reviews and unanalyzed reviews
 */
export const getUnanalyzedReviews = async (locationId, userId) => {
  console.log('🔍 Checking for unanalyzed reviews...');

  let allReviews = [];

  // ✅ Check the "all reviews" cache key first (pre-cached by scraper)
  const allReviewsCacheKey = `${locationId}:${userId}:all:reviews`;
  const cachedData = await getCachedLocationReviews(allReviewsCacheKey, userId);

  if (cachedData && cachedData.reviews && cachedData.reviews.length > 0) {
    console.log(`✓ Found ${cachedData.reviews.length} reviews in cache (pre-cached from scraper)`);
    allReviews = cachedData.reviews;
  } else {
    console.log('⚠️ Cache miss - fetching all reviews from MongoDB...');
    // Get all reviews for this location
    allReviews = await Review.find({ locationId, userId })
      .sort({ publishedAt: -1 })
      .lean();

    // Cache for next time (in case scraper didn't cache it)
    if (allReviews.length > 0) {
      await cacheLocationReviews(allReviewsCacheKey, userId, {
        location: { id: locationId },
        reviews: allReviews,
        pagination: {
          page: 1,
          limit: allReviews.length,
          totalReviews: allReviews.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        filters: {},
      });
      console.log(`✓ Cached ${allReviews.length} reviews for future analysis`);
    }
  }

  if (allReviews.length === 0) {
    return {
      allReviews: [],
      unanalyzedReviews: [],
      analyzedCount: 0,
    };
  }

  // Get all already-analyzed review IDs from ReviewSummary
  const analyzedReviewIds = await ReviewSummary.find(
    { locationId, userId },
    { reviewId: 1, _id: 0 }
  ).distinct('reviewId');

  // Create a Set for faster lookup
  const analyzedSet = new Set(analyzedReviewIds);

  // Filter to only unanalyzed reviews
  const unanalyzedReviews = allReviews.filter(
    (review) => !analyzedSet.has(review.googleReviewId)
  );

  return {
    allReviews,
    unanalyzedReviews,
    analyzedCount: allReviews.length - unanalyzedReviews.length,
  };
};

/**
 * Transform reviews to format expected by sentiment analyzer
 * @param {Array} reviews - Array of Review documents
 * @returns {Array} Transformed reviews ready for analysis
 */
export const transformReviewsForAnalysis = (reviews) => {
  return reviews.map((review) => ({
    review_id: review.googleReviewId,
    author: review.author?.name || 'Anonymous',
    rating: review.rating,
    description: review.text || '', // Handle reviews with no text
    source: 'Google Maps',
    publishedAt: review.publishedAt, // Include publishedAt for ReviewSummary
  }));
};

/**
 * Analyze reviews in parallel batches
 * @param {Array} reviews - Reviews to analyze
 * @param {number} batchSize - Batch size (optional)
 * @param {number} concurrentBatches - Number of concurrent batches (optional)
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeReviews = async (
  reviews,
  batchSize = CONFIG.BATCH_SIZE,
  concurrentBatches = CONFIG.CONCURRENT_BATCHES
) => {
  console.log(
    `🔄 Analyzing ${reviews.length} reviews (batch size: ${batchSize}, concurrent: ${concurrentBatches})`
  );

  const result = await processReviewsParallel(
    reviews,
    batchSize,
    concurrentBatches
  );

  return result;
};

/**
 * Save analysis results to ReviewSummary collection
 * @param {Array} analysisResults - Results from sentiment analysis
 * @param {Array} originalReviews - Original review objects for matching
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @param {string} placeId - Place ID
 * @returns {Promise<Object>} Save statistics
 */
export const saveAnalysisResults = async (
  analysisResults,
  originalReviews,
  locationId,
  userId,
  placeId
) => {
  const successfulResults = analysisResults.filter(
    (r) => r.sentiment !== 'error'
  );

  if (successfulResults.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      failed: analysisResults.length,
    };
  }

  // Build bulk operations
  const bulkOps = successfulResults.map((result, index) => {
    const summaryData = {
      reviewId: originalReviews[index]?.review_id || null,
      userId: userId,
      locationId: locationId,
      placeId: placeId,
      author: result.author,
      rating: result.rating,
      text: result.text,
      publishedAt: originalReviews[index]?.publishedAt || new Date(), // Include publishedAt
      sentiment: result.sentiment,
      sentimentScore: result.sentiment_score,
      confidence: result.confidence,
      sentimentKeywords: result.sentiment_keywords || [],
      contextualTopics: result.contextual_topics || [],
      summary: result.summary,
      source: originalReviews[index]?.source || 'Google Maps',
      processedAt: new Date(result.processed_at),
    };

    if (originalReviews[index]?.review_id) {
      // Update if exists, insert if not (upsert)
      return {
        updateOne: {
          filter: {
            reviewId: originalReviews[index].review_id,
            userId: userId,
            locationId: locationId,
          },
          update: { $set: summaryData },
          upsert: true,
        },
      };
    } else {
      // Insert new document
      return {
        insertOne: {
          document: summaryData,
        },
      };
    }
  });

  try {
    const bulkResult = await ReviewSummary.bulkWrite(bulkOps, {
      ordered: false,
    });

    const stats = {
      inserted: bulkResult.upsertedCount + bulkResult.insertedCount,
      updated: bulkResult.modifiedCount,
      failed: analysisResults.length - successfulResults.length,
    };

    console.log(
      `✅ Saved analysis results: ${stats.inserted} new, ${stats.updated} updated, ${stats.failed} failed`
    );

    return stats;
  } catch (error) {
    console.error('❌ Error saving analysis results:', error);
    throw error;
  }
};

/**
 * Get analysis statistics for a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Analysis statistics
 */
export const getAnalysisStatistics = async (locationId, userId) => {
  const [totalReviews, analyzedReviews] = await Promise.all([
    Review.countDocuments({ locationId, userId }),
    ReviewSummary.countDocuments({ locationId, userId }),
  ]);

  return {
    totalReviews,
    analyzedReviews,
    unanalyzedReviews: totalReviews - analyzedReviews,
    analysisPercentage:
      totalReviews > 0
        ? parseFloat(((analyzedReviews / totalReviews) * 100).toFixed(2))
        : 0,
  };
};

export default {
  getUnanalyzedReviews,
  transformReviewsForAnalysis,
  analyzeReviews,
  saveAnalysisResults,
  getAnalysisStatistics,
};
