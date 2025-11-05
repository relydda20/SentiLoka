import Review from '../models/Review.model.js';
import Location from '../models/Location.model.js';
import { generateReply, regenerateReply } from '../services/replyGenerator.service.js';

const reviewController = {
  // Get all reviews
  getAllReviews: async (req, res) => {
    try {
      const reviews = await Review.find()
        .populate('locationId', 'name address')
        .select('-__v')
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get review by ID
  getReviewById: async (req, res) => {
    try {
      const { reviewId } = req.params;

      const review = await Review.findById(reviewId)
        .populate('locationId', 'name address')
        .select('-__v');

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get reviews by sentiment
  getReviewsBySentiment: async (req, res) => {
    try {
      const { locationId, sentiment } = req.params;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Validate sentiment value
      if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sentiment. Must be: positive, neutral, or negative'
        });
      }

      const reviews = await Review.find({ locationId, sentiment })
        .select('-__v')
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length,
        sentiment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get recent reviews
  getRecentReviews: async (req, res) => {
    try {
      const { locationId } = req.params;
      const { days = 30 } = req.query;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

      const reviews = await Review.find({
        locationId,
        publishedAt: { $gte: dateThreshold }
      })
        .select('-__v')
        .sort({ publishedAt: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length,
        days: parseInt(days)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Add new review
  addReview: async (req, res) => {
    try {
      const { locationId } = req.params;
      const {
        googleReviewId,
        author,
        rating,
        text,
        publishedAt,
        sourceUrl,
        likes,
        sentiment,
        sentimentScore,
        sentimentBreakdown,
        keywords,
        topics,
        analyzedAt
      } = req.body;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({ googleReviewId });
      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'Review with this Google Review ID already exists'
        });
      }

      const newReview = new Review({
        locationId,
        googleReviewId,
        author,
        rating,
        text,
        publishedAt,
        sourceUrl: sourceUrl || '',
        likes: likes || 0,
        sentiment,
        sentimentScore,
        sentimentBreakdown: sentimentBreakdown || {},
        keywords: keywords || { positive: [], negative: [] },
        topics: topics || [],
        analyzedAt: analyzedAt || new Date()
      });

      await newReview.save();

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: newReview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Edit review
  editReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const updateData = req.body;

      // Fields that cannot be updated
      const restrictedFields = ['locationId', 'googleReviewId', 'scrapedAt'];
      restrictedFields.forEach(field => delete updateData[field]);

      const review = await Review.findByIdAndUpdate(
        reviewId,
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete review
  deleteReview: async (req, res) => {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndDelete(reviewId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get sentiment statistics for a location
  getSentimentStats: async (req, res) => {
    try {
      const { locationId } = req.params;

      // Verify location exists
      const locationExists = await Location.findById(locationId);
      if (!locationExists) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      const stats = await Review.aggregate([
        { $match: { locationId: locationId } },
        {
          $group: {
            _id: '$sentiment',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            avgScore: { $avg: '$sentimentScore' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: stats,
        locationId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Generate AI-powered reply for a review
  generateAIReply: async (req, res) => {
    try {
      const { reviewText, rating, sentiment, tone, style, length } = req.body;

      // Validate required fields
      if (!reviewText || rating === undefined || !sentiment) {
        return res.status(400).json({
          success: false,
          message: 'reviewText, rating, and sentiment are required fields'
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Validate sentiment value
      if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          message: 'Sentiment must be: positive, neutral, or negative'
        });
      }

      // Generate the reply
      const reply = await generateReply({
        reviewText,
        rating,
        sentiment,
        tone: tone || 'Professional',
        style: style || 'Formal',
        length: length || 'Medium'
      });

      res.status(200).json({
        success: true,
        reply: reply,
        parameters: {
          tone: tone || 'Professional',
          style: style || 'Formal',
          length: length || 'Medium'
        }
      });
    } catch (error) {
      console.error('Error in generateAIReply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate AI reply'
      });
    }
  },

  // Regenerate AI-powered reply for a review
  regenerateAIReply: async (req, res) => {
    try {
      const { reviewText, rating, sentiment, previousReply, tone, style, length } = req.body;

      // Validate required fields
      if (!reviewText || rating === undefined || !sentiment) {
        return res.status(400).json({
          success: false,
          message: 'reviewText, rating, and sentiment are required fields'
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Validate sentiment value
      if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          message: 'Sentiment must be: positive, neutral, or negative'
        });
      }

      // Regenerate the reply
      const reply = await regenerateReply({
        reviewText,
        rating,
        sentiment,
        previousReply: previousReply || null,
        tone: tone || 'Professional',
        style: style || 'Formal',
        length: length || 'Medium'
      });

      res.status(200).json({
        success: true,
        reply: reply,
        parameters: {
          tone: tone || 'Professional',
          style: style || 'Formal',
          length: length || 'Medium'
        }
      });
    } catch (error) {
      console.error('Error in regenerateAIReply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to regenerate AI reply'
      });
    }
  }
};

export default reviewController;
