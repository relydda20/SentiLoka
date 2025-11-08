/**
 * Sentiment Analysis Service
 * Handles sentiment analysis operations
 */
import apiClient from "../utils/apiClient";

/**
 * Trigger sentiment analysis for a specific location
 * POST /api/review-sentiments/analyze-location/:locationId
 */
export const analyzeLocationSentiment = async (locationId) => {
  try {
    console.log("🔄 Starting sentiment analysis for location:", locationId);

    const response = await apiClient.post(
      `/review-sentiments/analyze-location/${locationId}`,
    );

    if (!response.data || !response.data.success) {
      throw new Error("Failed to start sentiment analysis");
    }

    const data = response.data.data;

    console.log(
      `✅ Sentiment analysis completed: ${data.analysis.newlyAnalyzed} reviews newly analyzed, ${data.analysis.alreadyAnalyzed} already analyzed`,
    );

    // Convert percentage-based sentiment to counts for display
    const totalReviews = data.sentiment?.totalReviews || 0;
    const positivePercentage = data.sentiment?.positive || 0;
    const neutralPercentage = data.sentiment?.neutral || 0;
    const negativePercentage = data.sentiment?.negative || 0;

    return {
      business: {
        id: locationId,
        name: data.location.name,
        sentiment: {
          positive: Math.round((positivePercentage / 100) * totalReviews),
          neutral: Math.round((neutralPercentage / 100) * totalReviews),
          negative: Math.round((negativePercentage / 100) * totalReviews),
          positivePercentage: positivePercentage,
          negativePercentage: negativePercentage,
          averageRating: data.sentiment?.averageRating || 0,
          totalReviews: totalReviews,
          lastCalculated: data.sentiment?.lastCalculated,
        },
        averageRating: data.sentiment?.averageRating || 0,
        reviewsCount: totalReviews,
        analysis: {
          totalReviews: data.analysis.totalReviews,
          alreadyAnalyzed: data.analysis.alreadyAnalyzed,
          newlyAnalyzed: data.analysis.newlyAnalyzed,
          failedAnalysis: data.analysis.failedAnalysis || 0,
        },
        lastScrapedAt:
          data.sentiment?.lastCalculated || new Date().toISOString(),
        needsRefresh: false,
      },
    };
  } catch (error) {
    console.error(
      `❌ Error analyzing sentiment for location ${locationId}:`,
      error,
    );

    return {
      business: {
        id: locationId,
        sentiment: {
          positive: 0,
          neutral: 0,
          negative: 0,
          positivePercentage: 0,
          negativePercentage: 0,
          averageRating: 0,
          totalReviews: 0,
        },
        averageRating: 0,
        reviewsCount: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        topAspects: {
          positive: [],
          negative: [],
        },
        recentTrend: {
          direction: "stable",
          change: 0,
        },
        cacheStatus: {
          isCached: false,
          lastScrapedAt: null,
          needsRefresh: true,
        },
      },
    };
  }
};

/**
 * Calculate overall sentiment statistics from all reviews
 */
export const calculateOverallSentiment = async (locationId) => {
  try {
    console.log("📊 Fetching overall sentiment statistics for all reviews...");

    const allSentimentsResponse = await apiClient.get(
      `/review-sentiments/location/${locationId}?page=1&limit=999999`,
    );

    if (allSentimentsResponse.data?.success) {
      const allReviews = allSentimentsResponse.data.data.reviews || [];
      const totalAnalyzed = allReviews.length;

      if (totalAnalyzed > 0) {
        const positiveCount = allReviews.filter(
          (r) => r.sentiment === "positive",
        ).length;
        const negativeCount = allReviews.filter(
          (r) => r.sentiment === "negative",
        ).length;
        const neutralCount = allReviews.filter(
          (r) => r.sentiment === "neutral",
        ).length;
        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) / totalAnalyzed;

        return {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
          positivePercentage: (positiveCount / totalAnalyzed) * 100,
          negativePercentage: (negativeCount / totalAnalyzed) * 100,
          averageRating: avgRating,
          totalReviews: totalAnalyzed,
        };
      }
    }
    return null;
  } catch (error) {
    console.warn(
      "⚠️ Could not fetch overall sentiment statistics:",
      error.message,
    );
    return null;
  }
};
