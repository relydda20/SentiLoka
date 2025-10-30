import Location from '../models/Location.model.js';
import Review from '../models/Review.model.js';
import User from '../models/User.model.js';

const locationController = {
  // 1. Get All Locations by one User
  getAllLocationsByUser: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get all locations for this user
      const locations = await Location.find({ userId, status: { $ne: 'deleted' } })
        .select('-__v')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: locations,
        count: locations.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // 2. Get All Reviews from a Location
  getReviewsByLocation: async (req, res) => {
    try {
      const { locationId } = req.params;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Get all reviews for this location
      const reviews = await Review.find({ locationId })
        .select('-__v')
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // 3. Get Location by ID
  getLocationById: async (req, res) => {
    try {
      const { locationId } = req.params;

      const location = await Location.findById(locationId)
        .select('-__v')
        .populate('reviews');

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      res.status(200).json({
        success: true,
        data: location
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // 4. Add Location using Place ID
  addLocation: async (req, res) => {
    try {
      const { userId } = req.params;
      const { placeId, name, address, lat, lng, googleData, tags, notes } = req.body;

      // Verify user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if location already exists for this user
      const existingLocation = await Location.findOne({ userId, placeId });
      if (existingLocation) {
        return res.status(409).json({
          success: false,
          message: 'Location already exists for this user'
        });
      }

      // Create new location
      const newLocation = new Location({
        userId,
        placeId,
        name,
        address,
        coordinates: {
          lat,
          lng
        },
        googleData: googleData || {},
        tags: tags || [],
        notes: notes || '',
        status: 'active'
      });

      await newLocation.save();

      res.status(201).json({
        success: true,
        message: 'Location added successfully',
        data: newLocation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // 5. Edit Location
  editLocation: async (req, res) => {
    try {
      const { locationId } = req.params;
      const updateData = req.body;

      // Fields that cannot be updated
      const restrictedFields = ['userId', 'placeId', 'googleReviewId'];
      restrictedFields.forEach(field => delete updateData[field]);

      const location = await Location.findByIdAndUpdate(
        locationId,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: location
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // 6. Delete Location
  deleteLocation: async (req, res) => {
    try {
      const { locationId } = req.params;

      const location = await Location.findByIdAndUpdate(
        locationId,
        { status: 'deleted' },
        { new: true }
      );

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Location deleted successfully',
        data: location
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

export default locationController;
