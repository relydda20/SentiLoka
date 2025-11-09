import {
  analyzeReviewSentiment,
  processReviewsParallel,
} from "../utils/reviewSentimentAnalyzer.js";
import { CONFIG } from "../config/sentiment-analysis-config.js";
import ReviewSummary from "../models/ReviewSummary.model.js";
import Review from "../models/Review.model.js";
import Location from "../models/Location.model.js";
import UserLocation from "../models/UserLocation.model.js";
import { invalidateCacheForLocation } from "../services/chatbot-cache.service.js";
import {
  getCachedLocationReviews,
  cacheLocationReviews,
  getCachedLocationSentiments,
  cacheLocationSentiments,
  invalidateLocationCache,
} from "../services/redis-cache.service.js";
import {
  getUnanalyzedReviews,
  transformReviewsForAnalysis,
  analyzeReviews,
  saveAnalysisResults,
  getAnalysisStatistics,
} from "../services/review-analysis.service.js";

/**
 * Helper function to verify user has access to a location
 * @param {string} locationId - The location ID
 * @param {string} userId - The user ID
 * @returns {Promise<{location: Object, hasAccess: boolean}>}
 */
async function verifyLocationAccess(locationId, userId) {
  // Check if user has access to this location via UserLocation
  const userLocation = await UserLocation.findOne({
    userId,
    locationId,
    status: 'active'
  });

  if (!userLocation) {
    return { location: null, hasAccess: false };
  }

  // Get the location
  const location = await Location.findById(locationId);

  return { location, hasAccess: !!location };
}

/**
 * Analyze sentiment of a single review
 * @route POST /api/reviews/analyze
 */
export const analyzeSingleReview = async (req, res) => {
  try {
    const review = req.body;

    // Validate review object
    if (!review.author) {
      return res.status(400).json({
        success: false,
        error: "Review must include 'author' field",
      });
    }

    if (!review.rating) {
      return res.status(400).json({
        success: false,
        error: "Review must include 'rating' field",
      });
    }

    // Description is optional - rating-only reviews are allowed

    const result = await analyzeReviewSentiment(review);

    // Save summary to database (update if exists, insert if new)
    try {
      const summaryData = {
        reviewId: review.review_id || null,
        author: result.author,
        rating: result.rating,
        text: result.text,
        sentiment: result.sentiment,
        sentimentScore: result.sentiment_score,
        confidence: result.confidence,
        sentimentKeywords: result.sentiment_keywords || [],
        contextualTopics: result.contextual_topics || [],
        summary: result.summary,
        source: review.source || "Google Maps",
        processedAt: new Date(result.processed_at),
      };

      if (review.review_id) {
        // If reviewId exists, update or insert (upsert)
        await ReviewSummary.findOneAndUpdate(
          { reviewId: review.review_id },
          summaryData,
          { upsert: true, new: true }
        );
        console.log(`✓ Saved/Updated summary for review by ${result.author}`);
      } else {
        // If no reviewId, just insert
        const reviewSummary = new ReviewSummary(summaryData);
        await reviewSummary.save();
        console.log(`✓ Saved summary to database for review by ${result.author}`);
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error("Error saving summary to database:", dbError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Review sentiment analysis completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in analyzeSingleReview:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze review sentiment",
      details: error.message,
    });
  }
};

/**
 * Analyze sentiment of multiple reviews with parallel batch processing
 * @route POST /api/reviews/batch-analyze
 */
export const analyzeBatchReviews = async (req, res) => {
  try {
    const { reviews, batchSize, concurrentBatches } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({
        success: false,
        error: "Request must include 'reviews' array",
      });
    }

    if (reviews.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Reviews array cannot be empty",
      });
    }

    // Validate each review has required fields
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      if (!review.author || !review.rating || !review.description) {
        return res.status(400).json({
          success: false,
          error: `Review at index ${i} is missing required fields (author, rating, description)`,
        });
      }
    }

    const finalBatchSize = batchSize || CONFIG.BATCH_SIZE;
    const finalConcurrentBatches =
      concurrentBatches || CONFIG.CONCURRENT_BATCHES;

    console.log(
      `Starting batch review analysis: ${reviews.length} reviews, batch size: ${finalBatchSize}, concurrent batches: ${finalConcurrentBatches}`
    );

    const result = await processReviewsParallel(
      reviews,
      finalBatchSize,
      finalConcurrentBatches
    );

    // Save all successful summaries to database (update if exists)
    try {
      const successfulResults = result.results.filter(
        (r) => r.sentiment !== "error"
      );

      if (successfulResults.length > 0) {
        // Use bulk operations for better performance
        const bulkOps = successfulResults.map((r, index) => {
          const summaryData = {
            reviewId: reviews[index]?.review_id || null,
            author: r.author,
            rating: r.rating,
            text: r.text,
            sentiment: r.sentiment,
            sentimentScore: r.sentiment_score,
            confidence: r.confidence,
            sentimentKeywords: r.sentiment_keywords || [],
            contextualTopics: r.contextual_topics || [],
            summary: r.summary,
            source: reviews[index]?.source || "Google Maps",
            processedAt: new Date(r.processed_at),
          };

          if (reviews[index]?.review_id) {
            // Update if exists, insert if not (upsert)
            return {
              updateOne: {
                filter: { reviewId: reviews[index].review_id },
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

        const bulkResult = await ReviewSummary.bulkWrite(bulkOps, { ordered: false });
        console.log(
          `✓ Saved ${bulkResult.upsertedCount + bulkResult.insertedCount} new summaries, updated ${bulkResult.modifiedCount} existing summaries`
        );
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error("Error saving summaries to database:", dbError.message);
      if (dbError.writeErrors) {
        console.error(`${dbError.writeErrors.length} documents failed to save`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Batch review sentiment analysis completed successfully",
      data: result.results,
      statistics: result.statistics,
    });
  } catch (error) {
    console.error("Error in analyzeBatchReviews:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to batch analyze review sentiments",
      details: error.message,
    });
  }
};

/**
 * Get sentiment statistics from analyzed reviews
 * @route POST /api/reviews/statistics
 */
export const getReviewStatistics = async (req, res) => {
  try {
    const { analyzedReviews } = req.body;

    if (!analyzedReviews || !Array.isArray(analyzedReviews)) {
      return res.status(400).json({
        success: false,
        error: "Request must include 'analyzedReviews' array",
      });
    }

    const successfulReviews = analyzedReviews.filter(
      (r) => r.sentiment !== "error"
    );

    const sentimentDistribution = successfulReviews.reduce(
      (acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const averageScore =
      successfulReviews.length > 0
        ? successfulReviews.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) /
          successfulReviews.length
        : 0;

    const averageRating =
      successfulReviews.length > 0
        ? successfulReviews.reduce((sum, r) => sum + r.rating, 0) /
          successfulReviews.length
        : 0;

    // Collect all keywords and topics
    const allKeywords = {};
    const allTopics = {};

    successfulReviews.forEach((r) => {
      r.sentiment_keywords?.forEach((keyword) => {
        allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
      });
      r.contextual_topics?.forEach((topic) => {
        allTopics[topic] = (allTopics[topic] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(allKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    const topTopics = Object.entries(allTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // Rating distribution
    const ratingDistribution = successfulReviews.reduce((acc, r) => {
      const rating = Math.floor(r.rating);
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      message: "Statistics calculated successfully",
      statistics: {
        totalReviews: analyzedReviews.length,
        successfulReviews: successfulReviews.length,
        sentimentDistribution,
        averageSentimentScore: parseFloat(averageScore.toFixed(3)),
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution,
        topKeywords,
        topTopics,
      },
    });
  } catch (error) {
    console.error("Error in getReviewStatistics:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to calculate statistics",
      details: error.message,
    });
  }
};

/**
 * Filter reviews by sentiment
 * @route POST /api/reviews/filter
 */
export const filterReviewsBySentiment = async (req, res) => {
  try {
    const { analyzedReviews, sentiment, minScore, maxScore } = req.body;

    if (!analyzedReviews || !Array.isArray(analyzedReviews)) {
      return res.status(400).json({
        success: false,
        error: "Request must include 'analyzedReviews' array",
      });
    }

    let filtered = analyzedReviews;

    // Filter by sentiment type
    if (sentiment) {
      if (!["positive", "negative", "neutral"].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          error: "Sentiment must be 'positive', 'negative', or 'neutral'",
        });
      }
      filtered = filtered.filter((r) => r.sentiment === sentiment);
    }

    // Filter by score range
    if (minScore !== undefined) {
      filtered = filtered.filter((r) => r.sentiment_score >= minScore);
    }

    if (maxScore !== undefined) {
      filtered = filtered.filter((r) => r.sentiment_score <= maxScore);
    }

    return res.status(200).json({
      success: true,
      message: "Reviews filtered successfully",
      data: filtered,
      metadata: {
        totalResults: filtered.length,
        filters: {
          sentiment,
          minScore,
          maxScore,
        },
      },
    });
  } catch (error) {
    console.error("Error in filterReviewsBySentiment:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to filter reviews",
      details: error.message,
    });
  }
};

/**
 * Analyze sentiment for all reviews of a specific location (batch processing)
 * ⭐ OPTIMIZED: Only analyzes NEW reviews that haven't been analyzed yet
 * This is called AFTER scraping is complete
 * @route POST /api/reviews/analyze-location/:locationId
 */
export const analyzeLocationReviews = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    // Verify the user has access to this location
    const { location, hasAccess } = await verifyLocationAccess(locationId, userId);

    if (!hasAccess || !location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    console.log(`\n🔍 Checking reviews for location: ${location.name}`);

    // Get unanalyzed reviews using the service (reviews are now shared across users)
    const { allReviews, unanalyzedReviews, analyzedCount } =
      await getUnanalyzedReviews(locationId);

    if (allReviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No reviews found for this location. Please scrape reviews first.",
      });
    }

    // If no new reviews to analyze, return early
    if (unanalyzedReviews.length === 0) {
      console.log(
        `✅ All ${allReviews.length} reviews have already been analyzed!`
      );

      // Get current statistics (reviews are now shared across users)
      const stats = await getAnalysisStatistics(locationId);

      return res.status(200).json({
        success: true,
        message: `All reviews for ${location.name} have already been analyzed`,
        data: {
          location: {
            id: location._id,
            name: location.name,
            placeId: location.placeId,
          },
          analysis: {
            totalReviews: allReviews.length,
            alreadyAnalyzed: analyzedCount,
            newlyAnalyzed: 0,
            skipped: 0,
          },
          statistics: stats,
          sentiment: {
            positive: location.overallSentiment?.positive || 0,
            neutral: location.overallSentiment?.neutral || 0,
            negative: location.overallSentiment?.negative || 0,
            averageRating: location.overallSentiment?.averageRating || 0,
            totalReviews: location.overallSentiment?.totalReviews || 0,
            lastCalculated: location.overallSentiment?.lastCalculated,
          },
        },
      });
    }

    console.log(
      `📊 Found ${unanalyzedReviews.length} new reviews to analyze (${allReviews.length} total, ${analyzedCount} already analyzed)`
    );

    // Transform unanalyzed reviews for sentiment analysis
    const reviewsToAnalyze = transformReviewsForAnalysis(unanalyzedReviews);

    // Analyze only the NEW reviews
    const result = await analyzeReviews(
      reviewsToAnalyze,
      CONFIG.BATCH_SIZE,
      CONFIG.CONCURRENT_BATCHES
    );

    // Save the analysis results (summaries are now shared across users)
    const saveStats = await saveAnalysisResults(
      result.results,
      reviewsToAnalyze,
      locationId,
      location.placeId
    );

    // Recalculate location sentiment statistics
    await location.calculateSentiment();

    // Set lastAnalyzedAt timestamp
    location.lastAnalyzedAt = new Date();
    await location.save();

    // Invalidate caches since new reviews were analyzed
    await invalidateCacheForLocation(userId.toString(), locationId);
    console.log(`🗑️ Invalidated chatbot cache for location ${locationId}`);

    await invalidateLocationCache(locationId, userId.toString());
    console.log(`🗑️ Invalidated review cache for location ${locationId}`);

    // Get updated statistics (reviews are now shared across users)
    const finalStats = await getAnalysisStatistics(locationId);

    console.log(
      `✅ Analysis complete! Analyzed ${saveStats.inserted} new reviews, updated ${saveStats.updated}, failed ${saveStats.failed}`
    );

    return res.status(200).json({
      success: true,
      message: `Successfully analyzed ${saveStats.inserted + saveStats.updated} reviews for ${location.name}`,
      data: {
        location: {
          id: location._id,
          name: location.name,
          placeId: location.placeId,
        },
        analysis: {
          totalReviews: allReviews.length,
          alreadyAnalyzed: analyzedCount,
          newlyAnalyzed: saveStats.inserted + saveStats.updated,
          failedAnalysis: saveStats.failed,
        },
        statistics: {
          ...result.statistics,
          coverage: finalStats,
        },
        sentiment: {
          positive: location.overallSentiment?.positive || 0,
          neutral: location.overallSentiment?.neutral || 0,
          negative: location.overallSentiment?.negative || 0,
          averageRating: location.overallSentiment?.averageRating || 0,
          totalReviews: location.overallSentiment?.totalReviews || 0,
          lastCalculated: location.overallSentiment?.lastCalculated,
        },
      },
    });
  } catch (error) {
    console.error("Error in analyzeLocationReviews:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to analyze location reviews",
      details: error.message,
    });
  }
};

/**
 * Get analysis statistics for a location
 * ⭐ Check coverage before running expensive analysis operation
 * This is FAST - only counts documents, no API calls
 * @route GET /api/reviews/analysis-stats/:locationId
 */
export const getLocationAnalysisStats = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    // Verify the user has access to this location
    const { location, hasAccess } = await verifyLocationAccess(locationId, userId);

    if (!hasAccess || !location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    // Get analysis statistics (reviews are now shared across users)
    const stats = await getAnalysisStatistics(locationId);

    // Determine if analysis is needed
    const needsAnalysis = stats.unanalyzedReviews > 0;
    const isFullyAnalyzed = stats.analysisPercentage === 100;

    return res.status(200).json({
      success: true,
      message: isFullyAnalyzed
        ? `All reviews for ${location.name} have been analyzed`
        : `${stats.unanalyzedReviews} reviews need analysis for ${location.name}`,
      data: {
        location: {
          id: location._id,
          name: location.name,
          placeId: location.placeId,
        },
        statistics: stats,
        recommendations: {
          needsAnalysis,
          isFullyAnalyzed,
          message: needsAnalysis
            ? `Run POST /api/reviews/analyze-location/${locationId} to analyze ${stats.unanalyzedReviews} new reviews`
            : "All reviews are analyzed. No action needed.",
        },
      },
    });
  } catch (error) {
    console.error("Error in getLocationAnalysisStats:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to get analysis statistics",
      details: error.message,
    });
  }
};

/**
 * Recalculate sentiment statistics for a location from existing ReviewSummary data
 * This is FAST - only queries existing summaries, doesn't re-analyze with OpenAI
 * @route POST /api/reviews/recalculate-sentiment/:locationId
 */
export const recalculateSentimentStatistics = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    // Verify the user has access to this location
    const { location, hasAccess } = await verifyLocationAccess(locationId, userId);

    if (!hasAccess || !location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    console.log(`Recalculating sentiment statistics for location: ${location.name}`);

    // Check if there are any summaries (summaries are now shared across users)
    const summaryCount = await ReviewSummary.countDocuments({
      locationId,
      sentiment: { $ne: 'error' }
    });

    if (summaryCount === 0) {
      return res.status(404).json({
        success: false,
        error: "No sentiment summaries found for this location. Please analyze reviews first using POST /api/reviews/analyze-location/:locationId",
      });
    }

    // Recalculate sentiment statistics from existing summaries
    const sentimentData = await location.calculateSentiment();

    console.log(`✓ Recalculated sentiment statistics for ${location.name}`);
    console.log(`  - Total Reviews: ${sentimentData.totalReviews}`);
    console.log(`  - Average Rating: ${sentimentData.averageRating}`);
    console.log(`  - Positive: ${sentimentData.positive}%`);
    console.log(`  - Neutral: ${sentimentData.neutral}%`);
    console.log(`  - Negative: ${sentimentData.negative}%`);

    return res.status(200).json({
      success: true,
      message: `Successfully recalculated sentiment statistics for ${location.name}`,
      data: {
        location: {
          id: location._id,
          name: location.name,
          placeId: location.placeId,
        },
        sentiment: {
          positive: sentimentData.positive,
          neutral: sentimentData.neutral,
          negative: sentimentData.negative,
          averageRating: sentimentData.averageRating,
          totalReviews: sentimentData.totalReviews,
          lastCalculated: sentimentData.lastCalculated,
        },
      },
    });
  } catch (error) {
    console.error("Error in recalculateSentimentStatistics:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to recalculate sentiment statistics",
      details: error.message,
    });
  }
};

/**
 * Get all sentiment analysis results for a specific location
 * @route GET /api/reviews/location/:locationId
 */
export const getLocationSentiments = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    // Parse query parameters for pagination and filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder || 'desc';
    const sentiment = req.query.sentiment;
    const rating = req.query.rating ? parseInt(req.query.rating) : null;
    const searchTerm = req.query.search ? req.query.search.trim() : null;

    const skip = (page - 1) * limit;

    // Verify the user has access to this location
    const { location, hasAccess } = await verifyLocationAccess(locationId, userId);

    if (!hasAccess || !location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    // Build query for ReviewSummary
    const query = { locationId };
    
    // Add sentiment filter
    if (sentiment && sentiment !== 'all') {
      query.sentiment = sentiment.toLowerCase();
    }

    // Add rating filter
    if (rating && rating >= 1 && rating <= 5) {
      query.rating = rating;
    }

    // Add search filter (search in review text and author name)
    if (searchTerm) {
      query.$or = [
        { text: { $regex: searchTerm, $options: 'i' } },
        { author: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Build sort object with secondary sort by _id for consistency
    const sortField = sortBy === 'date' ? 'publishedAt' : 'rating';
    const sort = {
      [sortField]: sortOrder === 'asc' ? 1 : -1,
      _id: -1 // Secondary sort for consistent pagination
    };

    // Get total count for pagination with filters
    const totalItems = await ReviewSummary.countDocuments(query);

    // Get total count WITHOUT filters to determine if location has ANY analyzed reviews
    const totalAnalyzedReviews = await ReviewSummary.countDocuments({ locationId });

    // Get paginated sentiment summaries
    const summaries = await ReviewSummary.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Prepare response data with pagination
    const responseData = {
      reviews: summaries,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        totalAnalyzedReviews, // Total count ignoring filters
        limit,
        hasNext,
        hasPrev,
      },
    };

    // Determine appropriate message based on results
    let message = `Found ${summaries.length} reviews`;
    if (summaries.length === 0) {
      if (sentiment && sentiment !== 'all') {
        message = `No ${sentiment} reviews found. Try different filters.`;
      } else if (searchTerm || rating) {
        message = "No reviews found matching your search or filter criteria.";
      } else {
        message = "No analyzed reviews found. Please analyze reviews first.";
      }
    } else {
      message = `Found ${summaries.length} reviews (page ${page}/${totalPages})`;
    }

    return res.status(200).json({
      success: true,
      message,
      data: responseData,
    });
  } catch (error) {
    console.error("Error in getLocationSentiments:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to get location sentiments",
      details: error.message,
    });
  }
};


/**
 * Reanalyze sentiment - Keep reviews, delete and redo sentiment analysis
 * @route POST /api/reviews/reanalyze/:locationId
 * @access Private
 */
export const reanalyzeSentiment = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    // Verify user has access
    const { location, hasAccess } = await verifyLocationAccess(locationId, userId);

    if (!hasAccess || !location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    // Delete all existing sentiment analysis
    await ReviewSummary.deleteMany({ locationId });

    // Reset sentiment data and timestamp
    location.overallSentiment = {
      positive: 0,
      neutral: 0,
      negative: 0,
      averageRating: 0,
      totalReviews: 0
    };
    location.lastAnalyzedAt = null;
    await location.save();

    // Get all reviews to reanalyze
    const reviews = await Review.find({ locationId });

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No reviews found to analyze. Please scrape reviews first.",
      });
    }

    // Start reanalysis (this will set lastAnalyzedAt when complete)
    const transformedReviews = await transformReviewsForAnalysis(reviews);
    const analysisResults = await analyzeReviews(transformedReviews);
    await saveAnalysisResults(analysisResults, locationId);

    // Recalculate overall sentiment
    await location.calculateSentiment();

    // Set lastAnalyzedAt
    location.lastAnalyzedAt = new Date();
    await location.save();

    // Invalidate caches
    await invalidateLocationCache(locationId);
    await invalidateCacheForLocation(locationId);

    return res.status(200).json({
      success: true,
      message: `Reanalyzed ${reviews.length} reviews successfully`,
      data: {
        totalReviews: reviews.length,
        analyzedCount: analysisResults.length,
        sentiment: location.overallSentiment,
        lastAnalyzedAt: location.lastAnalyzedAt
      }
    });
  } catch (error) {
    console.error('Error reanalyzing sentiment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reanalyze sentiment',
      details: error.message,
    });
  }
};
