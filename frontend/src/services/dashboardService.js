import apiClient from "../utils/apiClient";

// Default userId for testing (before authentication is implemented)
const DEFAULT_USER_ID = "69081cb0e7a17424481a156f";

/**
 * Helper function to ensure userId is a string
 */
const getUserId = (userId) => {
  // If userId is undefined or null, use default
  if (!userId) return DEFAULT_USER_ID;
  
  // If userId is an object, extract the id property or use default
  if (typeof userId === 'object') {
    console.warn('⚠️ userId should be a string, received object:', userId);
    return userId.id || userId._id || DEFAULT_USER_ID;
  }
  
  // Return the string userId
  return String(userId);
};

/**
 * Fetch all dashboard analytics data
 */
export const fetchDashboardAnalytics = async (userId) => {
  try {
    const validUserId = getUserId(userId);
    console.log('📊 Fetching analytics for userId:', validUserId);
    const response = await apiClient.get(`/api/dashboard/${validUserId}/analytics`);
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

/**
 * Fetch only stats data
 */
export const fetchDashboardStats = async (userId) => {
  try {
    const validUserId = getUserId(userId);
    console.log("🔄 Loading stats for userId:", validUserId);
    const response = await apiClient.get(`/api/dashboard/${validUserId}/stats`);
    console.log("✅ Stats loaded!");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Fetch sentiment distribution data
 */
export const fetchSentimentDistribution = async (userId) => {
  try {
    const validUserId = getUserId(userId);
    console.log("🔄 Loading sentiment distribution for userId:", validUserId);
    const response = await apiClient.get(`/api/dashboard/${validUserId}/sentiment-distribution`);
    console.log("✅ Sentiment distribution loaded!");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching sentiment distribution:", error);
    throw error;
  }
};

/**
 * Fetch rating distribution data
 */
export const fetchRatingDistribution = async (userId) => {
  try {
    const validUserId = getUserId(userId);
    console.log("🔄 Loading rating distribution for userId:", validUserId);
    const response = await apiClient.get(`/api/dashboard/${validUserId}/rating-distribution`);
    console.log("✅ Rating distribution loaded!");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching rating distribution:", error);
    throw error;
  }
};

/**
 * Fetch sentiment trends data
 */
export const fetchSentimentTrends = async (userId, startDate, endDate) => {
  try {
    const validUserId = getUserId(userId);
    console.log("🔄 Loading sentiment trends for userId:", validUserId);
    
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get(`/api/dashboard/${validUserId}/sentiment-trends`, { params });
    console.log("✅ Sentiment trends loaded!");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching sentiment trends:", error);
    throw error;
  }
};

/**
 * Fetch word cloud data
 */
export const fetchWordCloudData = async (userId) => {
  try {
    const validUserId = getUserId(userId);
    console.log("🔄 Loading word cloud data for userId:", validUserId);
    const response = await apiClient.get(`/api/dashboard/${validUserId}/word-cloud`);
    console.log("✅ Word cloud data loaded!");

    
    // Check if data exists and has the right format
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.warn("⚠️ No word cloud data returned from API");
      return [];
    }
    
    // Verify first item structure
    console.log("📦 First item:", response.data[0]);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching word cloud data:", error);
    throw error;
  }
};
