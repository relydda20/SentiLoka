import { OpenAI } from "openai";
import { CONFIG } from "../config/sentiment-analysis-config.js";
import ReviewSummary from "../models/ReviewSummary.model.js";

const openaiClient = new OpenAI({
  baseURL: CONFIG.GPT4O_MINI_BASE_URL,
  apiKey: CONFIG.GPT4O_MINI_API_KEY,
});

/**
 * Combine multiple summaries into one coherent summary
 * @param {Array<String>} summaries - Array of summary strings
 * @param {Object} options - Options for combination
 * @returns {Promise<String>} - Combined summary
 */
export const combineSummaries = async (summaries, options = {}) => {
  try {
    const {
      maxLength = 500,
      focus = "overall", // 'overall', 'positive', 'negative', 'improvements'
    } = options;

    if (!summaries || summaries.length === 0) {
      throw new Error("No summaries provided");
    }

    // If only one summary, return it
    if (summaries.length === 1) {
      return summaries[0];
    }

    // Prepare summaries text
    const summariesText = summaries
      .map((s, i) => `Summary ${i + 1}: ${s}`)
      .join("\n\n");

    // Create focus-specific prompt
    let focusInstruction = "";
    switch (focus) {
      case "positive":
        focusInstruction =
          "Focus on the positive aspects and what customers loved.";
        break;
      case "negative":
        focusInstruction =
          "Focus on the negative aspects, complaints, and issues.";
        break;
      case "improvements":
        focusInstruction =
          "Focus on suggestions for improvement and areas that need attention.";
        break;
      default:
        focusInstruction =
          "Provide a balanced overview covering both positive and negative aspects.";
    }

    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at synthesizing multiple review summaries into one coherent, comprehensive summary.

Your task is to combine the provided summaries while:
- Maintaining the key insights from each
- Identifying common themes and patterns
- Preserving specific examples when important
- Creating a natural, flowing narrative
- Keeping the combined summary concise (max ${maxLength} words)
- ${focusInstruction}

Respond with ONLY the combined summary text, no additional formatting or explanations.`,
        },
        {
          role: "user",
          content: `Please combine these ${summaries.length} review summaries into one coherent summary:\n\n${summariesText}`,
        },
      ],
      temperature: 0.4,
      max_tokens: Math.min(maxLength * 2, 1000),
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error combining summaries:", error);
    throw error;
  }
};

/**
 * Get aggregated summary for a company
 * @param {String} company - Company name
 * @param {Object} options - Aggregation options
 * @returns {Promise<Object>} - Aggregated summary with statistics
 */
export const getAggregatedSummaryForCompany = async (company, options = {}) => {
  try {
    const {
      limit = 100,
      sentiment = null, // 'positive', 'negative', 'neutral', or null for all
      focus = "overall",
    } = options;

    // Build query
    const query = { company, sentiment: { $ne: "error" } };
    if (sentiment) {
      query.sentiment = sentiment;
    }

    // Get summaries from database
    const reviews = await ReviewSummary.find(query)
      .sort({ processedAt: -1 })
      .limit(limit)
      .select("summary sentiment sentimentScore author rating processedAt");

    if (reviews.length === 0) {
      return {
        company,
        aggregatedSummary: "No reviews found for this company.",
        statistics: {
          totalReviews: 0,
          sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
          averageSentimentScore: 0,
          averageRating: 0,
        },
      };
    }

    // Extract summaries
    const summaries = reviews.map((r) => r.summary);

    // Combine summaries
    const aggregatedSummary = await combineSummaries(summaries, {
      focus,
      maxLength: 500,
    });

    // Calculate statistics
    const sentimentDistribution = reviews.reduce(
      (acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const averageSentimentScore =
      reviews.reduce((sum, r) => sum + (r.sentimentScore || 0), 0) /
      reviews.length;

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Save the aggregated summary to database
    const combinedSummaryDoc = new ReviewSummary({
      author: "System (Aggregated)",
      rating: averageRating,
      text: `Aggregated summary from ${reviews.length} reviews`,
      sentiment: averageSentimentScore > 0.3 ? "positive" : averageSentimentScore < -0.3 ? "negative" : "neutral",
      sentimentScore: averageSentimentScore,
      confidence: 0.9,
      sentimentKeywords: [],
      contextualTopics: [],
      summary: aggregatedSummary,
      company,
      source: "Aggregated",
      isCombined: true,
      originalSummaryIds: reviews.map((r) => r._id),
      processedAt: new Date(),
    });

    await combinedSummaryDoc.save();
    console.log(
      `✓ Saved aggregated summary for ${company} (${reviews.length} reviews)`
    );

    return {
      company,
      aggregatedSummary,
      combinedSummaryId: combinedSummaryDoc._id,
      statistics: {
        totalReviews: reviews.length,
        sentimentDistribution,
        averageSentimentScore: parseFloat(averageSentimentScore.toFixed(3)),
        averageRating: parseFloat(averageRating.toFixed(2)),
        dateRange: {
          oldest: reviews[reviews.length - 1].processedAt,
          newest: reviews[0].processedAt,
        },
      },
    };
  } catch (error) {
    console.error("Error getting aggregated summary:", error);
    throw error;
  }
};

/**
 * Get aggregated summary by sentiment type
 * @param {String} company - Company name
 * @param {String} sentiment - 'positive', 'negative', or 'neutral'
 * @returns {Promise<Object>} - Aggregated summary for that sentiment
 */
export const getAggregatedSummaryBySentiment = async (company, sentiment) => {
  return getAggregatedSummaryForCompany(company, {
    sentiment,
    focus: sentiment,
    limit: 50,
  });
};

/**
 * Get recent aggregated summary (last N reviews)
 * @param {Number} limit - Number of recent reviews to aggregate
 * @returns {Promise<Object>} - Aggregated summary of recent reviews
 */
export const getRecentAggregatedSummary = async (limit = 50) => {
  try {
    const reviews = await ReviewSummary.find({ sentiment: { $ne: "error" } })
      .sort({ processedAt: -1 })
      .limit(limit)
      .select("summary sentiment sentimentScore author rating company processedAt");

    if (reviews.length === 0) {
      return {
        aggregatedSummary: "No recent reviews found.",
        statistics: {
          totalReviews: 0,
        },
      };
    }

    const summaries = reviews.map((r) => r.summary);
    const aggregatedSummary = await combineSummaries(summaries, {
      focus: "overall",
      maxLength: 500,
    });

    // Calculate statistics
    const sentimentDistribution = reviews.reduce(
      (acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const averageSentimentScore =
      reviews.reduce((sum, r) => sum + (r.sentimentScore || 0), 0) /
      reviews.length;

    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Get unique companies
    const companies = [...new Set(reviews.map((r) => r.company))];

    return {
      aggregatedSummary,
      statistics: {
        totalReviews: reviews.length,
        companies,
        sentimentDistribution,
        averageSentimentScore: parseFloat(averageSentimentScore.toFixed(3)),
        averageRating: parseFloat(averageRating.toFixed(2)),
        dateRange: {
          oldest: reviews[reviews.length - 1].processedAt,
          newest: reviews[0].processedAt,
        },
      },
    };
  } catch (error) {
    console.error("Error getting recent aggregated summary:", error);
    throw error;
  }
};

export default {
  combineSummaries,
  getAggregatedSummaryForCompany,
  getAggregatedSummaryBySentiment,
  getRecentAggregatedSummary,
};
