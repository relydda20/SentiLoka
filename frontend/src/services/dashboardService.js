import apiClient from "../utils/apiClient";

// Hardcoded userId for testing/development - matches the actual user in MongoDB
const HARDCODED_USER_ID = "6908769c3a6ec4b0e9a421ee";

/**
 * Fetch all dashboard analytics data
 */
export const fetchDashboardAnalytics = async () => {
  try {
    console.log('📊 Fetching analytics for userId:', HARDCODED_USER_ID);
    const response = await apiClient.get(`/dashboard/${HARDCODED_USER_ID}/analytics`);
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

/**
 * Fetch only stats data
 */
export const fetchDashboardStats = async () => {
  try {
    console.log("🔄 Loading stats for userId:", HARDCODED_USER_ID);
    const response = await apiClient.get(`/dashboard/${HARDCODED_USER_ID}/stats`);
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
export const fetchSentimentDistribution = async () => {
  try {
    console.log("🔄 Loading sentiment distribution for userId:", HARDCODED_USER_ID);
    const response = await apiClient.get(`/dashboard/${HARDCODED_USER_ID}/sentiment-distribution`);
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
export const fetchRatingDistribution = async () => {
  try {
    console.log("🔄 Loading rating distribution for userId:", HARDCODED_USER_ID);
    const response = await apiClient.get(`/dashboard/${HARDCODED_USER_ID}/rating-distribution`);
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
export const fetchSentimentTrends = async (startDate, endDate) => {
  try {
    console.log("🔄 Loading sentiment trends for userId:", HARDCODED_USER_ID);
    
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get(`/dashboard/${HARDCODED_USER_ID}/sentiment-trends`, { params });
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
export const fetchWordCloudData = async () => {
  try {
    console.log("🔄 Loading word cloud data for userId:", HARDCODED_USER_ID);
    const response = await apiClient.get(`/dashboard/${HARDCODED_USER_ID}/word-cloud`);
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
