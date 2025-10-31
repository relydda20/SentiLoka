import Location from '../models/Location.model.js';
import Review from '../models/Review.model.js';
import User from '../models/User.model.js';

const dashboardController = {
  // Get all dashboard analytics data (combined)
  getDashboardAnalytics: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user's locations
      const locations = await Location.find({ userId, status: 'active' });
      const locationIds = locations.map(loc => loc._id);

      // Get all reviews for user's locations
      const reviews = await Review.find({ locationId: { $in: locationIds } });

      // Calculate stats
      const totalReviews = reviews.length;
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      // Sentiment distribution
      const sentimentDistribution = {
        positive: reviews.filter(r => r.sentiment === 'positive').length,
        neutral: reviews.filter(r => r.sentiment === 'neutral').length,
        negative: reviews.filter(r => r.sentiment === 'negative').length
      };

      const positivePercentage = totalReviews > 0 
        ? (sentimentDistribution.positive / totalReviews * 100).toFixed(2) 
        : 0;

      // Rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map(stars => ({
        stars,
        count: reviews.filter(r => r.rating === stars).length
      }));

      // Sentiment trends (last 10 months)
      const now = new Date();
      const monthsAgo = new Date(now.getFullYear(), now.getMonth() - 9, 1);
      
      const sentimentTrends = {
        positive: [],
        neutral: [],
        negative: []
      };

      for (let i = 0; i < 10; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (9 - i), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - (9 - i) + 1, 0);
        
        const monthReviews = reviews.filter(r => {
          const publishDate = new Date(r.publishedAt);
          return publishDate >= monthStart && publishDate <= monthEnd;
        });

        const dateStr = monthStart.toISOString().split('T')[0];
        
        sentimentTrends.positive.push({
          date: dateStr,
          count: monthReviews.filter(r => r.sentiment === 'positive').length
        });
        
        sentimentTrends.neutral.push({
          date: dateStr,
          count: monthReviews.filter(r => r.sentiment === 'neutral').length
        });
        
        sentimentTrends.negative.push({
          date: dateStr,
          count: monthReviews.filter(r => r.sentiment === 'negative').length
        });
      }

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalReviews,
            totalReviewsChange: 0, // Calculate based on previous period if needed
            averageRating: parseFloat(averageRating.toFixed(2)),
            averageRatingChange: 0, // Calculate based on previous period if needed
            positiveReviewsPercentage: parseFloat(positivePercentage),
            totalLocations: locations.length
          },
          sentimentDistribution,
          ratingDistribution,
          sentimentTrends
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get dashboard stats only
  getDashboardStats: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const locations = await Location.find({ userId, status: 'active' });
      const locationIds = locations.map(loc => loc._id);
      const reviews = await Review.find({ locationId: { $in: locationIds } });

      const totalReviews = reviews.length;
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
      const positivePercentage = totalReviews > 0 
        ? (positiveCount / totalReviews * 100).toFixed(2) 
        : 0;

      res.status(200).json({
        success: true,
        data: {
          totalReviews,
          totalReviewsChange: 0,
          averageRating: parseFloat(averageRating.toFixed(2)),
          averageRatingChange: 0,
          positiveReviewsPercentage: parseFloat(positivePercentage),
          totalLocations: locations.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get sentiment distribution
  getSentimentDistribution: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const locations = await Location.find({ userId, status: 'active' });
      const locationIds = locations.map(loc => loc._id);
      const reviews = await Review.find({ locationId: { $in: locationIds } });

      const sentimentDistribution = {
        positive: reviews.filter(r => r.sentiment === 'positive').length,
        neutral: reviews.filter(r => r.sentiment === 'neutral').length,
        negative: reviews.filter(r => r.sentiment === 'negative').length
      };

      res.status(200).json({
        success: true,
        data: sentimentDistribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get rating distribution
  getRatingDistribution: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const locations = await Location.find({ userId, status: 'active' });
      const locationIds = locations.map(loc => loc._id);
      const reviews = await Review.find({ locationId: { $in: locationIds } });

      const ratingDistribution = [1, 2, 3, 4, 5].map(stars => ({
        stars,
        count: reviews.filter(r => r.rating === stars).length
      }));

      res.status(200).json({
        success: true,
        data: ratingDistribution
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get sentiment trends
  getSentimentTrends: async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const locations = await Location.find({ userId, status: 'active' });
      const locationIds = locations.map(loc => loc._id);
      const reviews = await Review.find({ locationId: { $in: locationIds } });

      // Default to last 10 months if no date range provided
      const now = new Date();
      const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 9, 1);
      const end = endDate ? new Date(endDate) : now;

      const sentimentTrends = {
        positive: [],
        neutral: [],
        negative: []
      };

      // Calculate number of months
      const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                         (end.getMonth() - start.getMonth()) + 1;

      for (let i = 0; i < monthsDiff; i++) {
        const monthStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
        
        const monthReviews = reviews.filter(r => {
          const publishDate = new Date(r.publishedAt);
          return publishDate >= monthStart && publishDate <= monthEnd;
        });

        const dateStr = monthStart.toISOString().split('T')[0];
        
        sentimentTrends.positive.push({
          date: dateStr,
          count: monthReviews.filter(r => r.sentiment === 'positive').length
        });
        
        sentimentTrends.neutral.push({
          date: dateStr,
          count: monthReviews.filter(r => r.sentiment === 'neutral').length
        });
        
        sentimentTrends.negative.push({
          date: dateStr,
          count: monthReviews.filter(r => r.sentiment === 'negative').length
        });
      }

      res.status(200).json({
        success: true,
        data: sentimentTrends
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get word cloud data
  getWordCloudData: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const locations = await Location.find({ userId, status: 'active' });
      const locationIds = locations.map(loc => loc._id);
      const reviews = await Review.find({ locationId: { $in: locationIds } });

      // Aggregate keywords from all reviews
      const wordFrequency = {};

      reviews.forEach(review => {
        // Positive keywords
        if (review.keywords && review.keywords.positive) {
          review.keywords.positive.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
        }
        // Negative keywords
        if (review.keywords && review.keywords.negative) {
          review.keywords.negative.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
        }
      });

      // Convert to array and sort by frequency
      const wordCloudData = Object.entries(wordFrequency)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50); // Top 50 words

      res.status(200).json({
        success: true,
        data: wordCloudData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

export default dashboardController;
