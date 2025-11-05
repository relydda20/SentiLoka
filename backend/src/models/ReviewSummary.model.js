import mongoose from "mongoose";

const reviewSummarySchema = new mongoose.Schema(
  {
    // Review identification
    reviewId: {
      type: String,
      sparse: true, // Allows multiple null values but enforces uniqueness for non-null
      index: true,
    },

    // User and Location association
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
    publishedAt: {
      type: Date,
      index: true,
    },

    // Sentiment analysis results
    sentiment: {
      type: String,
      enum: ["positive", "negative", "neutral", "error"],
      required: true,
      index: true,
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
    // These are keywords that influenced the sentiment (contextual to the sentiment)
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
reviewSummarySchema.index({ publishedAt: -1 });
reviewSummarySchema.index({ createdAt: -1 });
reviewSummarySchema.index({ userId: 1, locationId: 1 });
reviewSummarySchema.index({ userId: 1, sentiment: 1 });
reviewSummarySchema.index({ locationId: 1, sentiment: 1 });
reviewSummarySchema.index({ locationId: 1, publishedAt: -1 }); // For trends queries
// Unique compound index to prevent duplicate analyses
reviewSummarySchema.index({ userId: 1, locationId: 1, reviewId: 1 }, { unique: true, sparse: true });

// Static method to get all summaries for a location
reviewSummarySchema.statics.getSummariesByLocation = function (
  locationId,
  limit = null
) {
  const query = this.find({ locationId, sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .select("summary sentiment sentimentScore author rating sentimentKeywords contextualTopics processedAt");

  // Only apply limit if specified
  return limit ? query.limit(limit) : query;
};

// Static method to get recent summaries for a user
reviewSummarySchema.statics.getRecentSummaries = function (userId, limit = 50) {
  return this.find({ userId, sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentiment sentimentScore author rating locationId processedAt");
};

// Static method to get summaries by sentiment for a location
reviewSummarySchema.statics.getSummariesBySentiment = function (
  locationId,
  sentiment,
  limit = null
) {
  const query = this.find({ locationId, sentiment })
    .sort({ processedAt: -1 })
    .select("summary sentimentScore author rating sentimentKeywords contextualTopics processedAt");

  // Only apply limit if specified
  return limit ? query.limit(limit) : query;
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
    locationId: this.locationId,
    processedAt: this.processedAt,
  };
};

const ReviewSummary = mongoose.model("ReviewSummary", reviewSummarySchema);

export default ReviewSummary;
