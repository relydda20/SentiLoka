// backend/src/models/Review.model.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location ID is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    // Slug for URLs (unique per location)
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    googleReviewId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    author: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      profilePhotoUrl: String,
      isLocalGuide: {
        type: Boolean,
        default: false
      },
      reviewCount: Number
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true
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
    reviewPhotos: [
      {
        url: String,
        width: Number,
        height: Number
      }
    ],
    ownerResponse: {
      text: String,
      timestamp: Date
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      required: true,
      index: true
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
      required: true
    },
    sentimentBreakdown: {
      positive: {
        type: Number,
        min: 0,
        max: 1
      },
      neutral: {
        type: Number,
        min: 0,
        max: 1
      },
      negative: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    keywords: {
      positive: [String],
      negative: [String]
    },
    topics: [String],
    analyzedAt: Date,
    analysisModel: {
      type: String,
      default: 'gemini-pro'
    },
    userActions: {
      hasResponse: {
        type: Boolean,
        default: false
      },
      isMarkedAsImportant: {
        type: Boolean,
        default: false
      },
      isArchived: {
        type: Boolean,
        default: false
      },
      tags: [String],
      notes: String
    },
    generatedReply: {
      text: String,
      tone: {
        type: String,
        enum: ['professional', 'friendly', 'empathetic', 'apologetic', 'grateful']
      },
      style: {
        type: String,
        enum: ['formal', 'casual', 'brief', 'detailed']
      },
      generatedAt: Date,
      wasPosted: {
        type: Boolean,
        default: false
      },
      postedAt: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isNewSinceLastCheck: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
reviewSchema.index({ userId: 1, locationId: 1 });
reviewSchema.index({ userId: 1, sentiment: 1 });
reviewSchema.index({ locationId: 1, publishedAt: -1 });
reviewSchema.index({ locationId: 1, slug: 1 }, { unique: true, sparse: true });
reviewSchema.index({ sentiment: 1, rating: 1 });
reviewSchema.index({ publishedAt: -1 });

// Virtual: Time since published
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

// Pre-save: Generate slug
reviewSchema.pre('save', async function (next) {
  if (!this.slug && this.isNew) {
    this.slug = await this.generateUniqueSlug();
  }

  // Auto-determine sentiment from score if not set
  if (!this.sentiment && this.sentimentScore !== undefined) {
    if (this.sentimentScore > 0.2) {
      this.sentiment = 'positive';
    } else if (this.sentimentScore < -0.2) {
      this.sentiment = 'negative';
    } else {
      this.sentiment = 'neutral';
    }
  }
  
  next();
});

// Method: Generate unique slug (unique per location)
reviewSchema.methods.generateUniqueSlug = async function () {
  // Use author name + timestamp
  const authorSlug = this.author.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const timestamp = this.publishedAt.getTime().toString().slice(-8);
  
  let baseSlug = `${authorSlug}-${timestamp}`;
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists for this location
  while (await mongoose.model('Review').findOne({ 
    locationId: this.locationId, 
    slug,
    _id: { $ne: this._id }
  })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Method: Mark as seen
reviewSchema.methods.markAsSeen = async function () {
  this.isNewSinceLastCheck = false;
  await this.save();
};

// Static: Get reviews by sentiment
reviewSchema.statics.getBySentiment = async function (locationId, sentiment) {
  return await this.find({ locationId, sentiment, isActive: true })
    .sort({ publishedAt: -1 });
};

// Static: Get recent reviews
reviewSchema.statics.getRecent = async function (locationId, days = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return await this.find({
    locationId,
    publishedAt: { $gte: dateThreshold },
    isActive: true
  }).sort({ publishedAt: -1 });
};

// Static: Find by user slug, location slug, and review slug
reviewSchema.statics.findByFullSlug = async function (userSlug, locationSlug, reviewSlug) {
  const User = mongoose.model('User');
  const Location = mongoose.model('Location');
  
  const user = await User.findOne({ slug: userSlug });
  if (!user) return null;
  
  const location = await Location.findOne({ userId: user._id, slug: locationSlug });
  if (!location) return null;
  
  return await this.findOne({ locationId: location._id, slug: reviewSlug });
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;