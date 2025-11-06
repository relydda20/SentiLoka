/**
 * Chatbot Service
 * Handles all chatbot-related API interactions
 */
import apiClient from "../utils/apiClient";

/**
 * Get user's locations for chatbot selector
 * @returns {Promise} Array of locations with readiness status
 */
export const getUserLocations = async () => {
  try {
    console.log("🔄 Fetching user locations for chatbot...");
    const response = await apiClient.get("/chatbot/locations");
    
    // Backend returns: { success, data: { totalLocations, readyCount, notReadyCount, locations } }
    console.log(`✅ Loaded ${response.data.data.locations.length} locations`);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching chatbot locations:", error);
    throw error;
  }
};

/**
 * Send a chat message with attached locations
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User's message
 * @param {string[]} params.locationIds - Array of location IDs (1-10)
 * @param {Array} params.conversationHistory - Previous messages
 * @param {string} params.sessionId - Optional session ID for persistent conversation
 * @returns {Promise} AI response with conversation history
 */
export const sendChatMessage = async ({ 
  message, 
  locationIds, 
  conversationHistory = [], 
  sessionId 
}) => {
  try {
    console.log(`🤖 Sending message with ${locationIds.length} attached location(s)...`);
    
    const response = await apiClient.post("/chatbot/chat", {
      message,
      locationIds,
      conversationHistory,
      sessionId,
    });
    
    // Backend returns: { success, data: { response, conversationHistory, sessionId, attachedLocations, metadata } }
    console.log("✅ Received AI response");
    return response.data.data;
  } catch (error) {
    console.error("❌ Error sending chat message:", error);
    throw error;
  }
};

/**
 * Check if locations are ready for chatbot analysis
 * @param {string[]} locationIds - Array of location IDs to check
 * @returns {Promise} Readiness status for each location
 */
export const checkLocationReadiness = async (locationIds) => {
  try {
    console.log(`🔍 Checking readiness for ${locationIds.length} location(s)...`);
    
    const response = await apiClient.post("/chatbot/check-locations", {
      locationIds,
    });
    
    // Backend returns: { success, data: { totalChecked, readyCount, notReadyCount, locations, summary } }
    console.log(`✅ Ready: ${response.data.data.readyCount}, Not Ready: ${response.data.data.notReadyCount}`);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error checking location readiness:", error);
    throw error;
  }
};

/**
 * Get all user's conversation sessions
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Results per page (default: 20)
 * @param {number} params.skip - Results to skip (default: 0)
 * @returns {Promise} Array of conversation sessions
 */
export const getConversations = async ({ limit = 20, skip = 0 } = {}) => {
  try {
    console.log("🔄 Fetching conversation history...");
    
    const response = await apiClient.get("/chatbot/conversations", {
      params: { limit, skip },
    });
    
    // Backend returns: { success, data: [...conversations], metadata }
    console.log(`✅ Loaded ${response.data.data.length} conversation(s)`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    throw error;
  }
};

/**
 * Get a specific conversation by session ID
 * @param {string} sessionId - Conversation session ID
 * @returns {Promise} Conversation details with messages
 */
export const getConversation = async (sessionId) => {
  try {
    console.log(`🔄 Fetching conversation: ${sessionId}`);
    
    const response = await apiClient.get(`/chatbot/conversation/${sessionId}`);
    
    // Backend returns: { success, data: { sessionId, messages, lastActivity, metadata, attachedLocations } }
    console.log("✅ Conversation loaded");
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    throw error;
  }
};

/**
 * Delete a conversation by session ID
 * @param {string} sessionId - Conversation session ID to delete
 * @returns {Promise} Success message
 */
export const deleteConversation = async (sessionId) => {
  try {
    console.log(`🗑️ Deleting conversation: ${sessionId}`);
    
    const response = await apiClient.delete(`/chatbot/conversation/${sessionId}`);
    
    console.log("✅ Conversation deleted");
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    throw error;
  }
};

/**
 * Compare two locations and analyze differences
 * @param {Object} params - Comparison parameters
 * @param {string} params.locationId1 - First location ID
 * @param {string} params.locationId2 - Second location ID
 * @param {string} params.message - Optional specific question
 * @param {string} params.perspective - Optional comparison perspective
 * @param {Array} params.conversationHistory - Previous messages
 * @param {string} params.sessionId - Optional session ID
 * @returns {Promise} Comparative analysis response
 */
export const compareLocations = async ({
  locationId1,
  locationId2,
  message,
  perspective,
  conversationHistory = [],
  sessionId,
}) => {
  try {
    console.log(`🔍 Comparing locations: ${locationId1} vs ${locationId2}`);
    
    const response = await apiClient.post("/chatbot/compare-locations", {
      locationId1,
      locationId2,
      message,
      perspective,
      conversationHistory,
      sessionId,
    });
    
    console.log("✅ Comparison analysis received");
    return response.data.data;
  } catch (error) {
    console.error("❌ Error comparing locations:", error);
    throw error;
  }
};
