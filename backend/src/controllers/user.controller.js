import User from '../models/User.model.js';
import Location from '../models/Location.model.js';
import UserLocation from '../models/UserLocation.model.js';
import Review from '../models/Review.model.js';
import ReviewSummary from '../models/ReviewSummary.model.js';

/**
 * Controller: Get user profile by slug (Public)
 * @route GET /api/users/:slug
 * @access Public
 */
export const getUserBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Find user by slug and exclude password
    const user = await User.findOne({ slug })
      .select('-password')
      .populate('totalLocations')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's locations through the UserLocation junction table
    const userLocations = await UserLocation.find({
      userId: user._id,
      status: 'active'
    }).select('locationId').lean();

    console.log('📍 UserLocations found:', userLocations.length);
    console.log('📍 UserLocation records:', userLocations);

    const locationIds = userLocations.map(ul => ul.locationId);
    const locationsCount = locationIds.length;

    console.log('📍 Location IDs:', locationIds);
    console.log('📍 Locations count:', locationsCount);

    // Get locations with their sentiment data
    const locations = await Location.find({
      _id: { $in: locationIds },
      status: 'active'
    })
      .select('name address slug overallSentiment')
      .lean();

    console.log('📍 Locations from DB:', locations.length);
    console.log('📍 Locations data:', JSON.stringify(locations, null, 2));

    // Map locations to include the data in the expected format
    // Enhanced with actual review counts from Review and ReviewSummary collections
    const mappedLocations = await Promise.all(
      locations.map(async (loc) => {
        // Count actual scraped reviews from Review collection
        const scrapedReviewCount = await Review.countDocuments({
          locationId: loc._id
        });

        // Count analyzed reviews from ReviewSummary collection
        const analyzedReviewCount = await ReviewSummary.countDocuments({
          locationId: loc._id,
          sentiment: { $ne: 'error' }
        });

        // Determine sentiment category based on overallSentiment percentages
        let sentiment = 'No Data';
        const { positive = 0, negative = 0, neutral = 0, totalReviews = 0 } = loc.overallSentiment || {};

        // Only categorize if location has been analyzed (has reviews)
        if (totalReviews > 0) {
          if (positive > negative && positive > neutral) {
            sentiment = 'Positive';
          } else if (negative > positive && negative > neutral) {
            sentiment = 'Bad';
          } else {
            sentiment = 'Neutral';
          }
        }

        return {
          _id: loc._id,
          name: loc.name,
          address: loc.address,
          slug: loc.slug,
          averageRating: loc.overallSentiment?.averageRating || 0,
          // Use scrapedReviewCount for total reviews (shows all scraped reviews, not just analyzed)
          totalReviews: scrapedReviewCount,
          analyzedReviews: analyzedReviewCount,
          sentiment
        };
      })
    );

    // Calculate statistics
    const totalReviews = mappedLocations.reduce((sum, loc) => sum + (loc.totalReviews || 0), 0);
    const avgRating = mappedLocations.length > 0
      ? (mappedLocations.reduce((sum, loc) => sum + (loc.averageRating || 0), 0) / mappedLocations.length).toFixed(1)
      : '0.0';

    // Count sentiment distribution
    const sentimentCounts = {
      positive: mappedLocations.filter(loc => loc.sentiment === 'Positive').length,
      neutral: mappedLocations.filter(loc => loc.sentiment === 'Neutral').length,
      bad: mappedLocations.filter(loc => loc.sentiment === 'Bad').length,
      noData: mappedLocations.filter(loc => loc.sentiment === 'No Data').length
    };

    // Prepare response data
    const profileData = {
      _id: user._id,
      slug: user.slug,
      name: user.name,
      email: user.email,
      image: user.image,
      description: user.description,
      createdAt: user.createdAt,
      stats: {
        totalLocations: locationsCount,
        totalReviews,
        averageRating: parseFloat(avgRating),
        sentimentCounts
      },
      locations: mappedLocations
    };

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching user by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Controller: Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, image } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;

    // Validate name if provided
    if (name && (name.length < 2 || name.length > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 100 characters'
      });
    }

    // Validate description if provided
    if (description && description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters'
      });
    }

    // Get user first to check if name is changing
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If name is changing, regenerate slug
    if (name && name !== user.name) {
      Object.assign(user, updateData);
      await user.regenerateSlug();
    } else {
      // Otherwise just update the fields
      Object.assign(user, updateData);
      await user.save();
    }

    // Remove password field from response
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Controller: Change user password
 * @route POST /api/users/change-password
 * @access Private
 */
export const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both old and new passwords'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user uses local auth (has password)
    if (!user.password || !user.authProviders.includes('local')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for social login accounts'
      });
    }

    // Verify old password
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Old password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};
