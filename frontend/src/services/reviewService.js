/**
 * Review Service
 * Handles review fetching and management operations
 */
import apiClient from "../utils/apiClient";
import { getLocationScrapeStatus } from "./locationService";
import { triggerLocationScrape, subscribeScrapeProgress } from "./scraperService";
import { calculateOverallSentiment } from "./sentimentService";

const REVIEWS_PER_PAGE = 5;

/**
 * Map review data from backend to frontend format
 */
const mapReviewToFrontend = (review, reviewSource) => {
  // ReviewSummary model fields: author, rating, text, publishedAt, sentiment, sentimentScore, etc.
  // Raw Review model fields: authorName, rating, reviewText, publishedAt (no sentiment data)
  const mapped = {
    id: review._id,
    reviewId: review.reviewId,
    author: review.author || review.authorName || "Anonymous",
    rating: review.rating,
    text: review.text || review.reviewText || "",
    date: review.publishedAt,
    sentiment: review.sentiment || null,
    sentimentScore: review.sentimentScore || null,
    summary: review.summary || null,
    sentimentKeywords: review.sentimentKeywords || [],
    contextualTopics: review.contextualTopics || [],
    isAnalyzed: reviewSource === "analyzed",
  };

  // Debug log for first few reviews to verify data
  if (review._id && Math.random() < 0.1) { // Log ~10% of reviews for debugging
    console.log('📋 Mapped review:', {
      id: review._id,
      author: mapped.author,
      sentiment: mapped.sentiment,
      reviewSource,
      hasRawSentiment: !!review.sentiment
    });
  }

  return mapped;
};

/**
 * Get total review count (unfiltered)
 */
const getTotalReviewCount = async (locationId, sortBy, sortOrder) => {
  try {
    const countParams = new URLSearchParams({
      page: "1",
      limit: "1",
      sortBy,
      sortOrder,
    });
    const countResponse = await apiClient.get(
      `/reviews/location/${locationId}?${countParams.toString()}`,
    );
    if (countResponse.data?.success) {
      return countResponse.data.data.pagination.totalItems;
    }
  } catch (error) {
    console.log("⚠️ Could not get total count");
  }
  return 0;
};

/**
 * Build sentiment summary from location data or analyzed reviews
 */
const buildSentimentSummary = (location, reviewSource, allReviews = null) => {
  // Priority 1: Use pre-calculated sentiment from location
  if (location.overallSentiment && location.overallSentiment.totalReviews > 0) {
    const totalReviews = location.overallSentiment.totalReviews;
    const positivePercentage = location.overallSentiment.positive || 0;
    const neutralPercentage = location.overallSentiment.neutral || 0;
    const negativePercentage = location.overallSentiment.negative || 0;

    console.log("📊 Using pre-calculated sentiment from location");
    return {
      positive: Math.round((positivePercentage / 100) * totalReviews),
      neutral: Math.round((neutralPercentage / 100) * totalReviews),
      negative: Math.round((negativePercentage / 100) * totalReviews),
      positivePercentage: positivePercentage,
      negativePercentage: negativePercentage,
      averageRating: location.overallSentiment.averageRating || 0,
      totalReviews: totalReviews,
    };
  }

  // Priority 2: Calculate from all reviews if provided
  if (reviewSource === "analyzed" && allReviews && allReviews.length > 0) {
    const totalAnalyzed = allReviews.length;
    const positiveCount = allReviews.filter((r) => r.sentiment === "positive").length;
    const negativeCount = allReviews.filter((r) => r.sentiment === "negative").length;
    const neutralCount = allReviews.filter((r) => r.sentiment === "neutral").length;
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalAnalyzed;

    console.log("📊 Calculated sentiment from reviews");
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

  return null;
};

/**
 * Fetch existing reviews from database WITHOUT triggering a scrape
 * Use for: page refreshes, marker clicks, pagination, filtering
 */
export const fetchExistingReviews = async (locationId, options = {}) => {
  try {
    console.log("📥 Fetching existing reviews (no scraping) for location:", locationId);

    const {
      page = 1,
      limit = REVIEWS_PER_PAGE,
      sentiment = "all",
      rating = 0,
      searchTerm = "",
      sortBy = "date",
      sortOrder = "desc",
    } = options;

    const location = await getLocationScrapeStatus(locationId);
    const totalReviewsInDB = await getTotalReviewCount(locationId, sortBy, sortOrder);

    // Build query params with filters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (rating > 0) {
      params.append("rating", rating.toString());
    }

    if (searchTerm && searchTerm.trim() !== "") {
      params.append("search", searchTerm.trim());
    }

    let reviews = [];
    let pagination = null;
    let reviewSource = "raw";

    // Try ANALYZED reviews first
    let hasAnalyzedReviews = false;
    try {
      console.log("🔍 Attempting to load analyzed reviews...");
      const analyzedParams = new URLSearchParams(params);
      if (sentiment !== "all") {
        analyzedParams.append("sentiment", sentiment);
      }

      const analyzedResponse = await apiClient.get(
        `/review-sentiments/location/${locationId}?${analyzedParams.toString()}`,
      );

      if (analyzedResponse.data?.success) {
        reviews = analyzedResponse.data.data?.reviews || [];
        pagination = analyzedResponse.data.data?.pagination || null;
        reviewSource = "analyzed";
        hasAnalyzedReviews = true;
        console.log(`✅ Fetched ${reviews.length} ANALYZED reviews`);
      }
    } catch (analyzedError) {
      console.log("⚠️ Error fetching analyzed reviews:", analyzedError.response?.status);
      // Only continue to fallback if the error is NOT a filter-related issue
      // If it's a 404 or 500, we can try raw reviews
      // But if sentiment filter was applied and failed, don't fall back to raw reviews (they don't have sentiment)
      if (sentiment !== "all") {
        console.log("⚠️ Sentiment filter applied but analyzed reviews unavailable - returning empty");
        reviews = [];
        pagination = {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          limit,
          hasNext: false,
          hasPrev: false,
        };
        hasAnalyzedReviews = true; // Prevent fallback to raw reviews
      }
    }

    // Fallback to raw reviews if no analyzed reviews found AND no sentiment filter applied
    if (!hasAnalyzedReviews) {
      console.log("⚠️ No analyzed reviews found, trying raw reviews...");
      try {
        const rawResponse = await apiClient.get(
          `/reviews/location/${locationId}?${params.toString()}`,
        );

        if (rawResponse.data?.success) {
          reviews = rawResponse.data.data.reviews || [];
          pagination = rawResponse.data.data.pagination;
          reviewSource = "raw";
          console.log(`✅ Fetched ${reviews.length} RAW reviews`);
        }
      } catch (rawError) {
        if (rawError.response?.status === 404) {
          console.log("⚠️ No raw reviews found");
          reviews = [];
          pagination = {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            limit,
            hasNext: false,
            hasPrev: false,
          };
        }
      }
    }

    const mappedReviews = reviews.map((review) => mapReviewToFrontend(review, reviewSource));

    // Get overall sentiment if analyzed
    let sentimentSummary = null;
    if (reviewSource === "analyzed") {
      sentimentSummary = await calculateOverallSentiment(locationId);
      if (!sentimentSummary) {
        sentimentSummary = buildSentimentSummary(location, reviewSource, mappedReviews);
      }
    } else {
      sentimentSummary = buildSentimentSummary(location, reviewSource);
    }

    const finalPagination = pagination
      ? {
          currentPage: pagination.currentPage || page,
          totalPages: pagination.totalPages || 0,
          totalReviews: pagination.totalItems || 0,
          limit: pagination.limit || limit,
          hasNextPage: pagination.hasNext !== undefined ? pagination.hasNext : false,
          hasPrevPage: pagination.hasPrev !== undefined ? pagination.hasPrev : false,
        }
      : {
          currentPage: page,
          totalPages: 0,
          totalReviews: 0,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        };

    return {
      business: {
        id: locationId,
        reviews: mappedReviews,
        reviewsCount: totalReviewsInDB || pagination?.totalItems || 0,
        reviewSource,
        sentiment: sentimentSummary,
        pagination: finalPagination,
        scrapeStatus: location.scrapeStatus,
        lastScraped: location.scrapeConfig?.lastScraped,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching existing reviews:", error);
    throw error;
  }
};

/**
 * Manually trigger scraping and load reviews
 * This should be called when the user explicitly clicks "Load Reviews"
 */
export const loadReviewsWithScraping = async (locationId, options = {}) => {
  try {
    console.log("🚀 Manually triggering scrape for location:", locationId);

    const {
      onScrapeProgress = null,
    } = options;

    // Check location status
    const { getLocationScrapeStatus } = await import("./locationService");
    const location = await getLocationScrapeStatus(locationId);

    // Check if we need to scrape
    const needsScraping =
      location.scrapeStatus === "idle" ||
      location.scrapeStatus === "failed" ||
      !location.scrapeConfig?.lastScraped;

    // Trigger scraping if needed
    if (needsScraping) {
      console.log("🚀 Starting scrape job...");

      if (!location.googleMapsUrl || location.googleMapsUrl.trim() === "") {
        throw new Error(
          `Cannot scrape location "${location.name}": Google Maps URL is not set.`,
        );
      }

      const { triggerLocationScrape, subscribeScrapeProgress } = await import("./scraperService");

      const scrapeResult = await triggerLocationScrape(locationId);
      console.log(`✅ Scrape job started: ${scrapeResult.jobId}`);

      // Use SSE for real-time progress
      await subscribeScrapeProgress(scrapeResult.jobId, {
        onProgress: onScrapeProgress,
        onComplete: () => console.log("✅ Scraping completed!"),
        onError: (error) => console.error("❌ Scraping failed:", error),
      });
    } else {
      console.log("✅ Location already scraped");
    }

    // Now load the reviews from database
    return await loadBusinessReviews(locationId, options);
  } catch (error) {
    console.error(`❌ Error loading reviews with scraping for location ${locationId}:`, error);
    throw error;
  }
};

/**
 * Load reviews for a location (NO AUTO-SCRAPE - just loads existing data)
 * Use loadReviewsWithScraping() if you need to trigger scraping
 */
export const loadBusinessReviews = async (locationId, options = {}) => {
  try {
    console.log("🔄 Loading reviews for location:", locationId);

    const {
      page = 1,
      limit = REVIEWS_PER_PAGE,
      sentiment = "all",
      rating = 0,
      searchTerm = "",
      sortBy = "date",
      sortOrder = "desc",
    } = options;

    // Check location scrape status
    const location = await getLocationScrapeStatus(locationId);

    // NO AUTO-SCRAPING - just load existing data
    console.log("📥 Loading existing reviews without triggering scrape...");

    // Load reviews from database
    const totalReviewsInDB = await getTotalReviewCount(locationId, sortBy, sortOrder);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (rating > 0) {
      params.append("rating", rating.toString());
    }

    if (searchTerm && searchTerm.trim() !== "") {
      params.append("search", searchTerm.trim());
    }

    let reviews = [];
    let pagination = null;
    let reviewSource = "raw";

    // Try raw reviews first
    try {
      const rawResponse = await apiClient.get(
        `/reviews/location/${locationId}?${params.toString()}`,
      );

      if (rawResponse.data?.success && rawResponse.data.data?.reviews?.length > 0) {
        reviews = rawResponse.data.data.reviews;
        pagination = rawResponse.data.data.pagination;
        reviewSource = "raw";
      }
    } catch (rawError) {
      if (rawError.response?.status === 404 && (rating > 0 || searchTerm)) {
        reviews = [];
        pagination = {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          limit,
          hasNext: false,
          hasPrev: false,
        };
      } else {
        // Try analyzed reviews
        if (sentiment !== "all") {
          params.append("sentiment", sentiment);
        }

        const analyzedResponse = await apiClient.get(
          `/review-sentiments/location/${locationId}?${params.toString()}`,
        );

        if (analyzedResponse.data?.success) {
          reviews = analyzedResponse.data.data.reviews || [];
          pagination = analyzedResponse.data.data.pagination;
          reviewSource = "analyzed";
        }
      }
    }

    // If no reviews found, return empty data (no error thrown)
    const mappedReviews = reviews.map((review) => mapReviewToFrontend(review, reviewSource));

    return {
      business: {
        id: locationId,
        reviews: mappedReviews,
        reviewsCount: totalReviewsInDB || pagination?.totalItems || 0,
        reviewSource,
        pagination: pagination ? {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalReviews: pagination.totalItems,
          limit: pagination.limit,
          hasNextPage: pagination.hasNext,
          hasPrevPage: pagination.hasPrev,
        } : {
          currentPage: page,
          totalPages: 0,
          totalReviews: 0,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
        scrapeStatus: location.scrapeStatus || "idle",
        lastScraped: location.scrapeConfig?.lastScraped,
      },
    };
  } catch (error) {
    console.error(`❌ Error loading reviews for location ${locationId}:`, error);

    return {
      business: {
        id: locationId,
        reviews: [],
        reviewsCount: 0,
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalReviews: 0,
          limit: REVIEWS_PER_PAGE,
          hasNextPage: false,
          hasPrevPage: false,
        },
        scrapeStatus: "failed",
        error: error.message,
      },
    };
  }
};

/**
 * Reanalyze sentiment for a location
 * Deletes existing sentiment analysis, keeps reviews, redoes analysis
 * @param {string} locationId - Location ID
 * @returns {Promise} - Reanalysis result
 */
export const reanalyzeSentiment = async (locationId) => {
  try {
    console.log("🔄 Reanalyzing sentiment for location:", locationId);
    const response = await apiClient.post(`/review-sentiments/reanalyze/${locationId}`);

    if (response.data?.success) {
      console.log("✅ Sentiment reanalysis completed");
      return response.data;
    }

    throw new Error(response.data?.error || "Failed to reanalyze sentiment");
  } catch (error) {
    console.error("❌ Error reanalyzing sentiment:", error);
    throw error;
  }
};
