import { OpenAI } from "openai";
import { CONFIG } from "../config/sentiment-analysis-config.js";
import ReviewSummary from "../models/ReviewSummary.model.js";
import {
  getAggregatedSummaryForCompany,
  getAggregatedSummaryBySentiment,
  getRecentAggregatedSummary,
} from "../utils/summaryAggregator.js";

const openaiClient = new OpenAI({
  baseURL: CONFIG.GPT4O_MINI_BASE_URL,
  apiKey: CONFIG.GPT4O_MINI_API_KEY,
});

/**
 * Chat with bot using review summaries as context
 * @route POST /api/chatbot/chat
 */
export const chatWithBot = async (req, res) => {
  try {
    const {
      message,
      company = null,
      sentiment = null,
      conversationHistory = [],
    } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // Determine which summaries to retrieve based on query
    let context = "";
    let summaries = [];

    // Check if user is asking about a specific company
    if (company) {
      // Get aggregated summary for specific company
      const aggregated = await getAggregatedSummaryForCompany(company, {
        sentiment,
        limit: 50,
      });

      context = `Review Summary for ${company}:\n${aggregated.aggregatedSummary}\n\nStatistics:\n- Total Reviews: ${aggregated.statistics.totalReviews}\n- Sentiment Distribution: Positive ${aggregated.statistics.sentimentDistribution.positive}, Negative ${aggregated.statistics.sentimentDistribution.negative}, Neutral ${aggregated.statistics.sentimentDistribution.neutral}\n- Average Rating: ${aggregated.statistics.averageRating}/5\n- Average Sentiment Score: ${aggregated.statistics.averageSentimentScore}`;

      summaries = [aggregated.aggregatedSummary];
    } else {
      // Get recent reviews across all companies
      const query = { sentiment: { $ne: "error" } };
      if (sentiment) {
        query.sentiment = sentiment;
      }

      const recentReviews = await ReviewSummary.find(query)
        .sort({ processedAt: -1 })
        .limit(20)
        .select("summary company sentiment rating author");

      if (recentReviews.length > 0) {
        summaries = recentReviews.map((r) => r.summary);
        context = `Recent Review Summaries (${recentReviews.length} reviews):\n\n${recentReviews
          .map(
            (r, i) =>
              `${i + 1}. [${r.company}] ${r.author} (${r.rating}★, ${r.sentiment}): ${r.summary}`
          )
          .join("\n\n")}`;
      } else {
        context = "No reviews available in the database yet.";
      }
    }

    // Build conversation messages
    const messages = [
      {
        role: "system",
        content: `You are a helpful customer service chatbot that provides insights about customer reviews.

You have access to review summaries from various customers. Use this context to answer user questions:

${context}

Guidelines:
- Provide helpful, accurate information based on the review summaries
- If asked about specific aspects (pricing, service, quality, etc.), reference relevant parts of the summaries
- Be conversational and friendly
- If you don't have enough information to answer, say so honestly
- Suggest what other information might be helpful
- Focus on actionable insights and patterns from the reviews
- When discussing sentiment, be balanced and nuanced`,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role || "user",
          content: msg.content || msg.message,
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Get response from AI
    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const botReply = response.choices[0].message.content;

    return res.status(200).json({
      success: true,
      message: "Chat response generated successfully",
      data: {
        botReply,
        context: {
          company: company || "all",
          sentiment: sentiment || "all",
          reviewsUsed: summaries.length,
        },
      },
    });
  } catch (error) {
    console.error("Error in chatWithBot:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to generate chat response",
      details: error.message,
    });
  }
};

/**
 * Get aggregated summary for a company
 * @route GET /api/chatbot/summary/:company
 */
export const getCompanySummary = async (req, res) => {
  try {
    const { company } = req.params;
    const { sentiment, limit } = req.query;

    if (!company) {
      return res.status(400).json({
        success: false,
        error: "Company name is required",
      });
    }

    const options = {
      sentiment: sentiment || null,
      limit: limit ? parseInt(limit) : 100,
      focus: sentiment || "overall",
    };

    const aggregated = await getAggregatedSummaryForCompany(company, options);

    return res.status(200).json({
      success: true,
      message: "Aggregated summary retrieved successfully",
      data: aggregated,
    });
  } catch (error) {
    console.error("Error in getCompanySummary:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to get company summary",
      details: error.message,
    });
  }
};

/**
 * Get aggregated summary by sentiment
 * @route GET /api/chatbot/summary/:company/sentiment/:sentiment
 */
export const getCompanySummaryBySentiment = async (req, res) => {
  try {
    const { company, sentiment } = req.params;

    if (!company || !sentiment) {
      return res.status(400).json({
        success: false,
        error: "Company name and sentiment are required",
      });
    }

    if (!["positive", "negative", "neutral"].includes(sentiment)) {
      return res.status(400).json({
        success: false,
        error: "Sentiment must be 'positive', 'negative', or 'neutral'",
      });
    }

    const aggregated = await getAggregatedSummaryBySentiment(company, sentiment);

    return res.status(200).json({
      success: true,
      message: `${sentiment} review summary retrieved successfully`,
      data: aggregated,
    });
  } catch (error) {
    console.error("Error in getCompanySummaryBySentiment:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to get sentiment-specific summary",
      details: error.message,
    });
  }
};

/**
 * Get recent aggregated summary
 * @route GET /api/chatbot/summary/recent
 */
export const getRecentSummary = async (req, res) => {
  try {
    const { limit } = req.query;

    const aggregated = await getRecentAggregatedSummary(
      limit ? parseInt(limit) : 50
    );

    return res.status(200).json({
      success: true,
      message: "Recent aggregated summary retrieved successfully",
      data: aggregated,
    });
  } catch (error) {
    console.error("Error in getRecentSummary:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to get recent summary",
      details: error.message,
    });
  }
};

/**
 * Get all summaries from database
 * @route GET /api/chatbot/summaries
 */
export const getAllSummaries = async (req, res) => {
  try {
    const {
      company,
      sentiment,
      limit = 50,
      skip = 0,
      sortBy = "processedAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = { sentiment: { $ne: "error" } };
    if (company) {
      query.company = company;
    }
    if (sentiment) {
      query.sentiment = sentiment;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = order === "desc" ? -1 : 1;

    const summaries = await ReviewSummary.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select("author rating sentiment sentimentScore summary company processedAt sentimentKeywords contextualTopics");

    const total = await ReviewSummary.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Summaries retrieved successfully",
      data: summaries,
      metadata: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        returned: summaries.length,
      },
    });
  } catch (error) {
    console.error("Error in getAllSummaries:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve summaries",
      details: error.message,
    });
  }
};

/**
 * Search summaries by keyword
 * @route GET /api/chatbot/summaries/search
 */
export const searchSummaries = async (req, res) => {
  try {
    const { keyword, company, sentiment, limit = 50 } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: "Keyword is required for search",
      });
    }

    // Build query
    const query = {
      sentiment: { $ne: "error" },
      $or: [
        { summary: { $regex: keyword, $options: "i" } },
        { sentimentKeywords: { $regex: keyword, $options: "i" } },
        { contextualTopics: { $regex: keyword, $options: "i" } },
      ],
    };

    if (company) {
      query.company = company;
    }
    if (sentiment) {
      query.sentiment = sentiment;
    }

    const summaries = await ReviewSummary.find(query)
      .sort({ processedAt: -1 })
      .limit(parseInt(limit))
      .select("author rating sentiment summary company processedAt sentimentKeywords contextualTopics");

    return res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: summaries,
      metadata: {
        keyword,
        resultsFound: summaries.length,
      },
    });
  } catch (error) {
    console.error("Error in searchSummaries:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to search summaries",
      details: error.message,
    });
  }
};

/**
 * Get chatbot statistics
 * @route GET /api/chatbot/stats
 */
export const getChatbotStats = async (req, res) => {
  try {
    const totalReviews = await ReviewSummary.countDocuments({
      sentiment: { $ne: "error" },
    });

    const sentimentCounts = await ReviewSummary.aggregate([
      { $match: { sentiment: { $ne: "error" } } },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } },
    ]);

    const companyCounts = await ReviewSummary.aggregate([
      { $match: { sentiment: { $ne: "error" } } },
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const averages = await ReviewSummary.aggregate([
      { $match: { sentiment: { $ne: "error" } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          avgSentimentScore: { $avg: "$sentimentScore" },
        },
      },
    ]);

    const recentReview = await ReviewSummary.findOne({
      sentiment: { $ne: "error" },
    })
      .sort({ processedAt: -1 })
      .select("processedAt");

    const oldestReview = await ReviewSummary.findOne({
      sentiment: { $ne: "error" },
    })
      .sort({ processedAt: 1 })
      .select("processedAt");

    const sentimentDistribution = sentimentCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: {
        totalReviews,
        sentimentDistribution,
        averageRating: averages[0]?.avgRating?.toFixed(2) || 0,
        averageSentimentScore: averages[0]?.avgSentimentScore?.toFixed(3) || 0,
        topCompanies: companyCounts.map((c) => ({
          company: c._id,
          reviewCount: c.count,
        })),
        dateRange: {
          oldest: oldestReview?.processedAt || null,
          newest: recentReview?.processedAt || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getChatbotStats:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve statistics",
      details: error.message,
    });
  }
};
