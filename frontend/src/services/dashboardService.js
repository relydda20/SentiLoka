import apiClient from "../utils/apiClient";

/**
 * Simulate network delay
 * @param {number} ms - Milliseconds to delay
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all dashboard analytics data
 * @returns {Promise} Dashboard data including stats, sentiment distribution, rating distribution, and trends
 */
export const fetchDashboardAnalytics = async () => {
  try {
    // Simulate network delay
    await delay(2000);

    // const response = await apiClient.get('/api/dashboard/analytics');
    // return response.data.data;

    // Mock data for development (remove when API is ready)
    const mockData = {
      stats: {
        totalReviews: 10024,
        totalReviewsChange: 12, // percentage
        averageRating: 6.4,
        averageRatingChange: 8, // percentage
        positiveReviewsPercentage: 96.79,
        totalLocations: 5,
      },
      sentimentDistribution: {
        positive: 7845,
        neutral: 1654,
        negative: 525,
      },
      ratingDistribution: [
        { stars: 1, count: 125 },
        { stars: 2, count: 243 },
        { stars: 3, count: 687 },
        { stars: 4, count: 2458 },
        { stars: 5, count: 6511 },
      ],
      sentimentTrends: {
        positive: [
          { date: "2024-01-01", count: 45 },
          { date: "2024-02-01", count: 52 },
          { date: "2024-03-01", count: 48 },
          { date: "2024-04-01", count: 61 },
          { date: "2024-05-01", count: 55 },
          { date: "2024-06-01", count: 67 },
          { date: "2024-07-01", count: 73 },
          { date: "2024-08-01", count: 69 },
          { date: "2024-09-01", count: 78 },
          { date: "2024-10-01", count: 82 },
        ],
        neutral: [
          { date: "2024-01-01", count: 23 },
          { date: "2024-02-01", count: 28 },
          { date: "2024-03-01", count: 25 },
          { date: "2024-04-01", count: 31 },
          { date: "2024-05-01", count: 27 },
          { date: "2024-06-01", count: 29 },
          { date: "2024-07-01", count: 33 },
          { date: "2024-08-01", count: 30 },
          { date: "2024-09-01", count: 35 },
          { date: "2024-10-01", count: 32 },
        ],
        negative: [
          { date: "2024-01-01", count: 12 },
          { date: "2024-02-01", count: 15 },
          { date: "2024-03-01", count: 11 },
          { date: "2024-04-01", count: 9 },
          { date: "2024-05-01", count: 13 },
          { date: "2024-06-01", count: 8 },
          { date: "2024-07-01", count: 7 },
          { date: "2024-08-01", count: 10 },
          { date: "2024-09-01", count: 6 },
          { date: "2024-10-01", count: 5 },
        ],
      },
    };

    return mockData;
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

/**
 * Fetch only stats data
 * @returns {Promise} Stats object
 */
export const fetchDashboardStats = async () => {
  try {
    // Simulate faster loading for stats (loads first - 800ms)
    console.log("🔄 Loading stats...");
    await delay(800);

    // const response = await apiClient.get('/api/dashboard/stats');
    // return response.data.data;

    console.log("✅ Stats loaded!");
    // Mock data
    return {
      totalReviews: 10024,
      totalReviewsChange: 12,
      averageRating: 6.4,
      averageRatingChange: 8,
      positiveReviewsPercentage: 96.79,
      totalLocations: 5,
    };
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Fetch sentiment distribution data
 * @returns {Promise} Sentiment distribution object
 */
export const fetchSentimentDistribution = async () => {
  try {
    // Simulate medium loading time (1.5s)
    console.log("🔄 Loading sentiment distribution...");
    await delay(1500);

    // const response = await apiClient.get('/api/dashboard/sentiment-distribution');
    // return response.data.data;

    console.log("✅ Sentiment distribution loaded!");
    // Mock data
    return {
      positive: 7845,
      neutral: 1654,
      negative: 525,
    };
  } catch (error) {
    console.error("❌ Error fetching sentiment distribution:", error);
    throw error;
  }
};

/**
 * Fetch rating distribution data
 * @returns {Promise} Array of rating distribution
 */
export const fetchRatingDistribution = async () => {
  try {
    // Simulate medium loading time (1.2s)
    console.log("🔄 Loading rating distribution...");
    await delay(1200);

    // const response = await apiClient.get('/api/dashboard/rating-distribution');
    // return response.data.data;

    console.log("✅ Rating distribution loaded!");
    // Mock data
    return [
      { stars: 1, count: 125 },
      { stars: 2, count: 243 },
      { stars: 3, count: 687 },
      { stars: 4, count: 2458 },
      { stars: 5, count: 6511 },
    ];
  } catch (error) {
    console.error("❌ Error fetching rating distribution:", error);
    throw error;
  }
};

/**
 * Fetch sentiment trends data
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Sentiment trends object
 */
export const fetchSentimentTrends = async (startDate, endDate) => {
  try {
    // Simulate slower loading for trends (loads last - 2.5s)
    console.log("🔄 Loading sentiment trends...");
    await delay(2500);

    // const response = await apiClient.get('/api/dashboard/sentiment-trends', {
    //   params: { startDate, endDate }
    // });
    // return response.data.data;

    console.log("✅ Sentiment trends loaded!");
    // Mock data
    return {
      positive: [
        { date: "2024-01-01", count: 45 },
        { date: "2024-02-01", count: 52 },
        { date: "2024-03-01", count: 48 },
        { date: "2024-04-01", count: 61 },
        { date: "2024-05-01", count: 55 },
        { date: "2024-06-01", count: 67 },
        { date: "2024-07-01", count: 73 },
        { date: "2024-08-01", count: 69 },
        { date: "2024-09-01", count: 78 },
        { date: "2024-10-01", count: 82 },
      ],
      neutral: [
        { date: "2024-01-01", count: 23 },
        { date: "2024-02-01", count: 28 },
        { date: "2024-03-01", count: 25 },
        { date: "2024-04-01", count: 31 },
        { date: "2024-05-01", count: 27 },
        { date: "2024-06-01", count: 29 },
        { date: "2024-07-01", count: 33 },
        { date: "2024-08-01", count: 30 },
        { date: "2024-09-01", count: 35 },
        { date: "2024-10-01", count: 32 },
      ],
      negative: [
        { date: "2024-01-01", count: 12 },
        { date: "2024-02-01", count: 15 },
        { date: "2024-03-01", count: 11 },
        { date: "2024-04-01", count: 9 },
        { date: "2024-05-01", count: 13 },
        { date: "2024-06-01", count: 8 },
        { date: "2024-07-01", count: 7 },
        { date: "2024-08-01", count: 10 },
        { date: "2024-09-01", count: 6 },
        { date: "2024-10-01", count: 5 },
      ],
    };
  } catch (error) {
    console.error("❌ Error fetching sentiment trends:", error);
    throw error;
  }
};
