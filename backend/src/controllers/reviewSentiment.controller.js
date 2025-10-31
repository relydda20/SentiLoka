import {
  analyzeReviewSentiment,
  processReviewsParallel,
} from "../utils/reviewSentimentAnalyzer.js";
import { CONFIG } from "../config/sentiment-analysis-config.js";
import ReviewSummary from "../models/ReviewSummary.model.js";
import Review from "../models/Review.model.js";
import Location from "../models/Location.model.js";

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

    if (!review.description) {
      return res.status(400).json({
        success: false,
        error: "Review must include 'description' field",
      });
    }

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
 * Analyze sentiment for all reviews of a specific location
 * @route POST /api/reviews/analyze-location/:locationId
 */
export const analyzeLocationReviews = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;

    // Verify the location belongs to the user
    const location = await Location.findOne({ _id: locationId, userId });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    // Get all reviews for this location
    const reviews = await Review.find({ locationId, userId });

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No reviews found for this location",
      });
    }

    console.log(`Starting sentiment analysis for ${reviews.length} reviews from location: ${location.name}`);

    // Transform reviews to match the expected format for the analyzer
    const reviewsToAnalyze = reviews.map(review => ({
      review_id: review.googleReviewId,
      author: review.author.name,
      rating: review.rating,
      description: review.text,
      source: "Google Maps",
    }));

    // Use parallel batch processing for efficiency
    const result = await processReviewsParallel(
      reviewsToAnalyze,
      CONFIG.BATCH_SIZE,
      CONFIG.CONCURRENT_BATCHES
    );

    // Save all successful summaries to database
    try {
      const successfulResults = result.results.filter(
        (r) => r.sentiment !== "error"
      );

      if (successfulResults.length > 0) {
        const bulkOps = successfulResults.map((r, index) => {
          const summaryData = {
            reviewId: reviewsToAnalyze[index]?.review_id || null,
            userId: userId,
            locationId: locationId,
            placeId: location.placeId,
            author: r.author,
            rating: r.rating,
            text: r.text,
            sentiment: r.sentiment,
            sentimentScore: r.sentiment_score,
            confidence: r.confidence,
            sentimentKeywords: r.sentiment_keywords || [],
            contextualTopics: r.contextual_topics || [],
            summary: r.summary,
            source: reviewsToAnalyze[index]?.source || "Google Maps",
            processedAt: new Date(r.processed_at),
          };

          if (reviewsToAnalyze[index]?.review_id) {
            return {
              updateOne: {
                filter: { reviewId: reviewsToAnalyze[index].review_id },
                update: { $set: summaryData },
                upsert: true,
              },
            };
          } else {
            return {
              insertOne: {
                document: summaryData,
              },
            };
          }
        });

        const bulkResult = await ReviewSummary.bulkWrite(bulkOps, { ordered: false });
        console.log(
          `✓ Saved ${bulkResult.upsertedCount + bulkResult.insertedCount} new summaries, updated ${bulkResult.modifiedCount} existing summaries for location: ${location.name}`
        );

        // Update location's overall sentiment
        await location.calculateSentiment();
      }
    } catch (dbError) {
      console.error("Error saving summaries to database:", dbError.message);
      if (dbError.writeErrors) {
        console.error(`${dbError.writeErrors.length} documents failed to save`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully analyzed ${result.results.length} reviews for ${location.name}`,
      data: {
        locationId: location._id,
        locationName: location.name,
        placeId: location.placeId,
        totalReviews: reviews.length,
        analyzedReviews: result.results.length,
        statistics: result.statistics,
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
 * Get all sentiment analysis results for a specific location
 * @route GET /api/reviews/location/:locationId
 */
export const getLocationSentiments = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.user._id;
    const { sentiment, limit = 100 } = req.query;

    // Verify the location belongs to the user
    const location = await Location.findOne({ _id: locationId, userId });

    if (!location) {
      return res.status(404).json({
        success: false,
        error: "Location not found or you don't have access to it",
      });
    }

    // Build query
    const query = {
      userId,
      locationId,
      sentiment: { $ne: "error" },
    };

    // Add sentiment filter if provided
    if (sentiment && ["positive", "negative", "neutral"].includes(sentiment)) {
      query.sentiment = sentiment;
    }

    // Get summaries
    const summaries = await ReviewSummary.find(query)
      .sort({ processedAt: -1 })
      .limit(parseInt(limit))
      .select("author rating text sentiment sentimentScore confidence sentimentKeywords contextualTopics summary processedAt");

    // Calculate statistics
    const totalSummaries = await ReviewSummary.countDocuments({ userId, locationId, sentiment: { $ne: "error" } });

    const sentimentDistribution = await ReviewSummary.aggregate([
      { $match: { userId, locationId, sentiment: { $ne: "error" } } },
      {
        $group: {
          _id: "$sentiment",
          count: { $sum: 1 },
        },
      },
    ]);

    const distributionMap = sentimentDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    // Get average sentiment score and rating
    const avgStats = await ReviewSummary.aggregate([
      { $match: { userId, locationId, sentiment: { $ne: "error" } } },
      {
        $group: {
          _id: null,
          avgSentimentScore: { $avg: "$sentimentScore" },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const statistics = {
      totalSummaries,
      sentimentDistribution: distributionMap,
      averageSentimentScore: avgStats[0]?.avgSentimentScore?.toFixed(3) || 0,
      averageRating: avgStats[0]?.avgRating?.toFixed(2) || 0,
    };

    return res.status(200).json({
      success: true,
      message: `Retrieved ${summaries.length} sentiment summaries for ${location.name}`,
      data: {
        location: {
          id: location._id,
          name: location.name,
          placeId: location.placeId,
        },
        summaries,
        statistics,
      },
    });
  } catch (error) {
    console.error("Error in getLocationSentiments:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve location sentiments",
      details: error.message,
    });
  }
};
