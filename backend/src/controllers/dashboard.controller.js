import Location from '../models/Location.model.js';
import ReviewSummary from '../models/ReviewSummary.model.js';
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

      console.log('🔍 getDashboardStats called with userId:', userId);

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('✅ User found:', { id: user._id, name: user.name });

      // Get user's locations
      const userLocations = await Location.find({ 
        userId, 
        status: { $ne: 'deleted' } 
      });
      const locationIds = userLocations.map(loc => loc._id);

      console.log('📍 Locations found:', {
        count: userLocations.length,
        locationIds: locationIds.map(id => id.toString())
      });

      const stats = await dashboardController._getStats(userId, locationIds);

      console.log('📊 Stats returned:', stats);

      res.status(200).json(stats);
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
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
      const reviewSummaries = await ReviewSummary.find({ 
        locationId: { $in: locationIds } 
      }).select('sentimentKeywords');

      // Aggregate keywords
      const keywordMap = new Map();

      reviewSummaries.forEach(summary => {
        // Use sentimentKeywords from ReviewSummary
        const allKeywords = summary.sentimentKeywords || [];

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

    // Get current date and calculate 30-day periods
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get all reviews
    const reviews = await ReviewSummary.find({ 
      locationId: { $in: locationIds } 
    });

    // Get previous period reviews (60-30 days ago) - USE publishedAt
    const previousPeriodReviews = await ReviewSummary.find({
      locationId: { $in: locationIds },
      publishedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    console.log('📊 Previous period reviews (60-30 days ago):', {
      count: previousPeriodReviews.length,
      dateRange: { start: sixtyDaysAgo, end: thirtyDaysAgo }
    });

    // Get current period reviews (last 30 days) - USE publishedAt
    const currentPeriodReviews = await ReviewSummary.find({
      locationId: { $in: locationIds },
      publishedAt: { $gte: thirtyDaysAgo }
    });

    console.log('📊 Current period reviews (last 30 days):', {
      count: currentPeriodReviews.length,
      dateRange: { start: thirtyDaysAgo, end: now }
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

    // Handle reviews with or without sentiment analysis
    const positiveReviews = reviews.filter(r => r.sentiment === 'positive').length;
    const positivePercentage = (positiveReviews / totalReviews) * 100;

    // Calculate changes from previous 30-day period
    let totalReviewsChange = 0;
    let averageRatingChange = 0;

    if (previousPeriodReviews.length > 0 && currentPeriodReviews.length > 0) {
      const currentCount = currentPeriodReviews.length;
      const previousCount = previousPeriodReviews.length;
      totalReviewsChange = parseFloat((((currentCount - previousCount) / previousCount) * 100).toFixed(1));

      const previousPeriodAvgRating = previousPeriodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / previousPeriodReviews.length;
      const currentPeriodAvgRating = currentPeriodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / currentPeriodReviews.length;
      
      averageRatingChange = parseFloat((((currentPeriodAvgRating - previousPeriodAvgRating) / previousPeriodAvgRating) * 100).toFixed(1));

      console.log('📊 Period-over-period changes:', {
        previousPeriodAvg: previousPeriodAvgRating.toFixed(4),
        currentPeriodAvg: currentPeriodAvgRating.toFixed(4),
        reviewChange: totalReviewsChange + '%',
        ratingChange: averageRatingChange + '%'
      });
    } else if (previousPeriodReviews.length === 0 && currentPeriodReviews.length > 0) {
      totalReviewsChange = 100;
    } else if (currentPeriodReviews.length === 0) {
      // If current period has no reviews, set change to 0
      totalReviewsChange = 0;
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

    const distribution = await ReviewSummary.aggregate([
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
      // Handle null/undefined sentiment (reviews without sentiment analysis)
      if (!item._id) {
        result.neutral += item.count;
      } else if (['positive', 'neutral', 'negative'].includes(item._id)) {
        result[item._id] = item.count;
      }
    });

    return result;
  },

  _getRatingDistribution: async (locationIds) => {
    if (locationIds.length === 0) {
      return [
        { stars: 1, count: 0, percentage: 0 },
        { stars: 2, count: 0, percentage: 0 },
        { stars: 3, count: 0, percentage: 0 },
        { stars: 4, count: 0, percentage: 0 },
        { stars: 5, count: 0, percentage: 0 }
      ];
    }

    const distribution = await ReviewSummary.aggregate([
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
      count: 0,
      percentage: 0
    }));

    // Calculate total reviews for percentage
    let totalReviews = 0;
    distribution.forEach(item => {
      const rating = Math.round(item._id);
      if (rating >= 1 && rating <= 5) {
        result[rating - 1].count = item.count;
        totalReviews += item.count;
      }
    });

    // Calculate percentages
    if (totalReviews > 0) {
      result.forEach(item => {
        item.percentage = parseFloat(((item.count / totalReviews) * 100).toFixed(2));
      });
    }

    return result;
  },

  _getSentimentTrends: async (locationIds, startDate, endDate) => {
    if (locationIds.length === 0) {
      return { positive: [], neutral: [], negative: [] };
    }

    const matchStage = { locationId: { $in: locationIds } };

    // If no date filter provided, default to last 2 months
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    if (startDate || endDate) {
      matchStage.publishedAt = {};
      if (startDate) matchStage.publishedAt.$gte = new Date(startDate);
      if (endDate) matchStage.publishedAt.$lte = new Date(endDate);
    } else {
      // Default: last 2 months
      matchStage.publishedAt = { $gte: twoMonthsAgo };
    }

    // Get all reviews sorted by publishedAt
    const reviews = await ReviewSummary.find(matchStage)
      .sort({ publishedAt: 1 })
      .select('publishedAt sentiment');

    if (reviews.length === 0) {
      return { positive: [], neutral: [], negative: [] };
    }

    // Group by date and sentiment for DAILY counts (not cumulative)
    const dailyData = {};

    reviews.forEach(review => {
      // Use publishedAt (the actual review publish date)
      const dateField = review.publishedAt;
      if (!dateField) {
        return;
      }

      const date = new Date(dateField);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          positive: 0,
          neutral: 0,
          negative: 0
        };
      }

      const sentiment = review.sentiment;
      // Only count if sentiment is valid
      if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment)) {
        dailyData[dateKey][sentiment]++;
      }
    });

    // Convert to arrays with CUMULATIVE counts
    const result = {
      positive: [],
      neutral: [],
      negative: []
    };

    // Sort dates and build cumulative data
    const sortedDates = Object.keys(dailyData).sort();
    const cumulativeCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    sortedDates.forEach(date => {
      // Add daily counts to cumulative totals
      cumulativeCounts.positive += dailyData[date].positive;
      cumulativeCounts.neutral += dailyData[date].neutral;
      cumulativeCounts.negative += dailyData[date].negative;

      // Push CUMULATIVE values for each sentiment
      result.positive.push({
        date,
        count: cumulativeCounts.positive
      });
      result.neutral.push({
        date,
        count: cumulativeCounts.neutral
      });
      result.negative.push({
        date,
        count: cumulativeCounts.negative
      });
    });

    return result;
  }
};

export default dashboardController;
