import Location from '../models/Location.model.js';
import UserLocation from '../models/UserLocation.model.js';
import Review from '../models/Review.model.js';
import ReviewSummary from '../models/ReviewSummary.model.js';
import User from '../models/User.model.js';

// const locationController = {
//   // 1. Get All Locations by one User
//   getAllLocationsByUser: async (req, res) => {
//     try {
//       const { userId } = req.params;

//       // Verify user existsda
//       const userExists = await User.findById(userId);
//       if (!userExists) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       // Get all locations for this user
//       const locations = await Location.find({ userId, status: { $ne: 'deleted' } })
//         .select('-__v')
//         .sort({ createdAt: -1 });

//       res.status(200).json({
//         success: true,
//         data: locations,
//         count: locations.length
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   },

//   // 2. Get All Reviews from a Location
//   getReviewsByLocation: async (req, res) => {
//     try {
//       const { locationId } = req.params;

//       // Verify location exists
//       const locationExists = await Location.findById(locationId);
//       if (!locationExists) {
//         return res.status(404).json({
//           success: false,
//           message: 'Location not found'
//         });
//       }

//       // Get all reviews for this location
//       const reviews = await Review.find({ locationId })
//         .select('-__v')
//         .sort({ publishedAt: -1 });

//       res.status(200).json({
//         success: true,
//         data: reviews,
//         count: reviews.length
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   },

//   // 3. Get Location by ID
//   getLocationById: async (req, res) => {
//     try {
//       const { locationId } = req.params;

//       const location = await Location.findById(locationId)
//         .select('-__v')
//         .populate('reviews');

//       if (!location) {
//         return res.status(404).json({
//           success: false,
//           message: 'Location not found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: location
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   },

//   // 4. Add Location using Place ID
//   addLocation: async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { placeId, name, address, lat, lng, googleData, tags, notes } = req.body;

//       // Verify user exists
//       const userExists = await User.findById(userId);
//       if (!userExists) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       // Check if location already exists for this user
//       const existingLocation = await Location.findOne({ userId, placeId });
//       if (existingLocation) {
//         return res.status(409).json({
//           success: false,
//           message: 'Location already exists for this user'
//         });
//       }

//       // Create new location
//       const newLocation = new Location({
//         userId,
//         placeId,
//         name,
//         address,
//         coordinates: {
//           lat,
//           lng
//         },
//         googleData: googleData || {},
//         tags: tags || [],
//         notes: notes || '',
//         status: 'active'
//       });

//       await newLocation.save();

//       res.status(201).json({
//         success: true,
//         message: 'Location added successfully',
//         data: newLocation
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   },

//   // 5. Edit Location
//   editLocation: async (req, res) => {
//     try {
//       const { locationId } = req.params;
//       const updateData = req.body;

//       // Fields that cannot be updated
//       const restrictedFields = ['userId', 'placeId', 'googleReviewId'];
//       restrictedFields.forEach(field => delete updateData[field]);

//       const location = await Location.findByIdAndUpdate(
//         locationId,
//         updateData,
//         { new: true, runValidators: true }
//       ).select('-__v');

//       if (!location) {
//         return res.status(404).json({
//           success: false,
//           message: 'Location not found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Location updated successfully',
//         data: location
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   },

//   // 6. Delete Location
//   deleteLocation: async (req, res) => {
//     try {
//       const { locationId } = req.params;

//       const location = await Location.findByIdAndUpdate(
//         locationId,
//         { status: 'deleted' },
//         { new: true }
//       );

//       if (!location) {
//         return res.status(404).json({
//           success: false,
//           message: 'Location not found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: 'Location deleted successfully',
//         data: location
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }
// };

// export default locationController;

/**
 * Create a new location or link existing location to user
 * @route POST /api/locations
 * @access Private
 */
export const createLocation = async (req, res) => {
  try {
    const { placeId, name, address, coordinates, googleMapsUrl } = req.body;

    // Validate required fields
    if (!placeId || !name || !address || !coordinates) {
      return res.status(400).json({
        success: false,
        message: 'placeId, name, address, and coordinates are required',
      });
    }

    // Validate coordinates
    if (!coordinates.lat || !coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates (lat, lng) are required',
      });
    }

    // Check if location already exists globally by placeId
    let location = await Location.findOne({ placeId });

    // Check if user already has this location
    const existingUserLocation = await UserLocation.findOne({
      userId: req.user._id,
      locationId: location?._id,
      status: 'active'
    });

    if (existingUserLocation) {
      return res.status(409).json({
        success: false,
        message: 'You are already tracking this location',
        data: location,
      });
    }

    // If location doesn't exist globally, create it
    if (!location) {
      location = new Location({
        placeId,
        name,
        address,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
        googleData: {
          rating: req.body.rating || 0,
          userRatingsTotal: req.body.userRatingsTotal || 0,
          types: req.body.types || ['establishment'],
        },
        scrapeConfig: {
          autoScrape: false,
          scrapeFrequency: 'manual',
          maxReviews: req.body.maxReviews || 100,
        },
        scrapeStatus: 'idle',
        googleMapsUrl: googleMapsUrl || null,
      });

      await location.save();
    }

    // Create UserLocation relationship
    const userLocation = new UserLocation({
      userId: req.user._id,
      locationId: location._id,
      status: 'active',
      addedAt: new Date()
    });

    await userLocation.save();

    return res.status(201).json({
      success: true,
      message: location.isNew === false ? 'Location linked to your account successfully' : 'Location created and linked successfully',
      data: location,
    });
  } catch (error) {
    console.error('Error creating location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message,
    });
  }
};

/**
 * Get single location by ID (checks UserLocation relationship)
 * @route GET /api/locations/:id
 * @access Private
 */
export const getLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const userId = req.user._id;

    // Check if user has access to this location
    const userLocation = await UserLocation.findOne({
      userId,
      locationId,
      status: 'active'
    });

    if (!userLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or you do not have access to it',
      });
    }

    // Get the location
    const location = await Location.findById(locationId).lean();

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    // Ensure scrapeProgress exists for backward compatibility with old documents
    if (!location.scrapeProgress) {
      location.scrapeProgress = {
        percentage: 0,
        current: 0,
        total: 0,
        estimatedTimeRemaining: null,
        startedAt: null,
        message: null
      };
    }

    // Update lastViewedAt
    userLocation.lastViewedAt = new Date();
    await userLocation.save();

    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error getting location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get location',
      error: error.message,
    });
  }
};

/**
 * Update location scrape status (for testing/debugging)
 * @route PATCH /api/locations/:id/status
 * @access Private
 */
export const updateLocationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'scraping', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required: pending, scraping, completed, or failed',
      });
    }

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { scrapeStatus: status },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Location status updated',
      data: location,
    });
  } catch (error) {
    console.error('Error updating location status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update location status',
      error: error.message,
    });
  }
};

/**
 * Get all locations for the current user (via UserLocation relationship)
 * @route GET /api/locations
 * @access Private
 */
export const getLocations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all active UserLocation relationships for this user
    const userLocations = await UserLocation.find({
      userId,
      status: 'active'
    })
      .populate({
        path: 'locationId',
        select: 'name placeId address coordinates phoneNumber googleData googleMapsUrl status scrapeStatus scrapeConfig scrapeProgress overallSentiment lastAnalyzedAt createdAt updatedAt'
      })
      .sort({ addedAt: -1 }) // Sort by when user added the location
      .lean();

    // Enhance each location with user-specific data and review counts
    const locationsWithReviewCount = await Promise.all(
      userLocations.map(async (userLocation) => {
        const location = userLocation.locationId;

        if (!location) {
          // Skip if location was deleted (shouldn't happen but for safety)
          return null;
        }

        const scrapedReviewCount = await Review.countDocuments({
          locationId: location._id
        });

        const analyzedReviewCount = await ReviewSummary.countDocuments({
          locationId: location._id,
          sentiment: { $ne: 'error' }
        });

        // Ensure scrapeProgress exists for backward compatibility
        if (!location.scrapeProgress) {
          location.scrapeProgress = {
            percentage: 0,
            current: 0,
            total: 0,
            estimatedTimeRemaining: null,
            startedAt: null,
            message: null
          };
        }

        return {
          ...location,
          // Add review counts
          scrapedReviewCount,
          analyzedReviewCount,
        };
      })
    );

    // Filter out null entries (deleted locations)
    const validLocations = locationsWithReviewCount.filter(loc => loc !== null);

    return res.status(200).json({
      success: true,
      message: 'Locations retrieved successfully',
      data: validLocations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message,
    });
  }
};

/**
 * Delete location (hard delete via UserLocation)
 * @route DELETE /api/locations/:id
 * @access Private
 */
export const deleteLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const userId = req.user._id;

    // Find and delete the UserLocation relationship
    const deletedUserLocation = await UserLocation.findOneAndDelete({
      userId,
      locationId,
      status: 'active'
    });

    if (!deletedUserLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or already removed',
      });
    }

    // Check if any other users are still tracking this location
    const otherUsersCount = await UserLocation.countDocuments({
      locationId,
      status: 'active'
    });

    return res.status(200).json({
      success: true,
      message: 'Location removed from your tracked locations',
      data: {
        locationId,
        stillTrackedByOthers: otherUsersCount > 0,
        activeUsersCount: otherUsersCount
      }
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message,
    });
  }
};

export default {
  createLocation,
  getLocations,
  getLocation,
  updateLocationStatus,
  deleteLocation,
};
