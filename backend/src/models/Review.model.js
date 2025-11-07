import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true
    },
    googleReviewId: {
      type: String,
      required: true,
      unique: true, // Each Google review ID is globally unique
      index: true
    },
    author: {
      name: {
        type: String,
        required: true,
        trim: true
      },
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5
    },
    text: {
      type: String,
      required: false, // Optional - some reviews only have ratings
      trim: true,
      default: ''
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    sourceUrl: String,
    likes: {
      type: Number,
      default: 0
    },
    // Note: Sentiment analysis data is stored in ReviewSummary model
    // This model only contains raw scraped review data
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for shared reviews across users
reviewSchema.index({ locationId: 1, publishedAt: -1 });
reviewSchema.index({ publishedAt: -1 });

reviewSchema.virtual('timeSincePublished').get(function () {
  const now = new Date();
  const diff = now - this.publishedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Note: Reviews don't need slugs - they're uniquely identified by googleReviewId

reviewSchema.statics.getRecent = async function (locationId, days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  return await this.find({
    locationId,
    publishedAt: { $gte: dateThreshold }
  }).sort({ publishedAt: -1 });
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;