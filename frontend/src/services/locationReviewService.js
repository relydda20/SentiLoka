/* Fetched content from:
 * - relydda20/sentiloka/SentiLoka-feature-sentiment-map-design/frontend/src/services/locationReviewService.js
 */
import apiClient from "../utils/apiClient";

// NEW: Removed mock data imports like 'delay' and 'mockBusinessLocations'

const REVIEWS_PER_PAGE = 5;

// --- MOCK DATA HELPERS ---
// Kept for the functions that are not yet integrated
// (loadBusinessReviews, analyzeLocationSentiment)

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
// Kept for mock functions
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
 * NEW: Integrated with GET /api/locations
 */
export const fetchBusinessLocations = async () => {
  try {
    console.log("🔄 Loading business locations from API...");

    // Call the backend endpoint
    const response = await apiClient.get("/locations");

    // The backend controller returns { success, count, data: [...] }
    const locationsFromApi = response.data.data || [];

    // Map backend data to the format the frontend (SentimentMap.jsx) expects
    const mappedBusinesses = locationsFromApi.map((loc) => ({
      id: loc._id,
      businessName: loc.name,
      placeId: loc.placeId,
      address: loc.address,
      coordinates: loc.coordinates,
      phoneNumber: loc.phoneNumber, // Assuming phoneNumber is available, add if not
      category: loc.googleData?.types?.[0] || "establishment",
      status: loc.status,
      reviewsCount: loc.googleData?.userRatingsTotal || 0,
      averageRating: loc.googleData?.rating || 0,
      // Map overallSentiment from backend to frontend's sentiment object
      sentiment: loc.overallSentiment
        ? {
            positive: loc.overallSentiment.positive, // Note: backend stores as percentage
            neutral: loc.overallSentiment.neutral,
            negative: loc.overallSentiment.negative,
            positivePercentage: loc.overallSentiment.positive,
            negativePercentage: loc.overallSentiment.negative,
            averageRating: loc.overallSentiment.averageRating,
            totalReviews: loc.overallSentiment.totalReviews,
          }
        : null,
      reviews: [], // Start with no reviews, they will be fetched on click
      pagination: { currentPage: 0, totalPages: 0, totalReviews: 0 },
      cacheStatus: {
        // Mock cache status, or adapt if backend provides it
        isCached: loc.overallSentiment?.lastCalculated,
        lastScrapedAt: loc.scrapeConfig?.lastScraped,
        cacheExpiresAt: null,
        hoursUntilExpiry: 0,
        needsRefresh: loc.scrapeStatus !== "completed",
      },
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
    }));

    console.log(
      `✅ ${mappedBusinesses.length} Business locations loaded from API!`,
    );

    return {
      businesses: mappedBusinesses,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalBusinesses: mappedBusinesses.length,
        businessesPerPage: 50,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching business locations:", error);
    // Throw the error so react-query can handle it
    throw error;
  }
};

/**
 * Register a new business location
 * NEW: Integrated with POST /api/locations
 */
export const registerBusinessLocation = async (businessData) => {
  try {
    console.log("🔄 Registering business location via API...");

    // Call the backend endpoint
    // The backend controller `createLocation` expects:
    // { placeId, name, address, coordinates, googleMapsUrl, rating, userRatingsTotal, types }
    const response = await apiClient.post("/locations", {
      placeId: businessData.placeId,
      name: businessData.businessName,
      address: businessData.address,
      coordinates: businessData.coordinates,
      googleMapsUrl: businessData.googleMapsUrl,
      rating: businessData.rating,
      userRatingsTotal: businessData.totalReviews,
      types: businessData.businessTypes,
    });

    // Backend returns { success, message, data: location }
    const newBusiness = response.data.data;

    console.log("✅ Business location registered!", newBusiness);

    // Map the backend response to the format frontend expects { business: ... }
    return {
      business: {
        id: newBusiness._id,
        businessName: newBusiness.name,
        placeId: newBusiness.placeId,
        address: newBusiness.address,
        coordinates: newBusiness.coordinates,
        phoneNumber: newBusiness.phoneNumber,
        category: newBusiness.googleData?.types?.[0] || "establishment",
        status: newBusiness.status,
        reviewsCount: newBusiness.googleData?.userRatingsTotal || 0,
        averageRating: newBusiness.googleData?.rating || 0,
        sentiment: null, // New locations have no sentiment yet
        reviews: [],
        pagination: { currentPage: 0, totalPages: 0, totalReviews: 0 },
        cacheStatus: {
          isCached: false,
          lastScrapedAt: null,
          cacheExpiresAt: null,
          hoursUntilExpiry: 0,
          needsRefresh: true,
        },
        createdAt: newBusiness.createdAt,
        updatedAt: newBusiness.updatedAt,
      },
    };
  } catch (error) {
    console.error("❌ Error registering business location:", error);
    // Throw error so react-query/component can handle it
    throw error;
  }
};

/**
 * Load RAW reviews for a business location (scrape from Google)
 * * NOTE: This function is still using MOCK data.
 * The real backend flow is asynchronous (uses a job queue) and would require
 * changing the SentimentMap.jsx component to handle polling for job status.
 * * The real endpoints are:
 * 1. POST /api/scraper/start (to start scraping)
 * 2. POST /api/reviews/analyze-location/:locationId (to analyze)
 * 3. GET /api/reviews/location/:locationId (to fetch results)
 */
export const loadBusinessReviews = async (locationId, options = {}) => {
  try {
    console.log(
      "🔄 (MOCK) Loading RAW reviews for location:",
      locationId,
      "Options:",
      options,
    );
    // await delay(1000); // Shorter delay for filter changes
    console.log("✅ (MOCK) RAW Reviews loaded!");

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
 * * NOTE: This function is still using MOCK data.
 * See note in `loadBusinessReviews` above.
 */
export const analyzeLocationSentiment = async (locationId, options = {}) => {
  try {
    console.log(
      "🔄 (MOCK) Analyzing/Fetching sentiment for location:",
      locationId,
      "Options:",
      options,
    );
    // await delay(1000); // Shorter delay for filter changes
    console.log("✅ (MOCK) Sentiment analyzed/fetched!");

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
