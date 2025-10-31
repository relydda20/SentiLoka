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

// Static method to get all summaries for a company
reviewSummarySchema.statics.getSummariesByCompany = function (
  company,
  limit = 100
) {
  return this.find({ company, sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentiment sentimentScore author rating processedAt");
};

// Static method to get recent summaries
reviewSummarySchema.statics.getRecentSummaries = function (limit = 50) {
  return this.find({ sentiment: { $ne: "error" } })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentiment sentimentScore author rating company processedAt");
};

// Static method to get summaries by sentiment
reviewSummarySchema.statics.getSummariesBySentiment = function (
  sentiment,
  limit = 100
) {
  return this.find({ sentiment })
    .sort({ processedAt: -1 })
    .limit(limit)
    .select("summary sentimentScore author rating company processedAt");
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
    company: this.company,
    processedAt: this.processedAt,
  };
};

const ReviewSummary = mongoose.model("ReviewSummary", reviewSummarySchema);

export default ReviewSummary;
