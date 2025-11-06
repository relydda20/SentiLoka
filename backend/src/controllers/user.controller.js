import User from '../models/User.model.js';
import Location from '../models/Location.model.js';
import bcrypt from 'bcryptjs';

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

    // Get locations count for this user
    const locationsCount = await Location.countDocuments({ userId: user._id });

    // Get user's locations with aggregated stats
    const locations = await Location.find({ userId: user._id })
      .select('name address slug averageRating totalReviews sentiment')
      .lean();

    // Calculate statistics
    const totalReviews = locations.reduce((sum, loc) => sum + (loc.totalReviews || 0), 0);
    const avgRating = locations.length > 0
      ? (locations.reduce((sum, loc) => sum + (loc.averageRating || 0), 0) / locations.length).toFixed(1)
      : '0.0';

    // Count sentiment distribution
    const sentimentCounts = {
      good: locations.filter(loc => loc.sentiment === 'Good').length,
      neutral: locations.filter(loc => loc.sentiment === 'Neutral').length,
      bad: locations.filter(loc => loc.sentiment === 'Bad').length
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
      locations: locations.map(loc => ({
        _id: loc._id,
        name: loc.name,
        address: loc.address,
        slug: loc.slug,
        averageRating: loc.averageRating,
        totalReviews: loc.totalReviews,
        sentiment: loc.sentiment
      }))
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

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
