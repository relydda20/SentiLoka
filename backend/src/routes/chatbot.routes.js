import express from "express";
import {
  chatWithBot,
  compareLocations,
  getConversation,
  deleteConversation,
  getAllConversations,
  checkLocationReadiness,
  getUserLocations,
} from "../controllers/chatbot.controller.js";
import { asyncHandler } from "../middleware/validation.middleware.js";
import { 
  chatbotRateLimiter, 
  locationCheckRateLimiter,
  readRateLimiter,
  strictRateLimiter,
} from "../middleware/rate-limiter.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ===== LOCATION MANAGEMENT ROUTES (NEW) =====

/**
 * @route POST /api/chatbot/check-locations
 * @desc Check if locations are ready for chatbot analysis
 * @access Private
 * @rateLimit 50 requests per minute
 * @body {
 *   locationIds: string[] (required - array of location IDs to check)
 * }
 * @returns {
 *   summary: { total, ready, notReady, canProceed },
 *   locations: Array of location status objects,
 *   readyLocations: Array of ready locations,
 *   notReadyLocations: Array of locations needing action
 * }
 */
router.post(
  "/check-locations",
  locationCheckRateLimiter,
  asyncHandler(checkLocationReadiness)
);

/**
 * @route GET /api/chatbot/locations
 * @desc Get user's locations for chatbot selector
 * @access Private
 * @rateLimit 100 requests per minute
 * @returns Array of user's locations with basic info (id, name, reviewCount, analyzedCount)
 */
router.get(
  "/locations",
  readRateLimiter,
  asyncHandler(getUserLocations)
);

// ===== CHAT ROUTES =====

/**
 * @route POST /api/chatbot/chat
 * @desc Chat with bot - Analyzes attached locations' reviews
 * @access Private
 * @rateLimit 10 messages per minute
 * @body {
 *   message: string (required),
 *   locationIds: string[] (required - must attach 1-10 locations),
 *   conversationHistory?: Array<{role: string, content: string}>,
 *   sessionId?: string (optional, for persistent conversation tracking)
 * }
 */
router.post(
  "/chat",
  chatbotRateLimiter,
  asyncHandler(chatWithBot)
);

/**
 * @route POST /api/chatbot/compare-locations
 * @desc Compare two locations and analyze why one is more successful than the other
 * @access Private
 * @rateLimit 5 comparisons per minute (expensive AI operation)
 * @body {
 *   locationId1: string (required),
 *   locationId2: string (required),
 *   perspective?: string (optional - locationId to analyze from, defaults to locationId1),
 *   sessionId?: string (optional, for persistent conversation tracking)
 * }
 */
router.post(
  "/compare-locations",
  strictRateLimiter,
  asyncHandler(compareLocations)
);

// ===== CONVERSATION MANAGEMENT ROUTES =====

/**
 * @route GET /api/chatbot/conversations
 * @desc Get all user's conversation sessions
 * @access Private
 * @rateLimit 100 requests per minute
 * @query limit? - Results per page (default: 20)
 * @query skip? - Results to skip (default: 0)
 */
router.get(
  "/conversations",
  readRateLimiter,
  asyncHandler(getAllConversations)
);

/**
 * @route GET /api/chatbot/conversation/:sessionId
 * @desc Get user's conversation history by sessionId
 * @access Private
 * @rateLimit 100 requests per minute
 */
router.get(
  "/conversation/:sessionId",
  readRateLimiter,
  asyncHandler(getConversation)
);

/**
 * @route DELETE /api/chatbot/conversation/:sessionId
 * @desc Delete user's conversation by sessionId
 * @access Private
 * @rateLimit 100 requests per minute
 */
router.delete(
  "/conversation/:sessionId",
  readRateLimiter,
  asyncHandler(deleteConversation)
);

export default router;
