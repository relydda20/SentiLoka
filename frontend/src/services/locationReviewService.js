/**
 * Location Review Service
 * Service layer for location and review management
 * Follows MVC architecture - This is the Model/Service layer for the frontend
 */
import apiClient from "../utils/apiClient";

const REVIEWS_PER_PAGE = 5;

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
      scrapeStatus: loc.scrapeStatus, // Add scrapeStatus from backend
      reviewsCount: loc.scrapedReviewCount || 0, // Use actual scraped reviews count from DB
      averageRating: loc.googleData?.rating || 0,
      // Don't include overallSentiment on initial load
      // Sentiment data will be loaded when user fetches/analyzes reviews
      sentiment: null,
      reviews: [], // Start with no reviews, they will be fetched on click
      pagination: { currentPage: 0, totalPages: 0, totalReviews: 0 },
      cacheStatus: {
        isCached: false, // Will be set when reviews are fetched
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
 * Check location scrape status
 * GET /api/locations/:locationId
 * 
 * @param {string} locationId - The location ID
 * @returns {object} Location data with scrape status
 */
const getLocationScrapeStatus = async (locationId) => {
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
 * Poll scraper job status until completion
 * 
 * @param {string} jobId - The scraping job ID
 * @param {function} onProgress - Callback for progress updates
 * @param {number} maxAttempts - Maximum polling attempts (default: 120 = 2 minutes)
 * @returns {object} Final job status
 */
const pollScrapeStatus = async (jobId, onProgress = null, maxAttempts = 120) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const status = await checkScrapeStatus(jobId);
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(status);
      }
      
      console.log(`📊 Scrape progress: ${status.state} (attempt ${attempts + 1}/${maxAttempts})`);
      
      // Check if job is complete
      if (status.state === "completed") {
        console.log("✅ Scraping completed successfully!");
        return status;
      }
      
      // Check if job failed
      if (status.state === "failed") {
        throw new Error(status.failedReason || "Scraping job failed");
      }
      
      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      
    } catch (error) {
      console.error("Error polling scrape status:", error);
      throw error;
    }
  }
  
  throw new Error("Scraping timeout: Maximum polling attempts reached");
};

/**
 * Fetch existing reviews from database WITHOUT triggering a scrape
 * Use this for: page refreshes, marker clicks, pagination, filtering
 * 
 * @param {string} locationId - The location ID
 * @param {object} options - Pagination and filter options
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

    // Get location info
    const location = await getLocationScrapeStatus(locationId);

    // FIRST: Get unfiltered count for hasReviews calculation
    let totalReviewsInDB = 0;
    try {
      const countParams = new URLSearchParams({
        page: '1',
        limit: '1',
        sortBy,
        sortOrder,
      });
      const countResponse = await apiClient.get(`/reviews/location/${locationId}?${countParams.toString()}`);
      if (countResponse.data?.success) {
        totalReviewsInDB = countResponse.data.data.pagination.totalItems;
        console.log(`📊 Total reviews in DB (unfiltered): ${totalReviewsInDB}`);
      }
    } catch (countError) {
      console.log("⚠️ Could not get total count");
    }
    
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
    let reviewSource = 'raw';

    // Try ANALYZED reviews first (ReviewSummary model) - prioritize analyzed data
    try {
      console.log("🔍 Attempting to load analyzed reviews from ReviewSummary model...");
      const analyzedParams = new URLSearchParams(params);
      if (sentiment !== 'all') {
        analyzedParams.append("sentiment", sentiment);
      }
      
      const analyzedResponse = await apiClient.get(
        `/review-sentiments/location/${locationId}?${analyzedParams.toString()}`
      );
      
      if (analyzedResponse.data?.success && analyzedResponse.data.data?.reviews?.length > 0) {
        reviews = analyzedResponse.data.data.reviews || [];
        pagination = analyzedResponse.data.data.pagination;
        reviewSource = 'analyzed';
        console.log(`✅ Fetched ${reviews.length} ANALYZED reviews (with sentiment)`);
      }
    } catch (analyzedError) {
      // If 404 or no analyzed reviews, try raw reviews as fallback
      if (analyzedError.response?.status === 404 || !reviews.length) {
        console.log("⚠️ No analyzed reviews found, trying raw reviews...");
        
        try {
          const rawResponse = await apiClient.get(
            `/reviews/location/${locationId}?${params.toString()}`
          );

          if (rawResponse.data?.success) {
            reviews = rawResponse.data.data.reviews || [];
            pagination = rawResponse.data.data.pagination;
            reviewSource = 'raw';
            console.log(`✅ Fetched ${reviews.length} RAW reviews (before sentiment analysis)`);
          }
        } catch (rawError) {
          // If 404 with filters, no matches found
          if (rawError.response?.status === 404 && (rating > 0 || searchTerm)) {
            console.log("⚠️ No raw reviews match the filters");
            reviews = [];
            pagination = {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              limit,
              hasNext: false,
              hasPrev: false,
            };
            reviewSource = 'raw';
          } else if (rawError.response?.status === 404) {
            console.log("⚠️ No raw reviews found either");
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
    }

    // Map reviews to frontend format
    const mappedReviews = reviews.map((review) => ({
      id: review._id,
      reviewId: review.reviewId,
      // Handle different field structures between Review and ReviewSummary models
      author: review.author?.name || review.author || "Anonymous", // Review has author.name, ReviewSummary has author string
      rating: review.rating,
      text: review.text || "", // Both models use 'text' field
      date: review.publishedAt,
      sentiment: review.sentiment || null,
      sentimentScore: review.sentimentScore || null,
      summary: review.summary || null,
      sentimentKeywords: review.sentimentKeywords || [],
      contextualTopics: review.contextualTopics || [],
      isAnalyzed: reviewSource === 'analyzed',
    }));

    // Calculate OVERALL sentiment summary from ALL analyzed reviews (not just current page)
    let sentimentSummary = null;
    if (reviewSource === 'analyzed') {
      try {
        console.log('📊 Fetching overall sentiment statistics for all reviews...');
        // Fetch sentiment counts for ALL reviews (no pagination)
        const allSentimentsResponse = await apiClient.get(
          `/review-sentiments/location/${locationId}?page=1&limit=999999` // Large limit to get all
        );
        
        if (allSentimentsResponse.data?.success) {
          const allReviews = allSentimentsResponse.data.data.reviews || [];
          const totalAnalyzed = allReviews.length;
          
          if (totalAnalyzed > 0) {
            const positiveCount = allReviews.filter(r => r.sentiment === 'positive').length;
            const negativeCount = allReviews.filter(r => r.sentiment === 'negative').length;
            const neutralCount = allReviews.filter(r => r.sentiment === 'neutral').length;
            const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalAnalyzed;

            sentimentSummary = {
              positive: positiveCount,
              neutral: neutralCount,
              negative: negativeCount,
              positivePercentage: (positiveCount / totalAnalyzed) * 100,
              negativePercentage: (negativeCount / totalAnalyzed) * 100,
              averageRating: avgRating,
              totalReviews: totalAnalyzed,
            };
            console.log('📊 Calculated overall sentiment summary from', totalAnalyzed, 'reviews:', sentimentSummary);
          }
        }
      } catch (sentimentError) {
        console.warn('⚠️ Could not fetch overall sentiment statistics:', sentimentError.message);
        // Fall back to page-only calculation if overall fetch fails
        const totalAnalyzed = mappedReviews.length;
        if (totalAnalyzed > 0) {
          const positiveCount = mappedReviews.filter(r => r.sentiment === 'positive').length;
          const negativeCount = mappedReviews.filter(r => r.sentiment === 'negative').length;
          const neutralCount = mappedReviews.filter(r => r.sentiment === 'neutral').length;
          const avgRating = mappedReviews.reduce((sum, r) => sum + r.rating, 0) / totalAnalyzed;

          sentimentSummary = {
            positive: positiveCount,
            neutral: neutralCount,
            negative: negativeCount,
            positivePercentage: (positiveCount / totalAnalyzed) * 100,
            negativePercentage: (negativeCount / totalAnalyzed) * 100,
            averageRating: avgRating,
            totalReviews: totalAnalyzed,
          };
          console.log('📊 Using page-only sentiment (fallback):', sentimentSummary);
        }
      }
    }

    return {
      business: {
        id: locationId,
        reviews: mappedReviews,
        reviewsCount: totalReviewsInDB || pagination.totalItems,
        reviewSource,
        sentiment: sentimentSummary, // Add sentiment summary
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalReviews: pagination.totalItems,
          limit: pagination.limit,
          hasNextPage: pagination.hasNext,
          hasPrevPage: pagination.hasPrev,
        },
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
 * Load reviews for a specific business location
 * This function handles the complete workflow:
 * 1. Check if location needs scraping
 * 2. If needed, trigger scraper (uses stored googleMapsUrl)
 * 3. Poll until scraping completes
 * 4. Load and return reviews from database
 * 
 * @param {string} locationId - The location ID
 * @param {object} options - Pagination and filter options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Reviews per page (default: 5)
 * @param {string} options.sentiment - Filter by sentiment ('positive', 'negative', 'neutral', 'all')
 * @param {string} options.sortBy - Sort field ('date', 'rating')
 * @param {string} options.sortOrder - Sort order ('asc', 'desc')
 * @param {function} options.onScrapeProgress - Callback for scraping progress updates
 * @param {boolean} options.forceScrape - Force re-scrape even if already scraped
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

    // STEP 1: Check location scrape status
    console.log("📍 Step 1: Checking location scrape status...");
    const location = await getLocationScrapeStatus(locationId);
    
    console.log("📊 Location details:", {
      id: location._id,
      name: location.name,
      scrapeStatus: location.scrapeStatus,
      hasGoogleMapsUrl: !!location.googleMapsUrl,
      googleMapsUrl: location.googleMapsUrl ? location.googleMapsUrl.substring(0, 50) + "..." : "NOT SET",
      lastScraped: location.scrapeConfig?.lastScraped,
    });
    
    const needsScraping = forceScrape || 
                          location.scrapeStatus === "idle" || 
                          location.scrapeStatus === "failed" ||
                          !location.scrapeConfig?.lastScraped;
    
    // STEP 2: If needs scraping, trigger scraper
    if (needsScraping) {
      console.log("🚀 Step 2: Location needs scraping, triggering scraper...");
      
      // Check if Google Maps URL is set
      if (!location.googleMapsUrl || location.googleMapsUrl.trim() === "") {
        const errorMsg = `❌ Cannot scrape location "${location.name}": Google Maps URL is not set. Please update this location with a valid Google Maps URL before loading reviews.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Trigger scrape (backend will use stored googleMapsUrl)
      const scrapeResult = await triggerLocationScrape(locationId);
      console.log(`✅ Scrape job started: ${scrapeResult.jobId}`);
      
      // STEP 3: Poll until scraping completes
      console.log("⏳ Step 3: Waiting for scraping to complete...");
      await pollScrapeStatus(scrapeResult.jobId, onScrapeProgress);
      console.log("✅ Scraping completed!");
    } else {
      console.log("✅ Location already scraped, loading reviews...");
    }

    // STEP 4: Load reviews from database
    console.log("📚 Step 4: Loading reviews from database...");
    
    // FIRST: Get unfiltered count for hasReviews calculation (page 1, no filters)
    let totalReviewsInDB = 0;
    try {
      const countParams = new URLSearchParams({
        page: '1',
        limit: '1', // Just need count, not actual reviews
        sortBy,
        sortOrder,
      });
      const countResponse = await apiClient.get(`/reviews/location/${locationId}?${countParams.toString()}`);
      if (countResponse.data?.success) {
        totalReviewsInDB = countResponse.data.data.pagination.totalItems;
        console.log(`📊 Total reviews in DB (unfiltered): ${totalReviewsInDB}`);
      }
    } catch (countError) {
      console.log("⚠️ Could not get total count, will use filtered count");
    }
    
    // Build query params with filters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    // Add rating filter if specified
    if (rating > 0) {
      params.append("rating", rating.toString());
      console.log(`✅ Added rating filter: ${rating}`);
    }

    // Add search term if specified
    if (searchTerm && searchTerm.trim() !== "") {
      params.append("search", searchTerm.trim());
      console.log(`✅ Added search filter: "${searchTerm.trim()}"`);
    }

    console.log("📋 Final query params:", params.toString());

    let reviews = [];
    let pagination = null;
    let reviewSource = 'raw'; // Track whether reviews are raw or analyzed

    // Try to get RAW reviews first (from Review model - before sentiment analysis)
    try {
      console.log("🔍 Attempting to load raw reviews from Review model...");
      const rawResponse = await apiClient.get(
        `/reviews/location/${locationId}?${params.toString()}`
      );

      if (rawResponse.data?.success && rawResponse.data.data?.reviews?.length > 0) {
        reviews = rawResponse.data.data.reviews;
        pagination = rawResponse.data.data.pagination;
        reviewSource = 'raw';
        console.log(`✅ Loaded ${reviews.length} RAW reviews (before sentiment analysis)`);
      }
    } catch (rawError) {
      // If 404 with filters applied, it means no results match - return empty, don't try analyzed
      if (rawError.response?.status === 404 && (rating > 0 || searchTerm)) {
        console.log("⚠️ No raw reviews match the filters");
        reviews = [];
        pagination = {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          limit,
          hasNext: false,
          hasPrev: false,
        };
        reviewSource = 'raw';
      } else {
        console.log("⚠️ No raw reviews found, trying analyzed reviews...");
        
        // If raw reviews don't exist, try to get ANALYZED reviews (from ReviewSummary model)
        // This happens when sentiment analysis has already been run
        try {
          // Add sentiment filter if not 'all' (only for analyzed reviews)
          if (sentiment !== "all") {
            params.append("sentiment", sentiment);
          }

          const analyzedResponse = await apiClient.get(
            `/review-sentiments/location/${locationId}?${params.toString()}`
          );

          if (analyzedResponse.data?.success && analyzedResponse.data.data?.reviews?.length > 0) {
            reviews = analyzedResponse.data.data.reviews;
            pagination = analyzedResponse.data.data.pagination;
            reviewSource = 'analyzed';
            console.log(`✅ Loaded ${reviews.length} ANALYZED reviews (with sentiment)`);
          }
        } catch (analyzedError) {
          // If 404 with filters, return empty results
          if (analyzedError.response?.status === 404 && (rating > 0 || searchTerm || sentiment !== 'all')) {
            console.log("⚠️ No analyzed reviews match the filters");
            reviews = [];
            pagination = {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              limit,
              hasNext: false,
              hasPrev: false,
            };
            reviewSource = 'analyzed';
          } else {
            console.error("❌ Failed to load both raw and analyzed reviews:", analyzedError);
            throw new Error("No reviews found. Please scrape reviews first.");
          }
        }
      }
    }

    // Allow empty results if filters are applied (user filtered everything out)
    if (!reviews || (reviews.length === 0 && !rating && !searchTerm && sentiment === 'all')) {
      throw new Error("No reviews found for this location");
    }

    console.log(`✅ Loaded ${reviews.length} ${reviewSource} reviews (page ${pagination.currentPage}/${pagination.totalPages})`);

    // Use the totalReviewsInDB we got earlier, or fall back to filtered count if we couldn't get it
    if (totalReviewsInDB === 0 && pagination.totalItems > 0) {
      totalReviewsInDB = pagination.totalItems;
    }

    // Map backend review format to frontend format
    const mappedReviews = reviews.map((review) => ({
      id: review._id,
      reviewId: review.reviewId,
      author: review.authorName || "Anonymous",
      rating: review.rating,
      text: review.reviewText,
      date: review.publishedAt,
      sentiment: review.sentiment || null,
      sentimentScore: review.sentimentScore || null,
      summary: review.summary || null,
      sentimentKeywords: review.sentimentKeywords || [],
      contextualTopics: review.contextualTopics || [],
      isAnalyzed: reviewSource === 'analyzed', // Flag to show if sentiment analysis is available
    }));

    return {
      business: {
        id: locationId,
        reviews: mappedReviews,
        reviewsCount: totalReviewsInDB, // Use TOTAL from DB, not filtered count
        reviewSource, // 'raw' or 'analyzed'
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
    
    // Return empty state on error with error message
    return {
      business: {
        id: locationId,
        reviews: [],
        reviewsCount: 0, // Add this for consistency
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
 * Trigger sentiment analysis for a specific location
 * POST /api/reviews/analyze-location/:locationId
 * 
 * @param {string} locationId - The location ID
 * @returns {Promise} Analysis job response
 */
export const analyzeLocationSentiment = async (locationId) => {
  try {
    console.log("🔄 Starting sentiment analysis for location:", locationId);

    // Trigger the analysis job (POST endpoint)
    const response = await apiClient.post(
      `/review-sentiments/analyze-location/${locationId}`
    );

    if (!response.data || !response.data.success) {
      throw new Error("Failed to start sentiment analysis");
    }

    const data = response.data.data;

    console.log(`✅ Sentiment analysis completed: ${data.analysis.newlyAnalyzed} reviews newly analyzed, ${data.analysis.alreadyAnalyzed} already analyzed`);

    // Return the analysis results with sentiment data
    return {
      business: {
        id: locationId,
        name: data.location.name,
        sentiment: {
          positive: data.sentiment?.positive || 0,
          neutral: data.sentiment?.neutral || 0,
          negative: data.sentiment?.negative || 0,
          positivePercentage: data.sentiment?.positive || 0, // Backend stores as percentage
          negativePercentage: data.sentiment?.negative || 0,
          averageRating: data.sentiment?.averageRating || 0,
          totalReviews: data.sentiment?.totalReviews || 0,
        },
        averageRating: data.sentiment?.averageRating || 0,
        reviewsCount: data.sentiment?.totalReviews || data.analysis.totalReviews || 0,
        analysis: {
          totalReviews: data.analysis.totalReviews,
          alreadyAnalyzed: data.analysis.alreadyAnalyzed,
          newlyAnalyzed: data.analysis.newlyAnalyzed,
          failedAnalysis: data.analysis.failedAnalysis || 0,
        },
        lastScrapedAt: data.sentiment?.lastCalculated || new Date().toISOString(),
        needsRefresh: false,
      },
    };
  } catch (error) {
    console.error(`❌ Error analyzing sentiment for location ${locationId}:`, error);
    
    // Return empty analysis on error
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
 * Trigger a scraping job for a location
 * POST /api/scraper/start
 * 
 * @param {string} locationId - The location ID to scrape
 */
export const triggerLocationScrape = async (locationId) => {
  try {
    console.log("🔄 Starting scrape for location:", locationId);

    const response = await apiClient.post("/scraper/start", {
      locationId,
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to start scraping");
    }

    console.log(`✅ Scrape job started: ${response.data.data.jobId}`);

    return {
      success: true,
      jobId: response.data.data.jobId,
      message: response.data.message,
    };
  } catch (error) {
    console.error(`❌ Error triggering scrape for location ${locationId}:`, error);
    
    // Extract backend error message if available
    const backendMessage = error.response?.data?.message || error.message;
    const enhancedError = new Error(backendMessage);
    enhancedError.originalError = error;
    enhancedError.statusCode = error.response?.status;
    
    throw enhancedError;
  }
};

/**
 * Check scraping job status
 * GET /api/scraper/status/:jobId
 * 
 * @param {string} jobId - The job ID
 */
export const checkScrapeStatus = async (jobId) => {
  try {
    const response = await apiClient.get(`/scraper/status/${jobId}`);

    if (!response.data || !response.data.success) {
      throw new Error("Failed to check scrape status");
    }

    return response.data.data;
  } catch (error) {
    console.error(`❌ Error checking scrape status for job ${jobId}:`, error);
    throw error;
  }
};

/**
 * Delete a location
 * DELETE /api/locations/:locationId
 * 
 * @param {string} locationId - The location ID to delete
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

/**
 * Helper function to format date
 * @param {string|Date} date 
 */
export const formatReviewDate = (date) => {
  if (!date) return "Unknown date";
  
  const reviewDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - reviewDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
