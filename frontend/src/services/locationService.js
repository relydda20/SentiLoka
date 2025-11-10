/**
 * Location Service
 * Handles location CRUD operations
 */
import apiClient from "../utils/apiClient";

/**
 * Fetch all business locations (markers for analysis)
 * GET /api/locations
 */
export const fetchBusinessLocations = async () => {
  try {
    console.log("🔄 Loading business locations from API...");

    const response = await apiClient.get("/locations");
    const locationsFromApi = response.data.data || [];

    // Map backend data to the format the frontend expects
    const mappedBusinesses = locationsFromApi.map((loc) => {
      // Map sentiment from database (pre-calculated)
      let sentimentData = null;
      if (loc.overallSentiment && loc.overallSentiment.totalReviews > 0) {
        const totalReviews = loc.overallSentiment.totalReviews;
        const positivePercentage = loc.overallSentiment.positive || 0;
        const neutralPercentage = loc.overallSentiment.neutral || 0;
        const negativePercentage = loc.overallSentiment.negative || 0;

        sentimentData = {
          // Counts for display
          positive: Math.round((positivePercentage / 100) * totalReviews),
          neutral: Math.round((neutralPercentage / 100) * totalReviews),
          negative: Math.round((negativePercentage / 100) * totalReviews),
          // Percentages for marker colors
          positivePercentage: positivePercentage,
          negativePercentage: negativePercentage,
          // Additional metrics
          averageRating: loc.overallSentiment.averageRating || 0,
          totalReviews: totalReviews,
          lastCalculated: loc.overallSentiment.lastCalculated,
        };
      }

      return {
        id: loc._id,
        businessName: loc.name,
        placeId: loc.placeId,
        address: loc.address,
        coordinates: loc.coordinates,
        phoneNumber: loc.phoneNumber,
        category: loc.googleData?.types?.[0] || "establishment",
        status: loc.status,
        scrapeStatus: loc.scrapeStatus || 'idle',
        scrapeProgress: loc.scrapeProgress || {
          percentage: 0,
          current: 0,
          total: 0,
          estimatedTimeRemaining: null,
          startedAt: null,
          message: null
        },
        reviewsCount: loc.scrapedReviewCount || 0,
        analyzedReviewCount: loc.analyzedReviewCount || 0,
        averageRating: loc.googleData?.rating || 0,
        sentiment: sentimentData,
        reviews: [],
        pagination: { currentPage: 0, totalPages: 0, totalReviews: 0 },
        lastScraped: loc.scrapeConfig?.lastScraped,
        lastAnalyzedAt: loc.lastAnalyzedAt,
        cacheStatus: {
          isCached: false,
          lastScrapedAt: loc.scrapeConfig?.lastScraped,
          cacheExpiresAt: null,
          hoursUntilExpiry: 0,
          needsRefresh: loc.scrapeStatus !== "completed",
        },
        createdAt: loc.createdAt,
        updatedAt: loc.updatedAt,
      };
    });

    const locationsWithSentiment = mappedBusinesses.filter(
      (b) => b.sentiment,
    ).length;
    console.log(
      `✅ ${mappedBusinesses.length} Business locations loaded from API! (${locationsWithSentiment} with sentiment data)`,
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
    throw error;
  }
};

/**
 * Register a new business location
 * POST /api/locations
 */
export const registerBusinessLocation = async (businessData) => {
  try {
    console.log("🔄 Registering business location via API...");

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

    const newBusiness = response.data.data;
    console.log("✅ Business location registered!", newBusiness);

    // IMPORTANT: Fetch complete location data with review counts
    // The POST response doesn't include scrapedReviewCount and analyzedReviewCount
    // So we need to fetch the complete data from GET /locations/:id
    console.log("🔄 Fetching complete location data with review counts...");
    const completeLocationData = await getLocationScrapeStatus(newBusiness._id);
    console.log("✅ Complete location data loaded!", completeLocationData);

    // Map sentiment from database (pre-calculated) - same logic as fetchBusinessLocations
    // Use completeLocationData which has the full overallSentiment data
    let sentimentData = null;
    if (completeLocationData.overallSentiment && completeLocationData.overallSentiment.totalReviews > 0) {
      const totalReviews = completeLocationData.overallSentiment.totalReviews;
      const positivePercentage = completeLocationData.overallSentiment.positive || 0;
      const neutralPercentage = completeLocationData.overallSentiment.neutral || 0;
      const negativePercentage = completeLocationData.overallSentiment.negative || 0;

      sentimentData = {
        // Counts for display
        positive: Math.round((positivePercentage / 100) * totalReviews),
        neutral: Math.round((neutralPercentage / 100) * totalReviews),
        negative: Math.round((negativePercentage / 100) * totalReviews),
        // Percentages for marker colors
        positivePercentage: positivePercentage,
        negativePercentage: negativePercentage,
        // Additional metrics
        averageRating: completeLocationData.overallSentiment.averageRating || 0,
        totalReviews: totalReviews,
        lastCalculated: completeLocationData.overallSentiment.lastCalculated,
      };
    }

    return {
      business: {
        id: completeLocationData._id,
        businessName: completeLocationData.name,
        placeId: completeLocationData.placeId,
        address: completeLocationData.address,
        coordinates: completeLocationData.coordinates,
        phoneNumber: completeLocationData.phoneNumber,
        category: completeLocationData.googleData?.types?.[0] || "establishment",
        status: completeLocationData.status,
        scrapeStatus: completeLocationData.scrapeStatus || 'idle',
        scrapeProgress: completeLocationData.scrapeProgress || {
          percentage: 0,
          current: 0,
          total: 0,
          estimatedTimeRemaining: null,
          startedAt: null,
          message: null
        },
        reviewsCount: completeLocationData.scrapedReviewCount || 0, // Now uses actual count from GET endpoint
        analyzedReviewCount: completeLocationData.analyzedReviewCount || 0, // Now uses actual count from GET endpoint
        averageRating: completeLocationData.googleData?.rating || 0,
        sentiment: sentimentData, // Include sentiment data if available
        reviews: [],
        pagination: { currentPage: 0, totalPages: 0, totalReviews: 0 },
        lastScraped: completeLocationData.scrapeConfig?.lastScraped || null,
        lastAnalyzedAt: completeLocationData.lastAnalyzedAt || null,
        cacheStatus: {
          isCached: false,
          lastScrapedAt: completeLocationData.scrapeConfig?.lastScraped,
          cacheExpiresAt: null,
          hoursUntilExpiry: 0,
          needsRefresh: completeLocationData.scrapeStatus !== "completed",
        },
        createdAt: completeLocationData.createdAt,
        updatedAt: completeLocationData.updatedAt,
      },
    };
  } catch (error) {
    console.error("❌ Error registering business location:", error);
    throw error;
  }
};

/**
 * Get location details and scrape status
 * GET /api/locations/:locationId
 */
export const getLocationScrapeStatus = async (locationId) => {
  try {
    const response = await apiClient.get(`/locations/${locationId}`);

    if (!response.data || !response.data.success) {
      throw new Error("Failed to get location status");
    }

    return response.data.data;
  } catch (error) {
    console.error(`Error getting location status:`, error);
    throw error;
  }
};

/**
 * Delete a location
 * DELETE /api/locations/:locationId
 */
export const deleteLocation = async (locationId) => {
  try {
    console.log("🗑️ Deleting location:", locationId);

    const response = await apiClient.delete(`/locations/${locationId}`);

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to delete location");
    }

    console.log("✅ Location deleted successfully");

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    console.error(`❌ Error deleting location ${locationId}:`, error);
    throw error;
  }
};
