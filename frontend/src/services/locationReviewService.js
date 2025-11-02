import apiClient from "../utils/apiClient";

/**
 * Simulate network delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all business locations
 */
export const fetchBusinessLocations = async () => {
  try {
    console.log("🔄 Loading business locations...");
    await delay(800);

    // const response = await apiClient.get('/api/businesses');
    // return response.data.data;

    console.log("✅ Business locations loaded!");

    // Mock data will be imported from separate file
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

    // const response = await apiClient.post('/api/businesses/register', businessData);
    // return response.data.data;

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
      averageRating: 0,
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0,
        positivePercentage: 0,
        negativePercentage: 0,
      },
      reviews: [],
      cacheStatus: {
        isCached: false,
        lastScrapedAt: new Date().toISOString(),
        cacheExpiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        hoursUntilExpiry: 24,
        needsRefresh: false,
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
 * Load reviews for a business location (scrape from Google)
 */
export const loadBusinessReviews = async (locationId) => {
  try {
    console.log("🔄 Loading reviews for location:", locationId);
    await delay(2000);

    // const response = await apiClient.post(`/api/businesses/${locationId}/scrape-reviews`);
    // return response.data.data;

    console.log("✅ Reviews loaded and analyzed!");

    // Generate mock reviews
    const mockReviews = generateMockReviews(locationId);

    return { business: mockReviews };
  } catch (error) {
    console.error("❌ Error loading reviews:", error);
    throw error;
  }
};

/**
 * Generate AI reply for a review
 */
export const generateReviewReply = async (locationId, reviewId, reviewData) => {
  try {
    console.log("🔄 Generating AI reply for review:", reviewId);
    await delay(1500);

    // const response = await apiClient.post(`/api/businesses/${locationId}/reviews/${reviewId}/generate-reply`, {
    //   review: reviewData
    // });
    // return response.data.data;

    console.log("✅ AI reply generated!");

    const mockReply = {
      reply: `Thank you so much for your ${reviewData.sentiment.toLowerCase()} review! We truly appreciate your feedback and are glad you chose us. We hope to see you again soon!`,
      generatedAt: new Date().toISOString(),
    };

    return mockReply;
  } catch (error) {
    console.error("❌ Error generating reply:", error);
    throw error;
  }
};

/**
 * Refresh cache for a business location
 */
export const refreshBusinessCache = async (locationId) => {
  try {
    console.log("🔄 Refreshing cache for location:", locationId);
    await delay(1000);

    // const response = await apiClient.post(`/api/businesses/${locationId}/refresh`);
    // return response.data.data;

    console.log("✅ Cache refreshed!");

    return {
      cacheStatus: {
        isCached: true,
        lastScrapedAt: new Date().toISOString(),
        cacheExpiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        hoursUntilExpiry: 24,
        needsRefresh: false,
      },
    };
  } catch (error) {
    console.error("❌ Error refreshing cache:", error);
    throw error;
  }
};

/**
 * Generate mock reviews for testing
 */
const generateMockReviews = (locationId) => {
  const mockReviews = [
    {
      reviewId: `rev_${locationId}_1`,
      author: "John Doe",
      rating: 5,
      text: "Amazing place! The service was exceptional and the atmosphere was wonderful. Highly recommended!",
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Positive",
      sentimentScore: 0.95,
    },
    {
      reviewId: `rev_${locationId}_2`,
      author: "Jane Smith",
      rating: 4,
      text: "Good experience overall. The place was clean and staff were friendly. Would come back again.",
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Positive",
      sentimentScore: 0.78,
    },
    {
      reviewId: `rev_${locationId}_3`,
      author: "Mike Johnson",
      rating: 3,
      text: "It was okay. Nothing special but not bad either. Average experience.",
      time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "Neutral",
      sentimentScore: 0.5,
    },
  ];

  return {
    id: locationId,
    reviews: mockReviews,
    reviewsCount: mockReviews.length,
    averageRating: 4.0,
    sentiment: {
      positive: 2,
      neutral: 1,
      negative: 0,
      positivePercentage: 66.7,
      negativePercentage: 0,
    },
    cacheStatus: {
      isCached: true,
      lastScrapedAt: new Date().toISOString(),
      cacheExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hoursUntilExpiry: 24,
      needsRefresh: false,
    },
  };
};
