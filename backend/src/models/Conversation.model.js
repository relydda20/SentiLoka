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
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
conversationSchema.index({ sessionId: 1, lastActivity: -1 });

// Auto-delete conversations older than 30 days
conversationSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
