import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    placeId: {
      type: String,
      required: [true, 'Place ID is required'],
      unique: true, // Now globally unique since locations are shared
      index: true
    },
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    googleMapsUrl: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(v) {
          // Allow empty string or null
          if (!v) return true;
          
          // Accept all valid Google Maps URL formats:
          // - https://maps.google.com/?cid=...
          // - https://www.google.com/maps/place/...
          // - https://google.com/maps/...
          // - https://goo.gl/maps/...
          // - https://maps.app.goo.gl/...
          const googleMapsPatterns = [
            /^https?:\/\/(www\.)?maps\.google\.[a-z.]+/i,           // maps.google.com
            /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/i,           // google.com/maps
            /^https?:\/\/goo\.gl\/maps/i,                           // goo.gl/maps (shortened)
            /^https?:\/\/maps\.app\.goo\.gl/i,                      // maps.app.goo.gl (new short URLs)
          ];
          
          return googleMapsPatterns.some(pattern => pattern.test(v));
        },
        message: 'Invalid Google Maps URL format. Must be a valid Google Maps link.'
      }
    },
    googleData: {
      rating: {
        type: Number,
        min: 0,
        max: 5
      },
      userRatingsTotal: {
        type: Number,
        default: 0
      },
      types: [String],
    },
    scrapeConfig: {
      autoScrape: {
        type: Boolean,
        default: true
      },
      scrapeFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'manual'],
        default: 'weekly'
      },
      lastScraped: Date,
      nextScheduledScrape: Date,
      maxReviews: {
        type: Number,
        default: 100,
        max: 800,
      }
    },
    overallSentiment: {
      positive: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      neutral: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      negative: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalReviews: {
        type: Number,
        default: 0
      },
      lastCalculated: Date
    },
    lastAnalyzedAt: {
      type: Date,
      default: null
    },
    sentimentHistory: [
      {
        date: {
          type: Date,
          required: true
        },
        positive: Number,
        negative: Number,
        neutral: Number,
        averageRating: Number,
        totalReviews: Number
      }
    ],
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active'
    },
    scrapeStatus: {
      type: String,
      enum: ['idle', 'pending', 'scraping', 'completed', 'failed'],
      default: 'idle'
    },
    scrapeProgress: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      current: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      },
      estimatedTimeRemaining: {
        type: Number, // in seconds
        default: null
      },
      startedAt: Date,
      message: String
    },
    lastScrapeError: {
      message: String,
      timestamp: Date
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Slug should be globally unique, sparse to allow null values
locationSchema.index({ slug: 1 }, { unique: true, sparse: true });
locationSchema.index({ status: 1 });
locationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

locationSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'locationId'
});

locationSchema.pre('save', async function (next) {
  if (!this.slug && this.isNew) {
    this.slug = await this.generateUniqueSlug();
  }
  next();
});

locationSchema.methods.generateUniqueSlug = async function () {
  const name = this.name;

  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (baseSlug.length < 3) {
    baseSlug = `location-${baseSlug}`;
  }

  let slug = baseSlug;
  let counter = 1;

  // Slug is now globally unique, not per-user
  while (await mongoose.model('Location').findOne({
    slug,
    _id: { $ne: this._id }
  })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

locationSchema.methods.regenerateSlug = async function () {
  this.slug = await this.generateUniqueSlug();
  await this.save();
  return this.slug;
};

locationSchema.methods.calculateSentiment = async function () {
  const ReviewSummary = mongoose.model('ReviewSummary');

  // Get sentiment data from ReviewSummary model (analyzed reviews)
  const summaries = await ReviewSummary.find({
    locationId: this._id,
    sentiment: { $ne: 'error' }
  });

  if (summaries.length === 0) {
    this.overallSentiment = {
      positive: 0,
      neutral: 0,
      negative: 0,
      averageRating: 0,
      totalReviews: 0,
      lastCalculated: new Date()
    };
    return this.overallSentiment;
  }

  const totalReviews = summaries.length;
  const positiveCount = summaries.filter(r => r.sentiment === 'positive').length;
  const negativeCount = summaries.filter(r => r.sentiment === 'negative').length;
  const neutralCount = summaries.filter(r => r.sentiment === 'neutral').length;

  const totalRating = summaries.reduce((sum, r) => sum + (r.rating || 0), 0);
  const averageRating = totalRating / totalReviews;

  this.overallSentiment = {
    positive: parseFloat(((positiveCount / totalReviews) * 100).toFixed(2)),
    neutral: parseFloat(((neutralCount / totalReviews) * 100).toFixed(2)),
    negative: parseFloat(((negativeCount / totalReviews) * 100).toFixed(2)),
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews,
    lastCalculated: new Date()
  };

  await this.save();
  return this.overallSentiment;
};

locationSchema.methods.addSentimentHistory = async function () {
  const historyEntry = {
    date: new Date(),
    positive: this.overallSentiment.positive,
    negative: this.overallSentiment.negative,
    neutral: this.overallSentiment.neutral,
    averageRating: this.overallSentiment.averageRating,
    totalReviews: this.overallSentiment.totalReviews
  };

  this.sentimentHistory.push(historyEntry);
  if (this.sentimentHistory.length > 90) {
    this.sentimentHistory = this.sentimentHistory.slice(-90);
  }

  await this.save();
};

// This method now requires checking the UserLocation junction table
locationSchema.statics.findByUserAndSlug = async function (userSlug, locationSlug) {
  const User = mongoose.model('User');
  const UserLocation = mongoose.model('UserLocation');

  const user = await User.findOne({ slug: userSlug });
  if (!user) return null;

  const location = await this.findOne({ slug: locationSlug });
  if (!location) return null;

  // Check if user has access to this location
  const userLocation = await UserLocation.findOne({
    userId: user._id,
    locationId: location._id,
    status: 'active'
  });

  return userLocation ? location : null;
};

// Scraping progress methods
locationSchema.methods.startScraping = async function(totalReviews = 0) {
  this.scrapeStatus = 'scraping';
  this.scrapeProgress = {
    percentage: 0,
    current: 0,
    total: totalReviews,
    estimatedTimeRemaining: null,
    startedAt: new Date(),
    message: 'Initializing scraper...'
  };
  await this.save();
  return this.scrapeProgress;
};

locationSchema.methods.updateScrapeProgress = async function(current, total, message = null) {
  this.scrapeProgress.current = current;
  this.scrapeProgress.total = total;
  this.scrapeProgress.percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (message) {
    this.scrapeProgress.message = message;
  }

  // Calculate estimated time remaining
  if (this.scrapeProgress.startedAt && current > 0) {
    const elapsedMs = Date.now() - this.scrapeProgress.startedAt.getTime();
    const msPerItem = elapsedMs / current;
    const remainingItems = total - current;
    this.scrapeProgress.estimatedTimeRemaining = Math.round((remainingItems * msPerItem) / 1000); // in seconds
  }

  await this.save();
  return this.scrapeProgress;
};

locationSchema.methods.completeScraping = async function(message = 'Scraping completed successfully') {
  this.scrapeStatus = 'completed';
  this.scrapeConfig.lastScraped = new Date();
  this.scrapeProgress.percentage = 100;
  this.scrapeProgress.estimatedTimeRemaining = 0;
  this.scrapeProgress.message = message;
  await this.save();
  return this.scrapeProgress;
};

locationSchema.methods.failScraping = async function(errorMessage) {
  this.scrapeStatus = 'failed';
  this.lastScrapeError = {
    message: errorMessage,
    timestamp: new Date()
  };
  this.scrapeProgress.message = `Error: ${errorMessage}`;
  await this.save();
};

const Location = mongoose.model('Location', locationSchema);

export default Location;