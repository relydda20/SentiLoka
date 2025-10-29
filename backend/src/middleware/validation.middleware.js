/**
 * Validation middleware for sentiment analysis requests
 */

/**
 * Validate single text sentiment analysis request
 */
export const validateSentimentRequest = (req, res, next) => {
  const { text } = req.body;

  // Check if text is provided
  if (!text) {
    return res.status(400).json({
      success: false,
      error: "Text is required for sentiment analysis",
    });
  }

  // Check if text is a string
  if (typeof text !== "string") {
    return res.status(400).json({
      success: false,
      error: "Text must be a string",
    });
  }

  // Check if text is not empty
  if (text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Text cannot be empty",
    });
  }

  // Check text length (max 5000 characters)
  if (text.length > 5000) {
    return res.status(400).json({
      success: false,
      error: "Text is too long. Maximum length is 5000 characters",
    });
  }

  next();
};

/**
 * Validate batch sentiment analysis request
 */
export const validateBatchSentimentRequest = (req, res, next) => {
  const { texts } = req.body;

  // Check if texts array is provided
  if (!texts) {
    return res.status(400).json({
      success: false,
      error: "Texts array is required for batch sentiment analysis",
    });
  }

  // Check if texts is an array
  if (!Array.isArray(texts)) {
    return res.status(400).json({
      success: false,
      error: "Texts must be an array",
    });
  }

  // Check if array is not empty
  if (texts.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Texts array cannot be empty",
    });
  }

  // Check array length (max 10 items for batch processing)
  if (texts.length > 10) {
    return res.status(400).json({
      success: false,
      error: "Maximum 10 texts allowed per batch request",
    });
  }

  // Validate each text in the array
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    if (typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: `Text at index ${i} must be a string`,
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: `Text at index ${i} cannot be empty`,
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: `Text at index ${i} is too long. Maximum length is 5000 characters`,
      });
    }
  }

  next();
};

/**
 * Error handling middleware for async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
