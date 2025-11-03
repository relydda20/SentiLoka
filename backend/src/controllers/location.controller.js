import Location from '../models/Location.model.js';

/**
 * Create a new location for testing
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

    // Check if location already exists for this user
    const existingLocation = await Location.findOne({
      userId: req.user._id,
      placeId: placeId,
    });

    if (existingLocation) {
      return res.status(409).json({
        success: false,
        message: 'Location already exists',
        data: existingLocation,
      });
    }

    // Create new location
    const location = new Location({
      userId: req.user._id,
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
      scrapeStatus: 'completed', // Set to 'completed' so first scrape can start
      googleMapsUrl: googleMapsUrl || null,
    });

    await location.save();

    return res.status(201).json({
      success: true,
      message: 'Location created successfully',
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
 * Get all locations for current user
 * @route GET /api/locations
 * @access Private
 */
export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    console.error('Error getting locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get locations',
      error: error.message,
    });
  }
};

/**
 * Get single location by ID
 * @route GET /api/locations/:id
 * @access Private
 */
export const getLocation = async (req, res) => {
  try {
    const location = await Location.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      });
    }

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

export default {
  createLocation,
  getLocations,
  getLocation,
  updateLocationStatus,
};
