import openaiClient from "../utils/openaiClient.js";

/**
 * Generate an AI-powered reply for a review
 * @param {Object} params - Parameters for generating the reply
 * @param {string} params.reviewText - The text content of the review
 * @param {number} params.rating - The rating given (1-5)
 * @param {string} params.sentiment - The sentiment of the review (e.g., 'positive', 'neutral', 'negative')
 * @param {string} params.tone - The tone of the reply (e.g., 'Friendly', 'Professional', 'Empathetic')
 * @param {string} params.style - The style of the reply (e.g., 'Casual', 'Formal', 'Conversational')
 * @param {string} params.length - The desired length ('Short', 'Medium', 'Long')
 * @returns {Promise<string>} The generated reply text
 */
export const generateReply = async ({
  reviewText,
  rating,
  sentiment,
  tone = "Professional",
  style = "Formal",
  length = "Medium",
}) => {
  try {
    // Validate required parameters
    if (!reviewText || rating === undefined || !sentiment) {
      throw new Error(
        "Missing required parameters: reviewText, rating, and sentiment are required"
      );
    }

    // Build the system prompt based on tone, style, and length
    const systemPrompt = buildSystemPrompt(tone, style, length);

    // Build the user prompt with review details
    const userPrompt = buildUserPrompt(reviewText, rating, sentiment);

    // Call OpenAI API
    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: getMaxTokens(length),
    });

    const generatedReply = response.choices[0].message.content.trim();

    return generatedReply;
  } catch (error) {
    console.error("Error generating reply:", error);
    throw new Error(
      error.message || "Failed to generate reply using AI"
    );
  }
};

/**
 * Regenerate an AI-powered reply with a different approach
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
export const regenerateReply = async ({
  reviewText,
  rating,
  sentiment,
  previousReply,
  tone = "Professional",
  style = "Formal",
  length = "Medium",
}) => {
  try {
    // Validate required parameters
    if (!reviewText || rating === undefined || !sentiment) {
      throw new Error(
        "Missing required parameters: reviewText, rating, and sentiment are required"
      );
    }

    // Build the system prompt based on tone, style, and length
    const systemPrompt = buildSystemPrompt(tone, style, length, true);

    // Build the user prompt with review details and previous reply
    const userPrompt = buildUserPrompt(
      reviewText,
      rating,
      sentiment,
      previousReply
    );

    // Call OpenAI API with higher temperature for more variation
    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.9, // Higher temperature for more creative variation
      max_tokens: getMaxTokens(length),
    });

    const generatedReply = response.choices[0].message.content.trim();

    return generatedReply;
  } catch (error) {
    console.error("Error regenerating reply:", error);
    throw new Error(
      error.message || "Failed to regenerate reply using AI"
    );
  }
};

/**
 * Build the system prompt based on tone, style, and length preferences
 * @param {string} tone - The desired tone
 * @param {string} style - The desired style
 * @param {string} length - The desired length
 * @param {boolean} isRegeneration - Whether this is a regeneration request
 * @returns {string} The system prompt
 */
function buildSystemPrompt(tone, style, length, isRegeneration = false) {
  const toneGuidelines = {
    Friendly:
      "Use a warm, approachable tone. Be personable and create a connection with the reviewer.",
    Professional:
      "Maintain a courteous and business-appropriate tone. Be respectful and competent.",
    Empathetic:
      "Show understanding and compassion. Acknowledge the reviewer's feelings and experiences.",
    Enthusiastic:
      "Express energy and excitement. Show genuine appreciation and positivity.",
    Apologetic:
      "Express sincere regret when appropriate. Take responsibility and show commitment to improvement.",
  };

  const styleGuidelines = {
    Casual:
      "Use conversational language. Keep it relaxed and natural, as if speaking to a friend.",
    Formal:
      "Use proper grammar and structured sentences. Maintain professional distance and respect.",
    Conversational:
      "Balance between casual and formal. Be natural but respectful.",
    Concise:
      "Get straight to the point. Use clear, direct language without unnecessary words.",
    Detailed:
      "Provide thorough responses. Address all points and offer comprehensive information.",
  };

  const lengthGuidelines = {
    Short: "Keep the reply brief and to the point (2-3 sentences, approximately 30-50 words).",
    Medium:
      "Provide a balanced response (3-5 sentences, approximately 50-100 words).",
    Long: "Give a comprehensive reply (5-8 sentences, approximately 100-150 words).",
  };

  const regenerationNote = isRegeneration
    ? "\n\n**IMPORTANT**: You are regenerating a reply. The user wants a DIFFERENT version, so provide fresh wording, alternative phrasing, and a unique approach while maintaining the same tone, style, and length guidelines."
    : "";

  return `You are a professional review response assistant for a multilingual location-based review system.

## General Guidelines
- Your PRIMARY task is to generate thoughtful, contextual replies to customer reviews.
- **CRITICAL LANGUAGE RULE**: You MUST respond in the EXACT SAME LANGUAGE as the review text.
  - If the review is in Bahasa Indonesia then reply in Bahasa Indonesia
  - If the review is in English then reply in English
  - If the review is in another language then reply in that same language
- Carefully analyze the review language first before generating your response.
- Read the review text, rating, and sentiment carefully to understand the customer's experience.
- Tailor your response appropriately based on whether the review is positive, neutral, or negative.
- Never include any markdown formatting, code blocks, or JSON in your response.
- Provide only the reply text that can be directly posted as a response to the review.

## Tone Guidelines
${toneGuidelines[tone] || toneGuidelines.Professional}

## Style Guidelines
${styleGuidelines[style] || styleGuidelines.Formal}

## Length Guidelines
${lengthGuidelines[length] || lengthGuidelines.Medium}

## Response Strategy by Sentiment

### Positive Reviews (sentiment: positive, rating: 4-5)
- Express genuine gratitude for their positive feedback
- Highlight specific aspects they mentioned
- Invite them to visit again
- Keep the energy positive and appreciative

### Neutral Reviews (sentiment: neutral, rating: 3)
- Thank them for their feedback
- Acknowledge their experience
- Express commitment to improvement
- Invite them to give you another chance

### Negative Reviews (sentiment: negative, rating: 1-2)
- Start with a sincere apology
- Acknowledge their specific concerns
- Take responsibility without making excuses
- Explain steps being taken to address issues
- Offer to make things right if possible
- Provide contact information for follow-up if appropriate

## Key Rules
- **LANGUAGE MATCHING IS MANDATORY**: Your reply MUST be in the same language as the review
- Always be respectful and professional
- Never be defensive or argumentative
- Personalize the response based on the review content
- Use the reviewer's specific points when possible
- Keep the language appropriate for public viewing${regenerationNote}`;
}

/**
 * Build the user prompt with review details
 * @param {string} reviewText - The review text
 * @param {number} rating - The rating (1-5)
 * @param {string} sentiment - The sentiment (positive/neutral/negative)
 * @param {string} previousReply - Optional previous reply for regeneration
 * @returns {string} The user prompt
 */
function buildUserPrompt(reviewText, rating, sentiment, previousReply = null) {
  let prompt = `Please generate a reply for the following review:

**Review Text**: "${reviewText}"
**Rating**: ${rating}/5
**Sentiment**: ${sentiment}`;

  if (previousReply) {
    prompt += `\n\n**Previous Reply**: "${previousReply}"\n\nPlease generate a DIFFERENT reply with alternative wording and approach.`;
  }

  prompt += `\n\n**CRITICAL INSTRUCTION**:
1. First, identify the language of the review text above
2. Generate your reply in the EXACT SAME LANGUAGE as the review
3. Do not mix languages or translate - match the review's language precisely

Generate your reply now:`;

  return prompt;
}

/**
 * Get max tokens based on desired length
 * @param {string} length - The desired length (Short/Medium/Long)
 * @returns {number} The max tokens
 */
function getMaxTokens(length) {
  const tokenLimits = {
    Short: 100,
    Medium: 200,
    Long: 300,
  };

  return tokenLimits[length] || tokenLimits.Medium;
}
