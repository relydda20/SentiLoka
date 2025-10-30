import express from "express";
import {
  chatWithBot,
  getAllSummaries,
  searchSummaries,
  getStats,
} from "../controllers/chatbot.controller.js";
import { asyncHandler } from "../middleware/validation.middleware.js";

const router = express.Router();

/**
 * @route POST /api/chatbot/chat
 * @desc Chat with bot - Analyzes ALL summaries, ratings, and sentiments from database
 * @access Public
 * @body {
 *   message: string,
 *   conversationHistory?: Array<{role: string, content: string}>
 * }
 */
router.post("/chat", asyncHandler(chatWithBot));

/**
 * @route GET /api/chatbot/summaries
 * @desc Get all summaries with filtering and pagination
 * @access Public
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
 * @access Public
 * @query keyword - Search keyword (required)
 * @query sentiment? - Filter by sentiment
 * @query limit? - Max results (default: 50)
 */
router.get("/summaries/search", asyncHandler(searchSummaries));

/**
 * @route GET /api/chatbot/stats
 * @desc Get chatbot and review statistics
 * @access Public
 */
router.get("/stats", asyncHandler(getStats));

export default router;
