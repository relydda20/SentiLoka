import { OpenAI } from "openai";
import { CONFIG } from "../config/sentiment-analysis-config.js";

// Initialize OpenAI client with custom base URL and API key
const openaiClient = new OpenAI({
  baseURL: CONFIG.GPT4O_MINI_BASE_URL,
  apiKey: CONFIG.GPT4O_MINI_API_KEY,
});

/**
 * Analyze sentiment of given text using GPT-4o-mini
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} - Sentiment analysis result
 */
export const analyzeSentiment = async (text) => {
  try {
    const response = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert running as a local analysis agent.

## General
- Your task is to analyze the sentiment of a given text and respond in a strict JSON format.
- You must not include any markdown, code blocks, or additional explanations outside the JSON.
- Respond concisely and consistently with clear numeric and textual sentiment indicators.

## Output Format
The response must follow this exact JSON structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <number between -1 and 1>,
  "confidence": <number between 0 and 1>,
  "keywords": ["keyword1", "keyword2"],
  "summary": "brief summary of the sentiment"
}

## Rules
- "sentiment": classification of the overall emotional tone.
- "score": numerical sentiment strength from -1 (very negative) to 1 (very positive).
- "confidence": confidence level of the analysis between 0 and 1.
- "keywords": list of the most influential words or phrases.
- "summary": a short explanation written to summarize the sentiment.
- Do not include any text outside of the JSON object.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;

    // Parse the JSON response
    const sentimentData = JSON.parse(content);

    return {
      success: true,
      data: sentimentData,
      rawResponse: content,
    };
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    throw error;
  }
};

/**
 * Analyze sentiment with streaming response
 * @param {string} text - The text to analyze
 * @returns {AsyncGenerator} - Stream of sentiment analysis chunks
 */

export const analyzeSentimentStream = async function* (text) {
  try {
    const stream = await openaiClient.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert running as a local analysis agent.

## General
- Your task is to analyze the sentiment of a given text.
- Respond strictly using valid JSON only — no markdown, no code fences, and no additional commentary.
- Focus on determining the emotional tone, strength, and key influences of the text.

## Output Format
The response must follow this exact JSON structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <number between -1 and 1>,
  "confidence": <number between 0 and 1>,
  "keywords": ["keyword1", "keyword2"],
  "summary": "brief summary of the sentiment"
}

## Rules
- "sentiment": overall emotional classification of the text.
- "score": sentiment polarity value between -1 (very negative) and 1 (very positive).
- "confidence": level of certainty in the classification, from 0 to 1.
- "keywords": list of the most relevant or influential words in the sentiment.
- "summary": concise explanation of the sentiment findings.
- Never include any output or characters outside the JSON object.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 500,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  } catch (error) {
    console.error("Error streaming sentiment analysis:", error);
    throw error;
  }
};

/**
 * Batch analyze multiple texts
 * @param {string[]} texts - Array of texts to analyze
 * @returns {Promise<Object[]>} - Array of sentiment analysis results
 */
export const batchAnalyzeSentiment = async (texts) => {
  try {
    const results = await Promise.all(
      texts.map((text) => analyzeSentiment(text))
    );
    return results;
  } catch (error) {
    console.error("Error in batch sentiment analysis:", error);
    throw error;
  }
};

export default openaiClient;
