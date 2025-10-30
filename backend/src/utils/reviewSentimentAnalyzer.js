import { OpenAI } from "openai";
import { CONFIG } from "../config/sentiment-analysis-config.js";

// Initialize OpenAI client
const openaiClient = new OpenAI({
  baseURL: CONFIG.GPT4O_MINI_BASE_URL,
  apiKey: CONFIG.GPT4O_MINI_API_KEY,
});

/**
 * Analyze sentiment of a review with enhanced output
 * @param {Object} review - Review object with author, rating, text (description)
 * @returns {Promise<Object>} - Enhanced sentiment analysis result
 */
export const analyzeReviewSentiment = async (review) => {
  try {
    const { author, rating, description } = review;
    const text = description?.en || description || "";

    if (!text || text.trim().length === 0) {
      throw new Error("Review text is empty");
    }

    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert sentiment analyzer for customer reviews. Analyze the given review text and respond ONLY with valid JSON (no markdown, no backticks):
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentiment_score": <number between -1 and 1>,
  "confidence": <number between 0 and 1>,
  "sentiment_keywords": ["keyword1", "keyword2", ...],
  "contextual_topics": ["topic1", "topic2", ...],
  "summary": "brief summary of the sentiment and key points"
}

Where:
- sentiment: overall sentiment classification
- sentiment_score: -1 (very negative) to 1 (very positive)
- confidence: how confident the analysis is (0-1)
- sentiment_keywords: important words/phrases that influenced the sentiment (5-10 keywords)
- contextual_topics: main topics/themes discussed in the review (3-5 topics like "service quality", "pricing", "cleanliness")
- summary: a brief explanation of the sentiment and main points, explained in Bahasa Indonesia only.`,
        },
        {
          role: "user",
          content: `Review Rating: ${rating}/5
Review Text: ${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content;
    const sentimentData = JSON.parse(content);

    return {
      author,
      rating: parseFloat(rating),
      text,
      sentiment: sentimentData.sentiment,
      sentiment_score: sentimentData.sentiment_score,
      confidence: sentimentData.confidence,
      sentiment_keywords: sentimentData.sentiment_keywords || [],
      contextual_topics: sentimentData.contextual_topics || [],
      summary: sentimentData.summary,
      processed_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error analyzing review sentiment:", error);
    throw error;
  }
};

/**
 * Process a single batch of reviews
 * @param {Array} reviews - Array of review objects
 * @returns {Promise<Array>} - Array of analyzed reviews
 */
export const processBatch = async (reviews) => {
  const results = await Promise.all(
    reviews.map(async (review) => {
      try {
        return await analyzeReviewSentiment(review);
      } catch (error) {
        return {
          author: review.author,
          rating: review.rating,
          text: review.description?.en || review.description || "",
          sentiment: "error",
          error: error.message,
          processed_at: new Date().toISOString(),
        };
      }
    })
  );

  return results;
};

/**
 * Process reviews with parallel batch processing
 * @param {Array} reviews - All reviews to process
 * @param {Number} batchSize - Number of reviews per batch (default: 15)
 * @param {Number} concurrentBatches - Number of batches to process concurrently (default: 10)
 * @returns {Promise<Object>} - Processing results with statistics
 */
export const processReviewsParallel = async (
  reviews,
  batchSize = CONFIG.BATCH_SIZE,
  concurrentBatches = CONFIG.CONCURRENT_BATCHES
) => {
  const startTime = Date.now();
  const allResults = [];
  const totalReviews = reviews.length;

  // Split reviews into batches
  const batches = [];
  for (let i = 0; i < reviews.length; i += batchSize) {
    batches.push(reviews.slice(i, i + batchSize));
  }

  console.log(
    `Processing ${totalReviews} reviews in ${batches.length} batches (${batchSize} reviews per batch, ${concurrentBatches} concurrent batches)`
  );

  // Process batches in groups of concurrentBatches
  for (let i = 0; i < batches.length; i += concurrentBatches) {
    const batchGroup = batches.slice(i, i + concurrentBatches);
    const batchGroupNumber = Math.floor(i / concurrentBatches) + 1;
    const totalBatchGroups = Math.ceil(batches.length / concurrentBatches);

    console.log(
      `Processing batch group ${batchGroupNumber}/${totalBatchGroups} (${batchGroup.length} batches)`
    );

    const groupResults = await Promise.all(
      batchGroup.map((batch, index) => {
        const batchNumber = i + index + 1;
        console.log(
          `  Starting batch ${batchNumber}/${batches.length} (${batch.length} reviews)`
        );
        return processBatch(batch);
      })
    );

    // Flatten and add to all results
    groupResults.forEach((batchResults) => {
      allResults.push(...batchResults);
    });

    console.log(
      `Completed batch group ${batchGroupNumber}/${totalBatchGroups}. Total processed: ${allResults.length}/${totalReviews}`
    );
  }

  const endTime = Date.now();
  const processingTime = (endTime - startTime) / 1000;

  // Calculate statistics
  const successfulAnalyses = allResults.filter((r) => r.sentiment !== "error");
  const failedAnalyses = allResults.filter((r) => r.sentiment === "error");

  const sentimentDistribution = successfulAnalyses.reduce(
    (acc, r) => {
      acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0 }
  );

  const averageScore =
    successfulAnalyses.length > 0
      ? successfulAnalyses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) /
        successfulAnalyses.length
      : 0;

  const averageRating =
    successfulAnalyses.length > 0
      ? successfulAnalyses.reduce((sum, r) => sum + r.rating, 0) /
        successfulAnalyses.length
      : 0;

  // Collect all keywords and topics
  const allKeywords = {};
  const allTopics = {};

  successfulAnalyses.forEach((r) => {
    r.sentiment_keywords?.forEach((keyword) => {
      allKeywords[keyword] = (allKeywords[keyword] || 0) + 1;
    });
    r.contextual_topics?.forEach((topic) => {
      allTopics[topic] = (allTopics[topic] || 0) + 1;
    });
  });

  // Sort and get top keywords and topics
  const topKeywords = Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));

  const topTopics = Object.entries(allTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  return {
    results: allResults,
    statistics: {
      totalReviews,
      successfulAnalyses: successfulAnalyses.length,
      failedAnalyses: failedAnalyses.length,
      processingTimeSeconds: processingTime.toFixed(2),
      averageProcessingTimePerReview: (processingTime / totalReviews).toFixed(3),
      sentimentDistribution,
      averageSentimentScore: averageScore.toFixed(3),
      averageRating: averageRating.toFixed(2),
      topKeywords,
      topTopics,
      batchConfiguration: {
        batchSize,
        concurrentBatches,
        totalBatches: batches.length,
      },
    },
  };
};

export default {
  analyzeReviewSentiment,
  processBatch,
  processReviewsParallel,
};
