// services/replyService.js
import apiClient from "../utils/apiClient"; // Adjust path based on your project structure

/**
 * Generate an AI reply for a review
 * @param {Object} params - Parameters for generating the reply
 * @param {string} params.reviewText - The text content of the review
 * @param {number} params.rating - The rating given (1-5)
 * @param {string} params.sentiment - The sentiment of the review (e.g., 'positive', 'neutral', 'negative')
 * @param {string} params.tone - The tone of the reply (e.g., 'Friendly', 'Professional')
 * @param {string} params.style - The style of the reply (e.g., 'Casual', 'Formal')
 * @param {string} params.length - The desired length ('Short', 'Medium', 'Long')
 * @returns {Promise<string>} The generated reply text
 */
export const generateReviewReply = async ({
  reviewText,
  rating,
  sentiment,
  tone,
  style,
  length,
}) => {
  try {
    const response = await apiClient.post("/reviews/generate-reply", {
      reviewText,
      rating,
      sentiment,
      tone,
      style,
      length,
    });

    return response.data.reply;
  } catch (error) {
    console.error("Error generating review reply:", error);
    throw new Error(
      error.response?.data?.message || "Failed to generate reply",
    );
  }
};

/**
 * Regenerate an AI reply with different parameters or for variation
 * @param {Object} params - Parameters for regenerating the reply
 * @param {string} params.reviewText - The text content of the review
 * @param {number} params.rating - The rating given (1-5)
 * @param {string} params.sentiment - The sentiment of the review
 * @param {string} params.previousReply - The previously generated reply
 * @param {string} params.tone - The tone of the reply
 * @param {string} params.style - The style of the reply
 * @param {string} params.length - The desired length
 * @returns {Promise<string>} The regenerated reply text
 */
export const regenerateReviewReply = async ({
  reviewText,
  rating,
  sentiment,
  previousReply,
  tone,
  style,
  length,
}) => {
  try {
    const response = await apiClient.post("/reviews/regenerate-reply", {
      reviewText,
      rating,
      sentiment,
      previousReply,
      tone,
      style,
      length,
    });

    return response.data.reply;
  } catch (error) {
    console.error("Error regenerating review reply:", error);
    throw new Error(
      error.response?.data?.message || "Failed to regenerate reply",
    );
  }
};
