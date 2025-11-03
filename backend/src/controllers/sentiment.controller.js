import {
  analyzeSentiment,
  analyzeSentimentStream,
  batchAnalyzeSentiment,
} from "../utils/openaiClient.js";

/**
 * Analyze sentiment of a single text
 * @route POST /api/sentiment/analyze
 */
export const analyzeSingleText = async (req, res) => {
  try {
    const { text } = req.body;

    const result = await analyzeSentiment(text);

    return res.status(200).json({
      success: true,
      message: "Sentiment analysis completed successfully",
      data: result.data,
      metadata: {
        textLength: text.length,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in analyzeSingleText:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: "Failed to parse sentiment analysis response",
        details: error.message,
      });
    }

    // Handle OpenAI API errors
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: "OpenAI API error",
        details: error.message,
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: "Failed to analyze sentiment",
      details: error.message,
    });
  }
};

/**
 * Analyze sentiment with streaming response
 * @route POST /api/sentiment/analyze-stream
 */
export const analyzeSingleTextStream = async (req, res) => {
  try {
    const { text } = req.body;

    // Set headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial metadata
    res.write(
      `data: ${JSON.stringify({
        type: "metadata",
        textLength: text.length,
        startedAt: new Date().toISOString(),
      })}\n\n`
    );

    let fullContent = "";

    // Stream the response
    for await (const chunk of analyzeSentimentStream(text)) {
      fullContent += chunk;
      res.write(
        `data: ${JSON.stringify({
          type: "chunk",
          content: chunk,
        })}\n\n`
      );
    }

    // Try to parse the final result
    try {
      const parsedResult = JSON.parse(fullContent);
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          data: parsedResult,
          completedAt: new Date().toISOString(),
        })}\n\n`
      );
    } catch (parseError) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: "Failed to parse final result",
          rawContent: fullContent,
        })}\n\n`
      );
    }

    res.end();
  } catch (error) {
    console.error("Error in analyzeSingleTextStream:", error);

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        error: "Failed to analyze sentiment",
        details: error.message,
      })}\n\n`
    );

    res.end();
  }
};

/**
 * Batch analyze sentiment of multiple texts
 * @route POST /api/sentiment/batch-analyze
 */
export const analyzeBatchTexts = async (req, res) => {
  try {
    const { texts } = req.body;

    const results = await batchAnalyzeSentiment(texts);

    // Calculate aggregate statistics
    const successfulAnalyses = results.filter((r) => r.success);
    const averageScore =
      successfulAnalyses.reduce((sum, r) => sum + r.data.score, 0) /
      successfulAnalyses.length;
    const sentimentDistribution = successfulAnalyses.reduce(
      (acc, r) => {
        acc[r.data.sentiment] = (acc[r.data.sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    return res.status(200).json({
      success: true,
      message: "Batch sentiment analysis completed successfully",
      data: results.map((r) => r.data),
      metadata: {
        totalTexts: texts.length,
        successfulAnalyses: successfulAnalyses.length,
        averageScore: averageScore.toFixed(3),
        sentimentDistribution,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in analyzeBatchTexts:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to batch analyze sentiments",
      details: error.message,
    });
  }
};

/**
 * Health check for sentiment analysis service
 * @route GET /api/sentiment/health
 */
export const healthCheck = async (req, res) => {
  try {
    // Test with a simple sentiment analysis
    const testResult = await analyzeSentiment("This is a test.");

    return res.status(200).json({
      success: true,
      message: "Sentiment analysis service is healthy",
      serviceStatus: "operational",
      timestamp: new Date().toISOString(),
      testAnalysis: testResult.success,
    });
  } catch (error) {
    console.error("Error in sentiment service health check:", error);

    return res.status(503).json({
      success: false,
      message: "Sentiment analysis service is unhealthy",
      serviceStatus: "degraded",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};
