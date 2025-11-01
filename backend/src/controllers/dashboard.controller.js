import Location from '../models/Location.model.js';
import Review from '../models/Review.model.js';
import User from '../models/User.model.js';

const dashboardController = {
  // Get all analytics data in one call
  getDashboardAnalytics: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's locations
      const userLocations = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      });
      const locationIds = userLocations.map(loc => loc._id);

      // Get all data in parallel
      const [stats, sentimentDistribution, ratingDistribution, sentimentTrends] = await Promise.all([
        dashboardController._getStats(userId, locationIds),
        dashboardController._getSentimentDistribution(locationIds),
        dashboardController._getRatingDistribution(locationIds),
        dashboardController._getSentimentTrends(locationIds)
      ]);

      res.status(200).json({
        stats,
        sentimentDistribution,
        ratingDistribution,
        sentimentTrends
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard analytics', error: error.message });
    }
  },

  // Get dashboard summary statistics
  getDashboardStats: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's locations
      const userLocations = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      });
      const locationIds = userLocations.map(loc => loc._id);

      const stats = await dashboardController._getStats(userId, locationIds);

      res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
    }
  },

  // Get sentiment distribution
  getSentimentDistribution: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's locations
      const locationIds = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      }).distinct('_id');

      const distribution = await dashboardController._getSentimentDistribution(locationIds);

      res.status(200).json(distribution);
    } catch (error) {
      console.error('Error fetching sentiment distribution:', error);
      res.status(500).json({ message: 'Failed to fetch sentiment distribution', error: error.message });
    }
  },

  // Get rating distribution
  getRatingDistribution: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's locations
      const locationIds = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      }).distinct('_id');

      const distribution = await dashboardController._getRatingDistribution(locationIds);

      res.status(200).json(distribution);
    } catch (error) {
      console.error('Error fetching rating distribution:', error);
      res.status(500).json({ message: 'Failed to fetch rating distribution', error: error.message });
    }
  },

  // Get sentiment trends over time
  getSentimentTrends: async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's locations
      const locationIds = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      }).distinct('_id');

      const trends = await dashboardController._getSentimentTrends(locationIds, startDate, endDate);

      res.status(200).json(trends);
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      res.status(500).json({ message: 'Failed to fetch sentiment trends', error: error.message });
    }
  },

  // Get word cloud data (keyword frequency)
  getWordCloudData: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's locations
      const locationIds = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      }).distinct('_id');

      if (locationIds.length === 0) {
        return res.status(200).json([]);
      }

      // Get all reviews for user's locations
      const reviews = await Review.find({ 
        locationId: { $in: locationIds } 
      }).select('keywords');

      // Aggregate keywords
      const keywordMap = new Map();

      reviews.forEach(review => {
        // Combine positive and negative keywords
        const allKeywords = [
          ...(review.keywords?.positive || []),
          ...(review.keywords?.negative || [])
        ];

        allKeywords.forEach(keyword => {
          const normalizedKeyword = keyword.toLowerCase().trim();
          if (normalizedKeyword) {
            keywordMap.set(
              normalizedKeyword,
              (keywordMap.get(normalizedKeyword) || 0) + 1
            );
          }
        });
      });

      // Convert to array format expected by word cloud
      const wordCloudData = Array.from(keywordMap.entries())
        .map(([text, value]) => ({ 
          text,
          value
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 100);

      res.status(200).json(wordCloudData);
    } catch (error) {
      console.error('Error fetching word cloud data:', error);
      res.status(500).json({ message: 'Failed to fetch word cloud data', error: error.message });
    }
  },

  // Helper methods (internal use only)
  _getStats: async (userId, locationIds) => {
    const totalLocations = locationIds.length;

    if (totalLocations === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        positivePercentage: 0,
        totalLocations: 0,
        totalReviewsChange: 0,
        averageRatingChange: 0
      };
    }

    // Get current date and last month's date
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all reviews
    const reviews = await Review.find({ 
      locationId: { $in: locationIds } 
    });

    // Get last month's reviews
    const lastMonthReviews = await Review.find({
      locationId: { $in: locationIds },
      publishedAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Get current month's reviews
    const currentMonthReviews = await Review.find({
      locationId: { $in: locationIds },
      publishedAt: { $gte: currentMonthStart }
    });

    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        positivePercentage: 0,
        totalLocations,
        totalReviewsChange: 0,
        averageRatingChange: 0
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / totalReviews;

    const positiveReviews = reviews.filter(r => r.sentiment === 'positive').length;
    const positivePercentage = (positiveReviews / totalReviews) * 100;

    // Calculate changes from last month
    let totalReviewsChange = 0;
    let averageRatingChange = 0;

    if (lastMonthReviews.length > 0) {
      const currentCount = currentMonthReviews.length;
      const lastCount = lastMonthReviews.length;
      totalReviewsChange = lastCount > 0 
        ? parseFloat((((currentCount - lastCount) / lastCount) * 100).toFixed(1))
        : 0;

      const lastMonthAvgRating = lastMonthReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / lastMonthReviews.length;
      const currentMonthAvgRating = currentMonthReviews.length > 0
        ? currentMonthReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / currentMonthReviews.length
        : averageRating;
      
      averageRatingChange = lastMonthAvgRating > 0
        ? parseFloat((((currentMonthAvgRating - lastMonthAvgRating) / lastMonthAvgRating) * 100).toFixed(1))
        : 0;
    }

    return {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(2)),
      positiveReviewsPercentage: parseFloat(positivePercentage.toFixed(2)),
      totalLocations,
      totalReviewsChange,
      averageRatingChange
    };
  },

  _getSentimentDistribution: async (locationIds) => {
    if (locationIds.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    const distribution = await Review.aggregate([
      { $match: { locationId: { $in: locationIds } } },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = { positive: 0, neutral: 0, negative: 0 };
    distribution.forEach(item => {
      if (item._id && ['positive', 'neutral', 'negative'].includes(item._id)) {
        result[item._id] = item.count;
      }
    });

    return result;
  },

  _getRatingDistribution: async (locationIds) => {
    if (locationIds.length === 0) {
      return [
        { stars: 1, count: 0 },
        { stars: 2, count: 0 },
        { stars: 3, count: 0 },
        { stars: 4, count: 0 },
        { stars: 5, count: 0 }
      ];
    }

    const distribution = await Review.aggregate([
      { $match: { locationId: { $in: locationIds } } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Initialize all ratings 1-5
    const result = Array.from({ length: 5 }, (_, i) => ({
      stars: i + 1,
      count: 0
    }));

    distribution.forEach(item => {
      const rating = Math.round(item._id);
      if (rating >= 1 && rating <= 5) {
        result[rating - 1].count = item.count;
      }
    });

    return result;
  },

  _getSentimentTrends: async (locationIds, startDate, endDate) => {
    if (locationIds.length === 0) {
      return { positive: [], neutral: [], negative: [] };
    }

    const matchStage = { locationId: { $in: locationIds } };

    // Add date filter if provided
    if (startDate || endDate) {
      matchStage.publishedAt = {};
      if (startDate) matchStage.publishedAt.$gte = new Date(startDate);
      if (endDate) matchStage.publishedAt.$lte = new Date(endDate);
    }

    const trends = await Review.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            sentiment: '$sentiment'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Group by sentiment
    const result = {
      positive: [],
      neutral: [],
      negative: []
    };

    trends.forEach(item => {
      const date = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-01`;
      const sentiment = item._id.sentiment;

      if (sentiment && result[sentiment]) {
        result[sentiment].push({
          date,
          count: item.count
        });
      }
    });

    return result;
  }
};

export default dashboardController;
