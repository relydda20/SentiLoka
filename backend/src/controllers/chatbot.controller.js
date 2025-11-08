import { OpenAI } from "openai";
import { CONFIG } from "../config/sentiment-analysis-config.js";
import ReviewSummary from "../models/ReviewSummary.model.js";
import Conversation from "../models/Conversation.model.js";
import Location from "../models/Location.model.js";
import UserLocation from "../models/UserLocation.model.js";
import { v4 as uuidv4 } from "uuid";
import {
  getCachedContext,
  setCachedContext,
  getCachedSummary,
  setCachedSummary,
  invalidateCacheForLocation,
} from "../services/chatbot-cache.service.js";
import {
  checkLocationReadiness as checkLocationReadinessService,
  checkMultipleLocations,
  getLocationStatus,
} from "../services/location-readiness.service.js";
import {
  sanitizeObjectIdArray,
  sanitizeConversationHistory,
  validateChatbotRequest,
} from "../utils/input-sanitizer.js";

const openaiClient = new OpenAI({
  baseURL: CONFIG.GPT4O_MINI_BASE_URL,
  apiKey: CONFIG.GPT4O_MINI_API_KEY,
});

/**
 * Check if locations are ready for chatbot interaction
 * @route POST /api/chatbot/check-locations
 */
export const checkLocationReadiness = async (req, res) => {
  try {
    const { locationIds } = req.body;

    // Validate locationIds array
    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "locationIds array is required and must not be empty",
      });
    }

    // Sanitize and validate locationIds (max 50 for checking)
    const sanitizedLocationIds = sanitizeObjectIdArray(locationIds, 50);
    if (!sanitizedLocationIds) {
      return res.status(400).json({
        success: false,
        error: "Invalid locationIds format. Must be valid MongoDB ObjectIds (max 50)",
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    console.log(`\n🔍 Checking readiness for ${sanitizedLocationIds.length} location(s)...`);

    // Check all locations
    const checkResult = await checkMultipleLocations(sanitizedLocationIds, userId);

    if (!checkResult.success) {
      return res.status(400).json({
        success: false,
        error: checkResult.error || "Failed to check locations",
      });
    }

    console.log(`✅ Ready: ${checkResult.readyLocations.length}, ❌ Not Ready: ${checkResult.notReadyLocations.length}`);

    return res.status(200).json({
      success: true,
      data: {
        totalChecked: checkResult.locations.length,
        readyCount: checkResult.readyLocations.length,
        notReadyCount: checkResult.notReadyLocations.length,
        locations: checkResult.locations,
        summary: checkResult.summary,
      },
    });
  } catch (error) {
    console.error("❌ Error checking location readiness:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to check location readiness",
      details: error.message,
    });
  }
};

/**
 * Get user's locations for chatbot location selector
 * @route GET /api/chatbot/locations
 */
export const getUserLocations = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    console.log(`\n📍 Fetching locations for user: ${userId}`);

    // Fetch user's locations through the UserLocation junction table
    const userLocations = await UserLocation.find({
      userId,
      status: 'active', // Only active locations
    })
      .populate({
        path: 'locationId',
        select: 'name address googleMapsUrl overallSentiment createdAt updatedAt status',
        match: { status: { $ne: 'deleted' } } // Exclude deleted locations
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Filter out any null locationId (deleted locations) and map to location objects
    const locations = userLocations
      .filter(ul => ul.locationId != null)
      .map(ul => ul.locationId);

    console.log(`✅ Found ${locations.length} location(s)`);

    // Check readiness for each location
    const locationsWithReadiness = await Promise.all(
      locations.map(async (location) => {
        const readinessCheck = await checkLocationReadinessService(location._id, userId);

        return {
          locationId: location._id,
          name: location.name,
          address: location.address,
          googleMapsUrl: location.googleMapsUrl,
          reviewCount: location.overallSentiment?.totalReviews || 0,
          analyzedReviewCount: location.overallSentiment?.totalReviews || 0,
          ready: readinessCheck.ready,
          status: readinessCheck.status,
          message: readinessCheck.message,
          action: readinessCheck.action,
          createdAt: location.createdAt,
          updatedAt: location.updatedAt,
        };
      })
    );

    // Separate ready and not ready
    const readyLocations = locationsWithReadiness.filter((l) => l.ready);
    const notReadyLocations = locationsWithReadiness.filter((l) => !l.ready);

    return res.status(200).json({
      success: true,
      data: {
        totalLocations: locations.length,
        readyCount: readyLocations.length,
        notReadyCount: notReadyLocations.length,
        locations: locationsWithReadiness,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user locations:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch user locations",
      details: error.message,
    });
  }
};

/**
 * Helper function to generate a short conversation title from the first user message using AI
 * @param {OpenAI} openaiClient - OpenAI client instance
 * @param {string} message - First user message
 * @param {string[]} locationNames - Names of attached locations
 * @returns {Promise<string>} - Generated title (max 60 chars)
 */
async function generateConversationTitle(openaiClient, message, locationNames = []) {
  try {
    // If message is very short, use it as-is
    const cleaned = message.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 30) {
      return cleaned;
    }

    // Use AI to generate a concise, meaningful title
    const locationContext = locationNames.length > 0
      ? `\nContext: This conversation is about ${locationNames.join(', ')}.`
      : '';

    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a title generator. Create a short, clear title (max 50 characters) that captures the essence of the user's question or request. The title should be:
- Concise and descriptive
- In title case or sentence case
- Without quotes or special formatting
- Action-oriented when possible (e.g., "Review Analysis for...", "Compare locations", "Sentiment trends")${locationContext}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.5,
      max_tokens: 20,
    });

    let title = response.choices[0].message.content.trim();

    // Remove quotes if AI added them
    title = title.replace(/^["']|["']$/g, '');

    // Ensure max length of 60 chars
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }

    return title;
  } catch (error) {
    console.error('Error generating AI title:', error.message);

    // Fallback: Simple truncation if AI fails
    const cleaned = message.trim().replace(/\s+/g, ' ');
    if (cleaned.length <= 60) return cleaned;

    const truncated = cleaned.substring(0, 60);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 40)
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }
}

/**
 * Helper function to generate combined summary from multiple review summaries
 * Extracted to reuse in both cached and non-cached flows
 */
async function generateCombinedSummary(openaiClient, allSummaries) {
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

  return combinedSummaryResponse.choices[0].message.content;
}

/**
 * Chat with bot - Location-aware chatbot requiring attached locations
 * @route POST /api/chatbot/chat
 */
export const chatWithBot = async (req, res) => {
  try {
    const {
      message,
      locationIds, // REQUIRED: Array of location IDs to attach to this conversation
      conversationHistory = [],
      sessionId, // Optional: for persistent conversation tracking
    } = req.body;

    // Validate request using comprehensive validator
    const validation = validateChatbotRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    console.log(`\n🤖 Chatbot Request: "${message}"`);
    console.log(`📍 Attached Locations: ${locationIds.length}`);

    // Sanitize inputs
    const sanitizedLocationIds = sanitizeObjectIdArray(locationIds, 10);
    const sanitizedHistory = sanitizeConversationHistory(conversationHistory, 20);

    // STEP 1: Check if all locations are ready for chat
    console.log("🔍 Checking location readiness...");
    const readinessCheck = await checkMultipleLocations(sanitizedLocationIds, userId);
    
    if (!readinessCheck.success) {
      return res.status(400).json({
        success: false,
        error: readinessCheck.error || "Failed to check location readiness",
      });
    }

    if (readinessCheck.notReadyLocations.length > 0) {
      console.log(`❌ ${readinessCheck.notReadyLocations.length} location(s) not ready`);
      return res.status(400).json({
        success: false,
        error: "Some locations are not ready for chat",
        details: {
          notReadyLocations: readinessCheck.notReadyLocations.map((loc) => ({
            locationId: loc.locationId,
            status: loc.status,
            message: loc.message,
            action: loc.action,
          })),
        },
      });
    }

    console.log("✅ All locations ready for chat");

    // STEP 2: Fetch location metadata for context (locations are shared, verified via readiness check)
    const locations = await Location.find({
      _id: { $in: sanitizedLocationIds },
      status: { $ne: 'deleted' },
    }).select("name address googleMapsUrl overallSentiment");

    if (locations.length !== sanitizedLocationIds.length) {
      return res.status(404).json({
        success: false,
        error: "Some locations not found",
      });
    }

    const locationMetadata = locations.map((loc) => ({
      locationId: loc._id,
      name: loc.name,
      address: loc.address,
      reviewCount: loc.overallSentiment?.totalReviews || 0,
      analyzedReviewCount: loc.overallSentiment?.totalReviews || 0,
    }));

    console.log(`📍 Locations: ${locations.map((l) => l.name).join(", ")}`);

    // STEP 3: OPTIMIZATION - Try to get cached context (multi-location aware)
    let cachedContext = await getCachedContext(userId, sanitizedLocationIds);
    let combinedSummary, allReviews, sentimentCounts, ratingCounts, averageRating, topKeywords, topTopics;

    if (cachedContext) {
      // Cache HIT - reuse pre-computed data (saves DB query + processing)
      console.log("⚡ Using cached review context (skipping DB query & aggregation)");
      ({
        allReviews,
        sentimentCounts,
        ratingCounts,
        averageRating,
        topKeywords,
        topTopics,
      } = cachedContext);

      // Try to get cached summary
      combinedSummary = await getCachedSummary(userId);

      if (!combinedSummary) {
        // Summary not cached, generate it
        console.log("📝 Generating AI summary (context cached, summary missing)...");
        const allSummaries = allReviews.map((r) => r.summary);
        combinedSummary = await generateCombinedSummary(openaiClient, allSummaries);
        await setCachedSummary(userId, combinedSummary);
      } else {
        console.log("⚡ Using cached AI summary (saving OpenAI API call)");
      }
    } else {
      // Cache MISS - need to fetch and process everything
      console.log("🔍 Cache miss - fetching reviews from database...");

      // STEP 4: Retrieve ONLY reviews from attached locations
      const query = {
        locationId: { $in: sanitizedLocationIds },
        sentiment: { $ne: "error" },
      };

      allReviews = await ReviewSummary.find(query)
        .sort({ processedAt: -1 })
        .select("summary sentiment rating author processedAt sentimentKeywords contextualTopics locationId")
        .lean(); // Use lean() for better performance

      console.log(`📊 Retrieved ${allReviews.length} reviews from ${locations.length} location(s)`);

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
      combinedSummary = await generateCombinedSummary(openaiClient, allSummaries);
      console.log("✅ Combined summary created");

      // STEP 3: Analyze ALL ratings and sentiments
      sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
      ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
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

      averageRating = (totalRating / allReviews.length).toFixed(2);

      // Get top keywords and topics
      topKeywords = Object.entries(allKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([keyword, count]) => `${keyword} (${count})`);

      topTopics = Object.entries(allTopics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => `${topic} (${count})`);

      console.log("📊 Analysis complete:");
      console.log(`   - Average Rating: ${averageRating}/5`);
      console.log(`   - Sentiment: ${sentimentCounts.positive}+ ${sentimentCounts.negative}- ${sentimentCounts.neutral}=`);

      // Cache the context for future requests (multi-location aware)
      await setCachedContext(userId, {
        allReviews,
        sentimentCounts,
        ratingCounts,
        averageRating,
        topKeywords,
        topTopics,
      }, sanitizedLocationIds);

      // Cache the summary (multi-location aware)
      await setCachedSummary(userId, combinedSummary, sanitizedLocationIds);
    }

    // STEP 5: Build comprehensive context for AI (multi-location aware)
    const locationNames = locations.map((l) => l.name).join(", ");
    const comprehensiveContext = `
=== COMPREHENSIVE REVIEW ANALYSIS ===

🏢 LOCATIONS ANALYZED: ${locationNames}
Total Locations: ${locations.length}

📊 OVERALL STATISTICS ACROSS ALL LOCATIONS:
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

    // STEP 6: Create AI messages with full context (multi-location aware)
    const messages = [
      {
        role: "system",
        content: `You are an intelligent customer insights chatbot with deep knowledge of customer reviews.

You have analyzed ${allReviews.length} customer reviews from ${locations.length} location(s): ${locationNames}

You have access to:
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

    // Add conversation history (sanitized)
    if (sanitizedHistory && sanitizedHistory.length > 0) {
      sanitizedHistory.forEach((msg) => {
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

    // STEP 7: Get AI response with full context
    console.log("🤖 Generating AI response...");
    const aiResponse = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const botReply = aiResponse.choices[0].message.content;
    console.log("✅ Response generated\n");

    // STEP 8: Build updated conversation history
    const updatedHistory = [
      ...(sanitizedHistory || []),
      { role: "user", content: message },
      { role: "assistant", content: botReply },
    ];

    // STEP 9: Save conversation to database with location metadata
    let savedSessionId = sessionId;
    let isNewConversation = false;
    let conversationTitle = null;

    // Check if this is a new conversation (no sessionId provided or session doesn't exist)
    if (!sessionId) {
      savedSessionId = uuidv4();
      isNewConversation = true;
    } else {
      const existingConversation = await Conversation.findOne({ sessionId, userId });
      if (!existingConversation) {
        isNewConversation = true;
      }
    }

    try {
      const updateData = {
        $push: {
          messages: {
            $each: [
              { role: "user", content: message },
              { role: "assistant", content: botReply },
            ],
          },
        },
        $set: {
          userId,
          attachedLocationIds: sanitizedLocationIds,
          locationMetadata: locationMetadata.map((loc) => ({
            ...loc,
            attachedAt: new Date(),
          })),
          lastActivity: new Date(),
          "metadata.totalMessages": updatedHistory.length,
          "metadata.reviewSnapshot": {
            totalReviews: allReviews.length,
            averageRating: parseFloat(averageRating),
            locationCount: locations.length,
          },
          "metadata.locationsAnalyzed": locations.map((loc) => ({
            locationId: loc._id,
            locationName: loc.name,
          })),
        },
      };

      // Only set title for new conversations (first message)
      if (isNewConversation) {
        const locationNames = locations.map(loc => loc.name);
        conversationTitle = await generateConversationTitle(openaiClient, message, locationNames);
        updateData.$set.title = conversationTitle;
        console.log(`📝 Creating new conversation with title: "${conversationTitle}"`);
      }

      await Conversation.findOneAndUpdate(
        { sessionId: savedSessionId, userId },
        updateData,
        { upsert: true, new: true }
      );

      console.log(`💾 Conversation ${isNewConversation ? 'created' : 'updated'} for session: ${savedSessionId}`);
    } catch (dbError) {
      console.error("⚠️ Failed to save conversation:", dbError.message);
      // Don't fail the request if DB save fails
    }

    // STEP 10: Return comprehensive response with location context
    const responseData = {
      response: botReply,
      conversationHistory: updatedHistory,
      sessionId: savedSessionId,
      attachedLocations: locationMetadata,
      metadata: {
        totalReviews: allReviews.length,
        locationCount: locations.length,
        averageRating: parseFloat(averageRating),
        sentimentDistribution: sentimentCounts,
        ratingDistribution: ratingCounts,
        topKeywords: topKeywords.slice(0, 10),
        topTopics: topTopics.slice(0, 5),
      },
    };

    // Include title for new conversations
    if (isNewConversation && conversationTitle) {
      responseData.title = conversationTitle;
    }

    return res.status(200).json({
      success: true,
      data: responseData,
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
 * Compare two locations and analyze why one is more successful
 * @route POST /api/chatbot/compare-locations
 */
export const compareLocations = async (req, res) => {
  try {
    const {
      locationId1,
      locationId2,
      message,
      perspective, // Optional: comparison perspective (e.g., "customer satisfaction", "service quality")
      conversationHistory = [],
      sessionId,
    } = req.body;

    // Validate required fields
    if (!locationId1 || !locationId2) {
      return res.status(400).json({
        success: false,
        error: "Both locationId1 and locationId2 are required",
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    console.log(`\n🔍 Location Comparison Request`);
    console.log(`   Location 1: ${locationId1}`);
    console.log(`   Location 2: ${locationId2}`);
    if (perspective) console.log(`   Perspective: ${perspective}`);

    // STEP 1: Check if both locations are ready for comparison
    const [readiness1, readiness2] = await Promise.all([
      checkLocationReadinessService(locationId1, userId),
      checkLocationReadinessService(locationId2, userId),
    ]);

    if (!readiness1.ready || !readiness2.ready) {
      const notReadyLocations = [];
      if (!readiness1.ready) notReadyLocations.push({ locationId: locationId1, ...readiness1 });
      if (!readiness2.ready) notReadyLocations.push({ locationId: locationId2, ...readiness2 });

      return res.status(400).json({
        success: false,
        error: "One or both locations are not ready for comparison",
        details: { notReadyLocations },
      });
    }

    // STEP 2: Fetch both locations
    const [location1, location2] = await Promise.all([
      Location.findById(locationId1),
      Location.findById(locationId2),
    ]);

    if (!location1 || !location2) {
      return res.status(404).json({
        success: false,
        error: "One or both locations not found",
      });
    }

    // Note: Ownership is already verified by readiness check via UserLocation junction table

    // STEP 3: Fetch reviews for both locations
    const [reviews1, reviews2] = await Promise.all([
      ReviewSummary.find({ locationId: locationId1, sentiment: { $ne: "error" } })
        .sort({ processedAt: -1 })
        .select("summary sentiment rating author processedAt sentimentKeywords contextualTopics"),
      ReviewSummary.find({ locationId: locationId2, sentiment: { $ne: "error" } })
        .sort({ processedAt: -1 })
        .select("summary sentiment rating author processedAt sentimentKeywords contextualTopics"),
    ]);

    console.log(`📊 Location 1 "${location1.name}": ${reviews1.length} reviews`);
    console.log(`📊 Location 2 "${location2.name}": ${reviews2.length} reviews`);

    if (reviews1.length === 0 && reviews2.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          response: "Neither location has review data to analyze yet. Please analyze some reviews first.",
          metadata: {
            location1: { name: location1.name, totalReviews: 0 },
            location2: { name: location2.name, totalReviews: 0 },
          },
        },
      });
    }

    // STEP 4: Analyze Location 1
    const location1Analysis = analyzeLocationReviews(reviews1, location1);

    // STEP 5: Analyze Location 2
    const location2Analysis = analyzeLocationReviews(reviews2, location2);

    // STEP 6: Create combined summaries for each location
    const [summary1, summary2] = await Promise.all([
      createLocationSummary(openaiClient, reviews1, location1.name),
      createLocationSummary(openaiClient, reviews2, location2.name),
    ]);

    console.log("✅ Both location summaries created");

    // STEP 7: Build comprehensive comparison context
    const comparisonContext = `
=== LOCATION COMPARISON ANALYSIS ===

🏢 LOCATION 1: ${location1.name}
Address: ${location1.address}
📊 STATISTICS:
- Total Reviews Analyzed: ${location1Analysis.totalReviews}
- Average Rating: ${location1Analysis.averageRating}/5 stars
- Sentiment Distribution:
  * Positive: ${location1Analysis.sentimentCounts.positive} reviews (${location1Analysis.sentimentPercentages.positive}%)
  * Negative: ${location1Analysis.sentimentCounts.negative} reviews (${location1Analysis.sentimentPercentages.negative}%)
  * Neutral: ${location1Analysis.sentimentCounts.neutral} reviews (${location1Analysis.sentimentPercentages.neutral}%)

⭐ RATING BREAKDOWN:
- 5 stars: ${location1Analysis.ratingCounts[5] || 0} reviews
- 4 stars: ${location1Analysis.ratingCounts[4] || 0} reviews
- 3 stars: ${location1Analysis.ratingCounts[3] || 0} reviews
- 2 stars: ${location1Analysis.ratingCounts[2] || 0} reviews
- 1 star: ${location1Analysis.ratingCounts[1] || 0} reviews

📝 SUMMARY: ${summary1}

🔑 TOP KEYWORDS: ${location1Analysis.topKeywords.join(", ")}
📌 MAIN TOPICS: ${location1Analysis.topTopics.join(", ")}

---

🏢 LOCATION 2: ${location2.name}
Address: ${location2.address}
📊 STATISTICS:
- Total Reviews Analyzed: ${location2Analysis.totalReviews}
- Average Rating: ${location2Analysis.averageRating}/5 stars
- Sentiment Distribution:
  * Positive: ${location2Analysis.sentimentCounts.positive} reviews (${location2Analysis.sentimentPercentages.positive}%)
  * Negative: ${location2Analysis.sentimentCounts.negative} reviews (${location2Analysis.sentimentPercentages.negative}%)
  * Neutral: ${location2Analysis.sentimentCounts.neutral} reviews (${location2Analysis.sentimentPercentages.neutral}%)

⭐ RATING BREAKDOWN:
- 5 stars: ${location2Analysis.ratingCounts[5] || 0} reviews
- 4 stars: ${location2Analysis.ratingCounts[4] || 0} reviews
- 3 stars: ${location2Analysis.ratingCounts[3] || 0} reviews
- 2 stars: ${location2Analysis.ratingCounts[2] || 0} reviews
- 1 star: ${location2Analysis.ratingCounts[1] || 0} reviews

📝 SUMMARY: ${summary2}

🔑 TOP KEYWORDS: ${location2Analysis.topKeywords.join(", ")}
📌 MAIN TOPICS: ${location2Analysis.topTopics.join(", ")}

---

🔍 KEY PERFORMANCE INDICATORS COMPARISON:
Location 1 vs Location 2:
- Rating Difference: ${(location1Analysis.averageRating - location2Analysis.averageRating).toFixed(2)} stars
- Positive Sentiment Difference: ${(location1Analysis.sentimentPercentages.positive - location2Analysis.sentimentPercentages.positive).toFixed(1)}%
- Review Volume: ${location1Analysis.totalReviews} vs ${location2Analysis.totalReviews}
`;

    // STEP 8: Create AI messages for comparison analysis
    const perspectiveNote = perspective ? `\n\n📋 COMPARISON PERSPECTIVE: ${perspective}\nPlease focus your analysis through this lens.` : "";
    const defaultMessage = message || `Compare these two locations and explain why one might be more successful than the other. What are the key differences?${perspective ? ` Focus on ${perspective}.` : ""}`;

    const messages = [
      {
        role: "system",
        content: `You are an expert business analyst specializing in customer experience and competitive analysis.

You have analyzed detailed review data for TWO different business locations and have access to:
- Complete sentiment analysis for both locations
- Rating distributions and averages
- Customer feedback summaries
- Common themes and keywords
- Statistical comparisons

YOUR KNOWLEDGE BASE:
${comparisonContext}${perspectiveNote}

GUIDELINES FOR COMPARATIVE ANALYSIS:
- Identify specific strengths and weaknesses of each location based on actual review data
- Highlight key differentiators in customer experience
- Use concrete statistics and percentages to support your analysis
- Identify actionable insights that explain performance differences
- Point out common themes in positive reviews for the better-performing location
- Point out recurring complaints for the lower-performing location
- Be objective and data-driven in your assessment
- Suggest specific areas for improvement based on the data
- Consider both quantitative metrics (ratings, percentages) and qualitative insights (themes, keywords)

TONE: Professional, analytical, insightful, and constructive`,
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
      content: defaultMessage,
    });

    // STEP 9: Get AI comparison analysis
    console.log("🤖 Generating comparative analysis...");
    const aiResponse = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    });

    const botReply = aiResponse.choices[0].message.content;
    console.log("✅ Comparison analysis generated\n");

    // STEP 10: Build updated conversation history
    const sanitizedHistory = sanitizeConversationHistory(conversationHistory, 20);
    const updatedHistory = [
      ...(sanitizedHistory || []),
      { role: "user", content: defaultMessage },
      { role: "assistant", content: botReply },
    ];

    // STEP 11: Save conversation with location metadata
    let savedSessionId = sessionId;
    let isNewConversation = false;

    // Check if this is a new conversation
    if (!sessionId) {
      savedSessionId = uuidv4();
      isNewConversation = true;
    } else {
      const existingConversation = await Conversation.findOne({ sessionId, userId });
      if (!existingConversation) {
        isNewConversation = true;
      }
    }

    try {
      const updateData = {
        $push: {
          messages: {
            $each: [
              { role: "user", content: defaultMessage },
              { role: "assistant", content: botReply },
            ],
          },
        },
        $set: {
          userId,
          attachedLocationIds: [locationId1, locationId2],
          locationMetadata: [
            {
              locationId: location1._id,
              name: location1.name,
              reviewCount: location1Analysis.totalReviews,
              analyzedReviewCount: location1Analysis.totalReviews,
              attachedAt: new Date(),
            },
            {
              locationId: location2._id,
              name: location2.name,
              reviewCount: location2Analysis.totalReviews,
              analyzedReviewCount: location2Analysis.totalReviews,
              attachedAt: new Date(),
            },
          ],
          lastActivity: new Date(),
          "metadata.totalMessages": updatedHistory.length,
          "metadata.comparisonSnapshot": {
            location1: {
              id: locationId1,
              name: location1.name,
              totalReviews: location1Analysis.totalReviews,
              averageRating: location1Analysis.averageRating,
            },
            location2: {
              id: locationId2,
              name: location2.name,
              totalReviews: location2Analysis.totalReviews,
              averageRating: location2Analysis.averageRating,
            },
          },
        },
      };

      // Only set title for new conversations (first message)
      if (isNewConversation) {
        const comparisonMessage = message || `Compare ${location1.name} vs ${location2.name}`;
        const locationNames = [location1.name, location2.name];
        updateData.$set.title = await generateConversationTitle(openaiClient, comparisonMessage, locationNames);
        console.log(`📝 Creating new comparison conversation with title: "${updateData.$set.title}"`);
      }

      await Conversation.findOneAndUpdate(
        { sessionId: savedSessionId, userId },
        updateData,
        { upsert: true, new: true }
      );

      console.log(`💾 Comparison conversation ${isNewConversation ? 'created' : 'updated'} for session: ${savedSessionId}`);
    } catch (dbError) {
      console.error("⚠️ Failed to save conversation:", dbError.message);
    }

    // STEP 12: Return comprehensive comparison response
    return res.status(200).json({
      success: true,
      data: {
        response: botReply,
        conversationHistory: updatedHistory,
        sessionId: savedSessionId,
        comparison: {
          location1: {
            id: locationId1,
            name: location1.name,
            address: location1.address,
            totalReviews: location1Analysis.totalReviews,
            averageRating: location1Analysis.averageRating,
            sentimentDistribution: location1Analysis.sentimentCounts,
            sentimentPercentages: location1Analysis.sentimentPercentages,
            ratingDistribution: location1Analysis.ratingCounts,
            topKeywords: location1Analysis.topKeywords.slice(0, 10),
            topTopics: location1Analysis.topTopics.slice(0, 5),
          },
          location2: {
            id: locationId2,
            name: location2.name,
            address: location2.address,
            totalReviews: location2Analysis.totalReviews,
            averageRating: location2Analysis.averageRating,
            sentimentDistribution: location2Analysis.sentimentCounts,
            sentimentPercentages: location2Analysis.sentimentPercentages,
            ratingDistribution: location2Analysis.ratingCounts,
            topKeywords: location2Analysis.topKeywords.slice(0, 10),
            topTopics: location2Analysis.topTopics.slice(0, 5),
          },
          performanceDelta: {
            ratingDifference: parseFloat((location1Analysis.averageRating - location2Analysis.averageRating).toFixed(2)),
            positiveSentimentDifference: parseFloat((location1Analysis.sentimentPercentages.positive - location2Analysis.sentimentPercentages.positive).toFixed(1)),
            reviewVolumeDifference: location1Analysis.totalReviews - location2Analysis.totalReviews,
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in location comparison:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to generate comparison analysis",
      details: error.message,
    });
  }
};

/**
 * Helper function to analyze reviews for a location
 */
function analyzeLocationReviews(reviews, location) {
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  const allKeywords = {};
  const allTopics = {};

  reviews.forEach((review) => {
    sentimentCounts[review.sentiment] = (sentimentCounts[review.sentiment] || 0) + 1;
    const ratingFloor = Math.floor(review.rating);
    ratingCounts[ratingFloor] = (ratingCounts[ratingFloor] || 0) + 1;
    totalRating += review.rating;

    review.sentimentKeywords?.forEach((keyword) => {
      allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
    });

    review.contextualTopics?.forEach((topic) => {
      allTopics[topic] = (allTopics[topic] || 0) + 1;
    });
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? parseFloat((totalRating / totalReviews).toFixed(2)) : 0;

  const topKeywords = Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => `${keyword} (${count})`);

  const topTopics = Object.entries(allTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => `${topic} (${count})`);

  return {
    totalReviews,
    averageRating,
    sentimentCounts,
    sentimentPercentages: {
      positive: totalReviews > 0 ? parseFloat(((sentimentCounts.positive / totalReviews) * 100).toFixed(1)) : 0,
      negative: totalReviews > 0 ? parseFloat(((sentimentCounts.negative / totalReviews) * 100).toFixed(1)) : 0,
      neutral: totalReviews > 0 ? parseFloat(((sentimentCounts.neutral / totalReviews) * 100).toFixed(1)) : 0,
    },
    ratingCounts,
    topKeywords,
    topTopics,
  };
}

/**
 * Helper function to create a combined summary for a location
 */
async function createLocationSummary(openaiClient, reviews, locationName) {
  if (reviews.length === 0) {
    return "No reviews available for analysis.";
  }

  const allSummaries = reviews.map((r) => r.summary);

  const combinedSummaryResponse = await openaiClient.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert at synthesizing multiple review summaries for business analysis. Combine these summaries into ONE comprehensive overview that captures:
- Overall customer sentiment and experience
- Key strengths and positive aspects
- Main weaknesses and complaints
- Notable patterns and recurring themes
- Specific details that stand out

Keep it concise (3-4 paragraphs max).`,
      },
      {
        role: "user",
        content: `Combine these ${allSummaries.length} review summaries for "${locationName}" into one comprehensive summary:\n\n${allSummaries.join("\n\n")}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 600,
  });

  return combinedSummaryResponse.choices[0].message.content;
}

/**
 * Get conversation history by sessionId
 * @route GET /api/chatbot/conversation/:sessionId
 */
export const getConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Only get user's own conversations
    const conversation = await Conversation.findOne({ sessionId, userId });

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
        attachedLocations: conversation.locationMetadata,
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
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Only delete user's own conversations
    const result = await Conversation.findOneAndDelete({ sessionId, userId });

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
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Only get user's own conversations - include title and messages for history display
    const conversations = await Conversation.find({ userId })
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select("sessionId title messages lastActivity metadata createdAt locationMetadata attachedLocationIds");

    const total = await Conversation.countDocuments({ userId });

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
