import express from "express";
import {
  chatWithBot,
  getAllSummaries,
  searchSummaries,
  getStats,
  createConversation,
  getConversation,
  deleteConversation,
  getAllConversations,
} from "../controllers/chatbot.controller.js";
import { asyncHandler } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/chatbot/chat
 * @desc Chat with bot - Business improvement advisor using sentiment analysis
 * @access Private
 * @body {
 *   message: string,
 *   conversationHistory?: Array<{role: string, content: string}>,
 *   sessionId?: string (optional, for persistent conversation tracking),
 *   locationId?: string (optional, for location-specific analysis and recommendations)
 * }
 * @description Get actionable business insights and improvement recommendations
 */
router.post("/chat", asyncHandler(chatWithBot));

/**
 * @route GET /api/chatbot/summaries
 * @desc Get all summaries with filtering and pagination
 * @access Private
 * @query sentiment? - Filter by sentiment
 * @query limit? - Results per page (default: 50)
 * @query skip? - Results to skip (default: 0)
 * @query sortBy? - Field to sort by (default: 'processedAt')
 * @query order? - Sort order 'asc' or 'desc' (default: 'desc')
 */
router.get("/summaries", asyncHandler(getAllSummaries));

/**
 * @route GET /api/chatbot/summaries/search
 * @desc Search summaries by keyword
 * @access Private
 * @query keyword - Search keyword (required)
 * @query sentiment? - Filter by sentiment
 * @query limit? - Max results (default: 50)
 */
router.get("/summaries/search", asyncHandler(searchSummaries));

/**
 * @route GET /api/chatbot/stats
 * @desc Get chatbot and review statistics
 * @access Private
 */
router.get("/stats", asyncHandler(getStats));

// ===== CONVERSATION MANAGEMENT ROUTES =====

/**
 * @route POST /api/chatbot/conversation/new
 * @desc Create a new conversation session
 * @access Private
 * @returns {sessionId, createdAt}
 */
router.post("/conversation/new", asyncHandler(createConversation));

/**
 * @route GET /api/chatbot/conversations
 * @desc Get all conversation sessions
 * @access Private
 * @query limit? - Results per page (default: 20)
 * @query skip? - Results to skip (default: 0)
 */
router.get("/conversations", asyncHandler(getAllConversations));

/**
 * @route GET /api/chatbot/conversation/:sessionId
 * @desc Get conversation history by sessionId
 * @access Private
 */
router.get("/conversation/:sessionId", asyncHandler(getConversation));

/**
 * @route DELETE /api/chatbot/conversation/:sessionId
 * @desc Delete a conversation by sessionId
 * @access Private
 */
router.delete("/conversation/:sessionId", asyncHandler(deleteConversation));

export default router;
