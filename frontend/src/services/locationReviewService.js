/* Fetched content from:
 * - relydda20/sentiloka/SentiLoka-feature-sentiment-map-design/frontend/src/services/locationReviewService.js
 */
import apiClient from "../utils/apiClient";

const REVIEWS_PER_PAGE = 5;

/**
 * Simulate network delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- MOCK DATA HELPERS ---

// This data is moved here from the service functions to be reusable
const mockRawReviewsStore = {
  /* locationId: [reviews] */
};
const mockAnalyzedReviewsStore = {
  /* locationId: [reviews] */
};
const mockSentimentStore = {
  /* locationId: sentimentObject */
};

const getMockRawReviews = (locationId) => {
  if (mockRawReviewsStore[locationId]) {
    return mockRawReviewsStore[locationId];
  }
  const raw = [
    {
      reviewId: `rev_${locationId}_1`,
      author: "John Doe (Raw)",
      rating: 5,
      text: "Amazing place! The service was exceptional and the atmosphere was wonderful. Highly recommended!",
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reviewId: `rev_${locationId}_2`,
      author: "Jane Smith (Raw)",
      rating: 4,
      text: "Good experience overall. The place was clean and staff were friendly. Would come back again.",
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },

    {
      reviewId: `rev_${locationId}_4`,
      author: "Negative Nancy (Raw)",
      rating: 1,
      text: "Terrible service. Waited 45 minutes for water. The food was cold.",
      time: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Add more reviews for pagination
    {
      reviewId: `rev_${locationId}_5`,
      author: "Positive Penny",
      rating: 5,
      text: "Absolutely loved it! Best coffee in town.",
      time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reviewId: `rev_${locationId}_6`,
      author: "Sam (Raw)",
      rating: 4,
      text: "The staff was very friendly. Good place for work.",
      time: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      reviewId: `rev_${locationId}_7`,
      author: "Another User",
      rating: 2,
      text: "Not great. The music was too loud and my order was wrong.",
      time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  mockRawReviewsStore[locationId] = raw;
  return raw;
};

const getMockAnalyzedReviews = (locationId) => {
  if (mockAnalyzedReviewsStore[locationId]) {
    return mockAnalyzedReviewsStore[locationId];
  }
  const analyzed = [
    {
      reviewId: `rev_${locationId}_1`,
      author: "John Doe (Raw)",
      rating: 5,
      text: "Amazing place! The service was exceptional and the atmosphere was wonderful. Highly recommended!",
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Positive",
      sentimentScore: 0.95,
    },
    {
      reviewId: `rev_${locationId}_2`,
      author: "Jane Smith (Raw)",
      rating: 4,
      text: "Good experience overall. The place was clean and staff were friendly. Would come back again.",
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Positive",
      sentimentScore: 0.78,
    },
    {
      reviewId: `rev_${locationId}_4`,
      author: "Negative Nancy (Raw)",
      rating: 1,
      text: "Terrible service. Waited 45 minutes for water. The food was cold.",
      time: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Negative",
      sentimentScore: -0.85,
    },
    {
      reviewId: `rev_${locationId}_5`,
      author: "Positive Penny",
      rating: 5,
      text: "Absolutely loved it! Best coffee in town.",
      time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Positive",
      sentimentScore: 0.9,
    },
    {
      reviewId: `rev_${locationId}_6`,
      author: "Sam (Raw)",
      rating: 4,
      text: "The staff was very friendly. Good place for work.",
      time: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Positive",
      sentimentScore: 0.8,
    },
    {
      reviewId: `rev_${locationId}_7`,
      author: "Another User",
      rating: 2,
      text: "Not great. The music was too loud and my order was wrong.",
      time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Negative",
      sentimentScore: -0.7,
    },
  ];
  mockAnalyzedReviewsStore[locationId] = analyzed;

  // Calculate and store sentiment
  const positive = analyzed.filter((r) => r.sentiment === "Positive").length;
  const neutral = analyzed.filter((r) => r.sentiment === "Neutral").length;
  const negative = analyzed.filter((r) => r.sentiment === "Negative").length;
  const total = analyzed.length;
  const avgRating = analyzed.reduce((sum, r) => sum + r.rating, 0) / total;

  mockSentimentStore[locationId] = {
    positive: positive,
    neutral: neutral,
    negative: negative,
    positivePercentage: (positive / total) * 100,
    negativePercentage: (negative / total) * 100,
    averageRating: avgRating,
    totalReviews: total,
  };

  return analyzed;
};

// --- SIMULATED BACKEND FILTERING ---
const getPaginatedAndFilteredReviews = (allReviews, options = {}) => {
  const {
    page = 1,
    limit = REVIEWS_PER_PAGE,
    searchTerm = "",
    sentiment = "all",
    rating = 0,
  } = options;

  // 1. Filter
  const filteredReviews = allReviews.filter((review) => {
    // Sentiment Filter
    if (
      sentiment !== "all" &&
      review.sentiment?.toLowerCase() !== sentiment.toLowerCase()
    ) {
      return false;
    }
    // Rating Filter
    if (rating !== 0 && review.rating !== rating) {
      return false;
    }
    // Search Term Filter
    if (
      searchTerm.trim() !== "" &&
      !review.text?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !review.author?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // 2. Paginate
  const totalReviews = filteredReviews.length;
  const totalPages = Math.ceil(totalReviews / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  return {
    reviews: paginatedReviews,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalReviews: totalReviews,
      limit: limit,
    },
  };
};

/**
 * Fetch all business locations (markers for analysis)
 */
export const fetchBusinessLocations = async () => {
  try {
    console.log("🔄 Loading business locations...");
    await delay(800);
    console.log("✅ Business locations loaded!");
    const { mockBusinessLocations } = await import(
      "../mocks/businessLocationsMock.js"
    );
    return {
      businesses: mockBusinessLocations,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalBusinesses: mockBusinessLocations.length,
        businessesPerPage: 50,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching business locations:", error);
    throw error;
  }
};

/**
 * Register a new business location
 */
export const registerBusinessLocation = async (businessData) => {
  try {
    console.log("🔄 Registering business location...");
    await delay(1000);
    console.log("✅ Business location registered!");
    const newBusiness = {
      id: Date.now().toString(),
      businessName: businessData.businessName,
      placeId: businessData.placeId,
      address: businessData.address,
      coordinates: businessData.coordinates,
      phoneNumber: businessData.phoneNumber || "+62123456789",
      category: businessData.category || "establishment",
      status: "active",
      reviewsCount: 0,
      averageRating: businessData.rating || 0,
      sentiment: null,
      reviews: [], // Start with no reviews
      pagination: { currentPage: 0, totalPages: 0, totalReviews: 0 }, // Add pagination stub
      cacheStatus: {
        isCached: false,
        lastScrapedAt: null,
        cacheExpiresAt: null,
        hoursUntilExpiry: 0,
        needsRefresh: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { business: newBusiness };
  } catch (error) {
    console.error("❌ Error registering business location:", error);
    throw error;
  }
};

/**
 * Load RAW reviews for a business location (scrape from Google)
 */
export const loadBusinessReviews = async (locationId, options = {}) => {
  try {
    console.log(
      "🔄 Loading RAW reviews for location:",
      locationId,
      "Options:",
      options,
    );
    await delay(1000); // Shorter delay for filter changes
    console.log("✅ (Mock) RAW Reviews loaded!");

    const allRawReviews = getMockRawReviews(locationId);
    const { reviews, pagination } = getPaginatedAndFilteredReviews(
      allRawReviews,
      options,
    );

    return {
      business: {
        id: locationId,
        reviews: reviews, // Paginated reviews
        pagination: pagination, // Pagination info
        reviewsCount: allRawReviews.length, // Total count before filtering
        averageRating:
          allRawReviews.reduce((sum, r) => sum + r.rating, 0) /
          allRawReviews.length,
        sentiment: null, // Still no sentiment
      },
    };
  } catch (error) {
    console.error("❌ Error loading reviews:", error);
    throw error;
  }
};

/**
 * Analyze sentiment for a location's reviews
 */
export const analyzeLocationSentiment = async (locationId, options = {}) => {
  try {
    console.log(
      "🔄 Analyzing/Fetching sentiment for location:",
      locationId,
      "Options:",
      options,
    );
    await delay(1000); // Shorter delay for filter changes
    console.log("✅ (Mock) Sentiment analyzed/fetched!");

    const allAnalyzedReviews = getMockAnalyzedReviews(locationId);
    const { reviews, pagination } = getPaginatedAndFilteredReviews(
      allAnalyzedReviews,
      options,
    );
    const sentimentBlock = mockSentimentStore[locationId] || null;

    return {
      business: {
        id: locationId,
        reviews: reviews, // Paginated analyzed reviews
        pagination: pagination, // Pagination info
        sentiment: sentimentBlock,
        averageRating: sentimentBlock?.averageRating,
        reviewsCount: sentimentBlock?.totalReviews,
        cacheStatus: {
          isCached: true,
          lastScrapedAt: new Date().toISOString(),
          cacheExpiresAt: new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ).toISOString(),
          hoursUntilExpiry: 24,
          needsRefresh: false,
        },
      },
    };
  } catch (error) {
    console.error("❌ Error analyzing sentiment:", error);
    throw error;
  }
};
