import Location from '../models/Location.model.js';
import UserLocation from '../models/UserLocation.model.js';
import Review from '../models/Review.model.js';
import ReviewSummary from '../models/ReviewSummary.model.js';

/**
 * Location Readiness Service
 * 
 * Checks if locations are ready for chatbot analysis by validating:
 * 1. Location exists and belongs to user
 * 2. Has scraped reviews
 * 3. Has analyzed reviews (ReviewSummary entries)
 * 
 * Used to prevent chatbot from attempting to analyze empty/unanalyzed locations
 */

/**
 * Check readiness status of a single location
 * 
 * @param {string} locationId - MongoDB ObjectId of location
 * @param {string} userId - MongoDB ObjectId of user
 * @returns {Promise<Object>} Readiness status object
 */
export async function checkLocationReadiness(locationId, userId) {
  try {
    // Step 1: Verify location exists
    const location = await Location.findOne({
      _id: locationId,
      status: { $ne: 'deleted' }, // Exclude deleted locations
    }).lean();

    if (!location) {
      return {
        locationId,
        status: 'not_found',
        ready: false,
        error: true,
        message: 'Location not found',
      };
    }

    // Step 2: Verify user has access to this location through UserLocation junction table
    const userLocation = await UserLocation.findOne({
      userId,
      locationId,
      status: 'active',
    }).lean();

    if (!userLocation) {
      return {
        locationId,
        status: 'no_access',
        ready: false,
        error: true,
        message: 'You do not have access to this location',
      };
    }

    // Step 3: Count total scraped reviews (reviews are shared, no userId filter)
    const totalReviews = await Review.countDocuments({
      locationId,
    });

    // Step 4: Count analyzed reviews (summaries are shared, no userId filter)
    const analyzedReviews = await ReviewSummary.countDocuments({
      locationId,
      sentiment: { $ne: 'error' }, // Exclude failed analyses
    });

    // Step 5: Determine readiness status
    let status, ready, message, action;

    if (totalReviews === 0) {
      status = 'no_reviews';
      ready = false;
      message = 'No reviews scraped yet. Please scrape reviews first.';
      action = 'scrape_reviews';
    } else if (analyzedReviews === 0) {
      status = 'not_analyzed';
      ready = false;
      message = `${totalReviews} reviews scraped but not analyzed yet. Click "Analyze Reviews" to proceed.`;
      action = 'analyze_reviews';
    } else if (analyzedReviews < totalReviews) {
      status = 'partially_analyzed';
      ready = true; // Can use it, but warn about incomplete data
      message = `${analyzedReviews} of ${totalReviews} reviews analyzed. Some reviews need analysis.`;
      action = 'analyze_remaining';
    } else {
      status = 'ready';
      ready = true;
      message = `Ready! ${analyzedReviews} reviews analyzed and available.`;
      action = null;
    }

    return {
      locationId,
      locationName: location.name,
      placeId: location.placeId,
      status,
      ready,
      error: false,
      message,
      action,
      stats: {
        totalReviews,
        analyzedReviews,
        pendingAnalysis: totalReviews - analyzedReviews,
        analysisCompletionRate: totalReviews > 0 
          ? parseFloat(((analyzedReviews / totalReviews) * 100).toFixed(1))
          : 0,
      },
    };
  } catch (error) {
    console.error(`Error checking location readiness for ${locationId}:`, error);
    return {
      locationId,
      status: 'error',
      ready: false,
      error: true,
      message: `Error checking location: ${error.message}`,
    };
  }
}

/**
 * Check readiness status of multiple locations (batch operation)
 * 
 * @param {string[]} locationIds - Array of location IDs
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Batch readiness result with summary
 */
export async function checkMultipleLocations(locationIds, userId) {
  try {
    // Validate inputs
    if (!locationIds || locationIds.length === 0) {
      return {
        success: false,
        error: 'No location IDs provided',
      };
    }

    // Limit: Check max 50 locations at once (reasonable for most users)
    // Note: Rate limiter handles abuse prevention at API level
    if (locationIds.length > 50) {
      return {
        success: false,
        error: 'Maximum 50 locations can be checked at once. Please check in batches.',
      };
    }

    // Check each location in parallel
    const results = await Promise.all(
      locationIds.map(locId => checkLocationReadiness(locId, userId))
    );

    // Categorize results
    const readyLocations = results.filter(loc => loc.ready && !loc.error);
    const notReadyLocations = results.filter(loc => !loc.ready && !loc.error);
    const errorLocations = results.filter(loc => loc.error);

    // Calculate summary statistics
    const summary = {
      total: locationIds.length,
      ready: readyLocations.length,
      notReady: notReadyLocations.length,
      errors: errorLocations.length,
      canProceed: readyLocations.length > 0, // At least 1 location ready
      allReady: readyLocations.length === locationIds.length,
    };

    return {
      success: true,
      summary,
      locations: results,
      readyLocations,
      notReadyLocations,
      errorLocations,
    };
  } catch (error) {
    console.error('Error in checkMultipleLocations:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get detailed status of a location (includes review samples)
 * 
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Detailed location status
 */
export async function getLocationStatus(locationId, userId) {
  try {
    const basicStatus = await checkLocationReadiness(locationId, userId);

    if (!basicStatus.ready || basicStatus.error) {
      return basicStatus;
    }

    // Get additional details for ready locations (summaries are now shared across users)
    const [location, recentReviews, sentimentBreakdown] = await Promise.all([
      Location.findById(locationId).select('name address overallSentiment').lean(),

      ReviewSummary.find({ locationId, sentiment: { $ne: 'error' } })
        .sort({ processedAt: -1 })
        .limit(5)
        .select('summary sentiment rating author')
        .lean(),

      ReviewSummary.aggregate([
        { $match: { locationId: locationId, sentiment: { $ne: 'error' } } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } },
      ]),
    ]);

    // Format sentiment breakdown
    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };
    
    sentimentBreakdown.forEach(item => {
      sentimentCounts[item._id] = item.count;
    });

    return {
      ...basicStatus,
      details: {
        location: {
          name: location.name,
          address: location.address,
          overallSentiment: location.overallSentiment,
        },
        sentimentCounts,
        recentReviews,
      },
    };
  } catch (error) {
    console.error('Error getting location status:', error);
    return {
      locationId,
      status: 'error',
      ready: false,
      error: true,
      message: error.message,
    };
  }
}

/**
 * Filter array of location IDs to return only ready ones
 * Useful for auto-removing unready locations from user selection
 * 
 * @param {string[]} locationIds - Array of location IDs
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Filtered location IDs with reasons for exclusion
 */
export async function filterReadyLocations(locationIds, userId) {
  try {
    const checkResults = await checkMultipleLocations(locationIds, userId);

    if (!checkResults.success) {
      return {
        success: false,
        error: checkResults.error,
      };
    }

    const readyIds = checkResults.readyLocations.map(loc => loc.locationId);
    const excludedLocations = [
      ...checkResults.notReadyLocations.map(loc => ({
        locationId: loc.locationId,
        locationName: loc.locationName,
        reason: loc.message,
        action: loc.action,
      })),
      ...checkResults.errorLocations.map(loc => ({
        locationId: loc.locationId,
        locationName: loc.locationName || 'Unknown',
        reason: loc.message,
        action: null,
      })),
    ];

    return {
      success: true,
      readyLocationIds: readyIds,
      excludedLocations,
      stats: {
        totalRequested: locationIds.length,
        readyCount: readyIds.length,
        excludedCount: excludedLocations.length,
      },
    };
  } catch (error) {
    console.error('Error filtering ready locations:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  checkLocationReadiness,
  checkMultipleLocations,
  getLocationStatus,
  filterReadyLocations,
};
