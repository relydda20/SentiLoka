import express from "express";
import {
  chatWithBot,
  getCompanySummary,
  getCompanySummaryBySentiment,
  getRecentSummary,
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
 *   company?: string,
 *   conversationHistory?: Array<{role: string, content: string}>
 * }
 */
router.post("/chat", asyncHandler(chatWithBot));

/**
 * @route GET /api/chatbot/summary/:company
 * @desc Get aggregated summary for a specific company
 * @access Public
 * @params company - Company name
 * @query sentiment? - Filter by sentiment
 * @query limit? - Number of reviews to aggregate (default: 100)
 */
router.get("/summary/:company", asyncHandler(getCompanySummary));

/**
 * @route GET /api/chatbot/summary/:company/sentiment/:sentiment
 * @desc Get aggregated summary for a company filtered by sentiment
 * @access Public
 * @params company - Company name
 * @params sentiment - 'positive', 'negative', or 'neutral'
 */
router.get(
  "/summary/:company/sentiment/:sentiment",
  asyncHandler(getCompanySummaryBySentiment)
);

/**
 * @route GET /api/chatbot/summary/recent
 * @desc Get aggregated summary of recent reviews
 * @access Public
 * @query limit? - Number of recent reviews (default: 50)
 */
router.get("/summary/recent", asyncHandler(getRecentSummary));

/**
 * @route GET /api/chatbot/summaries
 * @desc Get all summaries with filtering and pagination
 * @access Public
 * @query company? - Filter by company
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
 * @query company? - Filter by company
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
