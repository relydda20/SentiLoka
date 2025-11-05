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
const mapReviewToFrontend = (review, reviewSource) => ({
  id: review._id,
  reviewId: review.reviewId,
  author: review.authorName || review.author || "Anonymous",
  rating: review.rating,
  text: review.text || review.reviewText || "",
  date: review.publishedAt,
  sentiment: review.sentiment || null,
  sentimentScore: review.sentimentScore || null,
  summary: review.summary || null,
  sentimentKeywords: review.sentimentKeywords || [],
  contextualTopics: review.contextualTopics || [],
  isAnalyzed: reviewSource === "analyzed",
});

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

      if (analyzedResponse.data?.success && analyzedResponse.data.data?.reviews?.length > 0) {
        reviews = analyzedResponse.data.data.reviews || [];
        pagination = analyzedResponse.data.data.pagination;
        reviewSource = "analyzed";
        hasAnalyzedReviews = true;
        console.log(`✅ Fetched ${reviews.length} ANALYZED reviews`);
      }
    } catch (analyzedError) {
      console.log("⚠️ Error fetching analyzed reviews:", analyzedError.response?.status);
    }

    // Fallback to raw reviews if no analyzed reviews found
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
 * Load reviews for a location (triggers scraping if needed)
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
      onScrapeProgress = null,
      forceScrape = false,
    } = options;

    // Check location scrape status
    const location = await getLocationScrapeStatus(locationId);

    const needsScraping =
      forceScrape ||
      location.scrapeStatus === "idle" ||
      location.scrapeStatus === "failed" ||
      !location.scrapeConfig?.lastScraped;

    // Trigger scraping if needed
    if (needsScraping) {
      console.log("🚀 Location needs scraping, triggering scraper...");

      if (!location.googleMapsUrl || location.googleMapsUrl.trim() === "") {
        throw new Error(
          `Cannot scrape location "${location.name}": Google Maps URL is not set.`,
        );
      }

      const scrapeResult = await triggerLocationScrape(locationId);
      console.log(`✅ Scrape job started: ${scrapeResult.jobId}`);

      // Use SSE instead of polling for real-time progress
      await subscribeScrapeProgress(scrapeResult.jobId, {
        onProgress: onScrapeProgress,
        onComplete: () => console.log("✅ Scraping completed!"),
        onError: (error) => console.error("❌ Scraping failed:", error),
      });
    } else {
      console.log("✅ Location already scraped, loading reviews...");
    }

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

    if (!reviews || (reviews.length === 0 && !rating && !searchTerm && sentiment === "all")) {
      throw new Error("No reviews found for this location");
    }

    const mappedReviews = reviews.map((review) => mapReviewToFrontend(review, reviewSource));

    return {
      business: {
        id: locationId,
        reviews: mappedReviews,
        reviewsCount: totalReviewsInDB || pagination?.totalItems || 0,
        reviewSource,
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalReviews: pagination.totalItems,
          limit: pagination.limit,
          hasNextPage: pagination.hasNext,
          hasPrevPage: pagination.hasPrev,
        },
        scrapeStatus: "completed",
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
