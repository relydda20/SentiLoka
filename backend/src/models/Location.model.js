import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    placeId: {
      type: String,
      required: [true, 'Place ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Business name is required'],
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
      enum: ['pending', 'scraping', 'completed', 'failed'],
      default: 'pending'
    },
    lastScrapeError: {
      message: String,
      timestamp: Date
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    tags: [String],
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

locationSchema.index({ userId: 1, placeId: 1 }, { unique: true });
locationSchema.index({ userId: 1, slug: 1 }, { unique: true }); // Slug unique per user
locationSchema.index({ userId: 1, status: 1 });
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
  const name = this.customName || this.name;
  
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (baseSlug.length < 3) {
    baseSlug = `location-${baseSlug}`;
  }

  let slug = baseSlug;
  let counter = 1;

  while (await mongoose.model('Location').findOne({ 
    userId: this.userId, 
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

locationSchema.statics.findByUserAndSlug = async function (userSlug, locationSlug) {
  const User = mongoose.model('User');
  const user = await User.findOne({ slug: userSlug });
  
  if (!user) return null;
  
  return await this.findOne({ userId: user._id, slug: locationSlug });
};

const Location = mongoose.model('Location', locationSchema);

export default Location;