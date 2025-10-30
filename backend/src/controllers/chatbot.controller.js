import { OpenAI } from "openai";
import { CONFIG } from "../config/sentiment-analysis-config.js";
import ReviewSummary from "../models/ReviewSummary.model.js";
import Conversation from "../models/Conversation.model.js";
import { v4 as uuidv4 } from "uuid";

const openaiClient = new OpenAI({
  baseURL: CONFIG.GPT4O_MINI_BASE_URL,
  apiKey: CONFIG.GPT4O_MINI_API_KEY,
});

/**
 * Chat with bot - Analyzes ALL summaries, ratings, and sentiments from database
 * @route POST /api/chatbot/chat
 */
export const chatWithBot = async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      sessionId, // Optional: for persistent conversation tracking
    } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    console.log(`\n🤖 Chatbot Request: "${message}"`);

    // STEP 1: Retrieve ALL summaries from database
    const query = { sentiment: { $ne: "error" } };

    const allReviews = await ReviewSummary.find(query)
      .sort({ processedAt: -1 })
      .limit(100)
      .select("summary sentiment rating author processedAt sentimentKeywords contextualTopics");

    console.log(`📊 Retrieved ${allReviews.length} reviews from database`);

    if (allReviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          response: "I don't have any review data to analyze yet. Please analyze some reviews first.",
          metadata: {
            totalReviews: 0,
          },
        },
      });
    }

    // STEP 2: Process ALL summaries into ONE big summary
    console.log("📝 Combining all summaries...");
    const allSummaries = allReviews.map((r) => r.summary);

    // Combine summaries using AI
    const combinedSummaryResponse = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at synthesizing multiple review summaries. Combine these summaries into ONE comprehensive overview that captures:
- Overall sentiment and tone
- Key positive points mentioned
- Main complaints or concerns
- Common themes and patterns
- Specific details that stand out

Keep it concise (3-4 paragraphs max).`,
        },
        {
          role: "user",
          content: `Combine these ${allSummaries.length} review summaries into one comprehensive summary:\n\n${allSummaries.join("\n\n")}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const combinedSummary = combinedSummaryResponse.choices[0].message.content;
    console.log("✅ Combined summary created");

    // STEP 3: Analyze ALL ratings and sentiments
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    const allKeywords = {};
    const allTopics = {};

    allReviews.forEach((review) => {
      // Count sentiments
      sentimentCounts[review.sentiment] = (sentimentCounts[review.sentiment] || 0) + 1;

      // Count ratings
      const ratingFloor = Math.floor(review.rating);
      ratingCounts[ratingFloor] = (ratingCounts[ratingFloor] || 0) + 1;
      totalRating += review.rating;

      // Collect keywords
      review.sentimentKeywords?.forEach((keyword) => {
        allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
      });

      // Collect topics
      review.contextualTopics?.forEach((topic) => {
        allTopics[topic] = (allTopics[topic] || 0) + 1;
      });
    });

    const averageRating = (totalRating / allReviews.length).toFixed(2);

    // Get top keywords and topics
    const topKeywords = Object.entries(allKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([keyword, count]) => `${keyword} (${count})`);

    const topTopics = Object.entries(allTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => `${topic} (${count})`);

    console.log("📊 Analysis complete:");
    console.log(`   - Average Rating: ${averageRating}/5`);
    console.log(`   - Sentiment: ${sentimentCounts.positive}+ ${sentimentCounts.negative}- ${sentimentCounts.neutral}=`);

    // STEP 4: Build comprehensive context for AI
    const comprehensiveContext = `
=== COMPREHENSIVE REVIEW ANALYSIS ===

📊 OVERALL STATISTICS:
- Total Reviews Analyzed: ${allReviews.length}
- Average Rating: ${averageRating}/5 stars
- Sentiment Distribution:
  * Positive: ${sentimentCounts.positive} reviews (${((sentimentCounts.positive / allReviews.length) * 100).toFixed(1)}%)
  * Negative: ${sentimentCounts.negative} reviews (${((sentimentCounts.negative / allReviews.length) * 100).toFixed(1)}%)
  * Neutral: ${sentimentCounts.neutral} reviews (${((sentimentCounts.neutral / allReviews.length) * 100).toFixed(1)}%)

⭐ RATING BREAKDOWN:
- 5 stars: ${ratingCounts[5] || 0} reviews
- 4 stars: ${ratingCounts[4] || 0} reviews
- 3 stars: ${ratingCounts[3] || 0} reviews
- 2 stars: ${ratingCounts[2] || 0} reviews
- 1 star: ${ratingCounts[1] || 0} reviews

📝 COMBINED SUMMARY OF ALL REVIEWS:
${combinedSummary}

🔑 TOP KEYWORDS MENTIONED:
${topKeywords.join(", ")}

📌 MAIN TOPICS DISCUSSED:
${topTopics.join(", ")}
`;

    // STEP 5: Create AI messages with full context
    const messages = [
      {
        role: "system",
        content: `You are an intelligent customer insights chatbot with deep knowledge of customer reviews.

You have analyzed ${allReviews.length} customer reviews and have access to:
- Combined summary of all reviews
- Sentiment analysis (positive/negative/neutral breakdown)
- Rating statistics (1-5 stars)
- Most frequently mentioned keywords
- Common topics and themes

YOUR KNOWLEDGE BASE:
${comprehensiveContext}

GUIDELINES FOR RESPONSES:
- Answer questions based on the review data provided
- Use specific statistics and numbers when relevant
- Be conversational, helpful, and insightful
- If asked about trends, identify patterns from the data
- If asked for recommendations, base them on the review insights
- If you don't have enough information, say so honestly
- Always ground your responses in the actual review data

TONE: Professional yet friendly, data-driven but conversational`,
      },
    ];

    // Add conversation history
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

    // STEP 6: Get AI response with full context
    console.log("🤖 Generating AI response...");
    const aiResponse = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const botReply = aiResponse.choices[0].message.content;
    console.log("✅ Response generated\n");

    // STEP 7: Build updated conversation history
    const updatedHistory = [
      ...(conversationHistory || []),
      { role: "user", content: message },
      { role: "assistant", content: botReply },
    ];

    // STEP 8: Save conversation to database if sessionId provided
    let savedSessionId = sessionId;
    if (sessionId) {
      try {
        await Conversation.findOneAndUpdate(
          { sessionId },
          {
            $push: {
              messages: {
                $each: [
                  { role: "user", content: message },
                  { role: "assistant", content: botReply },
                ],
              },
            },
            $set: {
              lastActivity: new Date(),
              "metadata.totalMessages": updatedHistory.length,
              "metadata.reviewSnapshot": {
                totalReviews: allReviews.length,
                averageRating: parseFloat(averageRating),
              },
            },
          },
          { upsert: true, new: true }
        );
        console.log(`💾 Conversation saved for session: ${sessionId}`);
      } catch (dbError) {
        console.error("⚠️ Failed to save conversation:", dbError.message);
        // Don't fail the request if DB save fails
      }
    }

    // STEP 9: Return comprehensive response with conversation history
    return res.status(200).json({
      success: true,
      data: {
        response: botReply,
        conversationHistory: updatedHistory, // Return updated history for client to store
        sessionId: savedSessionId, // Return sessionId for future requests
        metadata: {
          totalReviews: allReviews.length,
          averageRating: parseFloat(averageRating),
          sentimentDistribution: sentimentCounts,
          ratingDistribution: ratingCounts,
          topKeywords: topKeywords.slice(0, 10),
          topTopics: topTopics.slice(0, 5),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in chat:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to generate chat response",
      details: error.message,
    });
  }
};

/**
 * Get all summaries from database with filtering and pagination
 * @route GET /api/chatbot/summaries
 */
export const getAllSummaries = async (req, res) => {
  try {
    const {
      sentiment,
      limit = 50,
      skip = 0,
      sortBy = "processedAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = { sentiment: { $ne: "error" } };
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
      .select("author rating sentiment sentimentScore summary processedAt sentimentKeywords contextualTopics");

    const total = await ReviewSummary.countDocuments(query);

    return res.status(200).json({
      success: true,
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
    const { keyword, sentiment, limit = 50 } = req.query;

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

    if (sentiment) {
      query.sentiment = sentiment;
    }

    const summaries = await ReviewSummary.find(query)
      .sort({ processedAt: -1 })
      .limit(parseInt(limit))
      .select("author rating sentiment summary processedAt sentimentKeywords contextualTopics");

    return res.status(200).json({
      success: true,
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
export const getStats = async (req, res) => {
  try {
    const totalReviews = await ReviewSummary.countDocuments({
      sentiment: { $ne: "error" },
    });

    const sentimentCounts = await ReviewSummary.aggregate([
      { $match: { sentiment: { $ne: "error" } } },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } },
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
      data: {
        totalReviews,
        sentimentDistribution,
        averageRating: averages[0]?.avgRating?.toFixed(2) || 0,
        averageSentimentScore: averages[0]?.avgSentimentScore?.toFixed(3) || 0,
        dateRange: {
          oldest: oldestReview?.processedAt || null,
          newest: recentReview?.processedAt || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getStats:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve statistics",
      details: error.message,
    });
  }
};

/**
 * Create a new conversation session
 * @route POST /api/chatbot/conversation/new
 */
export const createConversation = async (req, res) => {
  try {
    const newSessionId = uuidv4();

    const conversation = await Conversation.create({
      sessionId: newSessionId,
      messages: [],
      metadata: {
        totalMessages: 0,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create conversation",
      details: error.message,
    });
  }
};

/**
 * Get conversation history by sessionId
 * @route GET /api/chatbot/conversation/:sessionId
 */
export const getConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        messages: conversation.messages,
        lastActivity: conversation.lastActivity,
        metadata: conversation.metadata,
      },
    });
  } catch (error) {
    console.error("Error retrieving conversation:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve conversation",
      details: error.message,
    });
  }
};

/**
 * Delete a conversation by sessionId
 * @route DELETE /api/chatbot/conversation/:sessionId
 */
export const deleteConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await Conversation.findOneAndDelete({ sessionId });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
      details: error.message,
    });
  }
};

/**
 * Get all conversation sessions (for listing)
 * @route GET /api/chatbot/conversations
 */
export const getAllConversations = async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const conversations = await Conversation.find()
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select("sessionId lastActivity metadata createdAt");

    const total = await Conversation.countDocuments();

    return res.status(200).json({
      success: true,
      data: conversations,
      metadata: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        returned: conversations.length,
      },
    });
  } catch (error) {
    console.error("Error retrieving conversations:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve conversations",
      details: error.message,
    });
  }
};
