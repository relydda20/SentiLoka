import mongoose from "mongoose";

const reviewSummarySchema = new mongoose.Schema(
  {
    // Review identification
    reviewId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null
      index: true,
    },

    // Location and User association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true
    },
    placeId: {
      type: String,
      required: true,
      index: true
    },

    // Original review data
    author: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: true,
    },

    // Sentiment analysis results
    sentiment: {
      type: String,
      enum: ["positive", "negative", "neutral", "error"],
      required: true,
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },

    // Keywords and topics
    sentimentKeywords: [String],
    contextualTopics: [String],

    // The summary - main field for chatbot
    summary: {
      type: String,
      required: true,
      index: true, // Index for faster searches
    },

    // Metadata
    source: {
      type: String,
      default: "Google Maps",
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },

    // For combined summaries
    isCombined: {
      type: Boolean,
      default: false,
    },
    originalSummaryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReviewSummary",
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying
reviewSummarySchema.index({ processedAt: -1 });
reviewSummarySchema.index({ createdAt: -1 });
reviewSummarySchema.index({ userId: 1, locationId: 1 });
reviewSummarySchema.index({ userId: 1, placeId: 1 });
reviewSummarySchema.index({ locationId: 1, sentiment: 1 });

// Static method to get all summaries for a location
reviewSummarySchema.statics.getSummariesByLocation = function (
  locationId,
  limit = 100
) {
  return this.find({ locationId, sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentiment sentimentScore author rating sentimentKeywords contextualTopics processedAt");
};

// Static method to get all summaries for a user's location
reviewSummarySchema.statics.getSummariesByUserAndLocation = function (
  userId,
  locationId,
  limit = 100
) {
  return this.find({ userId, locationId, sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentiment sentimentScore author rating sentimentKeywords contextualTopics processedAt");
};

// Static method to get recent summaries
reviewSummarySchema.statics.getRecentSummaries = function (limit = 50) {
  return this.find({ sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentiment sentimentScore author rating processedAt");
};

// Static method to get summaries by sentiment
reviewSummarySchema.statics.getSummariesBySentiment = function (
  sentiment,
  limit = 100
) {
  return this.find({ sentiment })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentimentScore author rating processedAt");
};

// Instance method to format for chatbot
reviewSummarySchema.methods.formatForChatbot = function () {
  return {
    id: this._id,
    author: this.author,
    rating: this.rating,
    sentiment: this.sentiment,
    sentimentScore: this.sentimentScore,
    summary: this.summary,
    keywords: this.sentimentKeywords,
    topics: this.contextualTopics,
    processedAt: this.processedAt,
  };
};

const ReviewSummary = mongoose.model("ReviewSummary", reviewSummarySchema);

export default ReviewSummary;
