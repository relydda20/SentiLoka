import {
  analyzeReviewSentiment,
  processReviewsParallel,
} from "../utils/reviewSentimentAnalyzer.js";
import { CONFIG } from "../config/sentiment-analysis-config.js";

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
