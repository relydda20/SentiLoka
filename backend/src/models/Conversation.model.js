import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Optional: for authenticated users
    },
    title: {
      type: String,
      default: null, // Generated from first user message
      maxlength: 100,
    },
    // ✅ NEW: Locations attached to this conversation
    attachedLocationIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: false,
    }],
    // ✅ NEW: Quick access to location metadata (cached for performance)
    locationMetadata: [{
      locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
      },
      name: String,
      reviewCount: Number,
      analyzedReviewCount: Number,
      attachedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      reviewSnapshot: {
        totalReviews: Number,
        averageRating: Number,
      },
      // ✅ NEW: Track which locations were analyzed
      locationsAnalyzed: [{
        locationId: mongoose.Schema.Types.ObjectId,
        locationName: String,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
conversationSchema.index({ sessionId: 1, lastActivity: -1 });
// ✅ NEW: Index for querying conversations by user and attached locations
conversationSchema.index({ userId: 1, attachedLocationIds: 1 });
conversationSchema.index({ userId: 1, lastActivity: -1 });

// Auto-delete conversations older than 30 days
conversationSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
