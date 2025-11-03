import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and ensures fair usage
 */

/**
 * Rate limiter for sentiment analysis endpoints
 * Higher limit for core functionality
 */
export const sentimentAnalysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many sentiment analysis requests. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for batch operations
 * Lower limit for resource-intensive operations
 */
export const batchOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 batch operations per minute
  message: {
    error: 'Too many batch operations. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for chatbot endpoints
 * Moderate limit for AI interactions
 */
export const chatbotRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 chatbot messages per minute
  message: {
    error: 'Too many chatbot requests. Please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for location readiness checks
 * Higher limit for lightweight validation
 */
export const locationCheckRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 checks per minute
  message: {
    error: 'Too many location check requests. Please try again shortly.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for comparison operations
 * Lower limit for complex multi-location analysis
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 comparison/strict requests per minute
  message: {
    error: 'Too many comparison requests. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for read operations (GET requests)
 * Higher limit for data retrieval
 */
export const readRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 read requests per minute
  message: {
    error: 'Too many requests. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for all other endpoints
 * Balanced limit for general API usage
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  sentimentAnalysisLimiter,
  batchOperationLimiter,
  chatbotRateLimiter,
  locationCheckRateLimiter,
  strictRateLimiter,
  readRateLimiter,
  generalLimiter,
};
