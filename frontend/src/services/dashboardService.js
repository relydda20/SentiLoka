import apiClient from "../utils/apiClient";
import { store } from "../store/store";

/**
 * Get the current logged-in user's ID from Redux store
 */
const getUserId = () => {
  const state = store.getState();
  const user = state.auth.user;
  
  // Backend returns 'id' field, not '_id'
  const userId = user?.id || user?._id;
  
  if (!userId) {
    console.error('❌ No user ID found. User might not be logged in.');
    console.log('🔍 Auth state:', state.auth);
    console.log('🔍 User object:', user);
    throw new Error('User not authenticated');
  }
  
  console.log('👤 Using userId:', userId);
  return userId;
};

/**
 * Fetch all dashboard analytics data
 */
export const fetchDashboardAnalytics = async () => {
  try {
    const userId = getUserId();
    console.log('📊 Fetching analytics for userId:', userId);
    const response = await apiClient.get(`/dashboard/${userId}/analytics`);
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
    const userId = getUserId();
    console.log("🔄 Loading stats for userId:", userId);
    const response = await apiClient.get(`/dashboard/${userId}/stats`);
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
    const userId = getUserId();
    console.log("🔄 Loading sentiment distribution for userId:", userId);
    const response = await apiClient.get(`/dashboard/${userId}/sentiment-distribution`);
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
    const userId = getUserId();
    console.log("🔄 Loading rating distribution for userId:", userId);
    const response = await apiClient.get(`/dashboard/${userId}/rating-distribution`);
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
    const userId = getUserId();
    console.log("🔄 Loading sentiment trends for userId:", userId);
    
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get(`/dashboard/${userId}/sentiment-trends`, { params });
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
    const userId = getUserId();
    console.log("🔄 Loading word cloud data for userId:", userId);
    const response = await apiClient.get(`/dashboard/${userId}/word-cloud`);
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
