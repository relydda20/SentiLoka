import mongoose from 'mongoose';

/**
 * UserLocation Model
 * Junction table for many-to-many relationship between Users and Locations
 * This allows multiple users to track the same location without duplicating location data
 */
const userLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true
    },
    // User-specific customization for this location
    customName: {
      type: String,
      trim: true
    },
    tags: [String],
    notes: {
      type: String,
      maxlength: 1000
    },
    // Track when this user added the location
    addedAt: {
      type: Date,
      default: Date.now
    },
    // Track if user has removed this location (soft delete)
    status: {
      type: String,
      enum: ['active', 'removed'],
      default: 'active'
    },
    // User-specific settings
    notifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['realtime', 'daily', 'weekly', 'never'],
        default: 'weekly'
      }
    },
    // Track user's last interaction with this location
    lastViewedAt: Date,
  },
  {
    timestamps: true
  }
);

// Compound index to ensure a user can't add the same location twice
userLocationSchema.index({ userId: 1, locationId: 1 }, { unique: true });

// Index for efficient queries
userLocationSchema.index({ userId: 1, status: 1 });
userLocationSchema.index({ locationId: 1, status: 1 });

const UserLocation = mongoose.model('UserLocation', userLocationSchema);

export default UserLocation;
