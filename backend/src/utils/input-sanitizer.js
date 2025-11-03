/**
 * Input Sanitizer Utility
 * 
 * Prevents XSS attacks, SQL injection, and other malicious inputs
 * Industry best practice: Always sanitize user inputs before processing
 */

/**
 * Sanitize text input (remove dangerous characters)
 * 
 * @param {string} input - User input text
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 */
export function sanitizeText(input, maxLength = 5000) {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize MongoDB ObjectId
 * 
 * @param {string} id - ObjectId string
 * @returns {string|null} Valid ObjectId or null
 */
export function sanitizeObjectId(id) {
  if (typeof id !== 'string') {
    return null;
  }

  // MongoDB ObjectId is exactly 24 hex characters
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdPattern.test(id)) {
    return null;
  }

  return id;
}

/**
 * Sanitize array of ObjectIds
 * 
 * @param {string[]} ids - Array of ObjectId strings
 * @param {number} maxCount - Maximum allowed array size
 * @returns {string[]} Array of valid ObjectIds
 */
export function sanitizeObjectIdArray(ids, maxCount = 10) {
  if (!Array.isArray(ids)) {
    return [];
  }

  // Limit array size
  const limitedIds = ids.slice(0, maxCount);

  // Filter and sanitize each ID
  return limitedIds
    .map(id => sanitizeObjectId(id))
    .filter(id => id !== null);
}

/**
 * Sanitize conversation history
 * 
 * @param {Array} history - Conversation history array
 * @param {number} maxMessages - Maximum number of messages to keep
 * @returns {Array} Sanitized history
 */
export function sanitizeConversationHistory(history, maxMessages = 20) {
  if (!Array.isArray(history)) {
    return [];
  }

  // Take only last N messages
  const recentHistory = history.slice(-maxMessages);

  return recentHistory
    .filter(msg => {
      // Must have role and content
      return (
        msg &&
        typeof msg === 'object' &&
        typeof msg.role === 'string' &&
        typeof msg.content === 'string'
      );
    })
    .map(msg => ({
      role: ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : 'user',
      content: sanitizeText(msg.content, 2000), // Limit message length
    }));
}

/**
 * Sanitize query parameters
 * 
 * @param {Object} query - Express req.query object
 * @returns {Object} Sanitized query parameters
 */
export function sanitizeQueryParams(query) {
  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Only allow alphanumeric keys
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      continue;
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value, 500);
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize pagination parameters
 * 
 * @param {Object} params - { page, limit }
 * @returns {Object} Validated pagination params
 */
export function sanitizePagination(params = {}) {
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 20;

  return {
    page: Math.max(1, Math.min(page, 1000)), // Max page 1000
    limit: Math.max(1, Math.min(limit, 100)), // Max 100 items per page
    skip: (Math.max(1, page) - 1) * Math.max(1, Math.min(limit, 100)),
  };
}

/**
 * Detect potentially malicious patterns
 * 
 * @param {string} input - User input
 * @returns {boolean} True if suspicious patterns detected
 */
export function detectMaliciousPatterns(input) {
  if (typeof input !== 'string') {
    return false;
  }

  const maliciousPatterns = [
    /<script/i,                    // XSS
    /javascript:/i,                // XSS
    /on\w+\s*=/i,                  // Event handlers
    /\$\{.*\}/,                    // Template injection
    /\{\{.*\}\}/,                  // Template injection
    /drop\s+table/i,               // SQL injection
    /union\s+select/i,             // SQL injection
    /\beval\s*\(/i,                // Code execution
    /\bexec\s*\(/i,                // Code execution
    /__proto__/,                   // Prototype pollution
    /\.\.\/\.\.\//,                // Path traversal
  ];

  return maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation for chatbot requests
 * 
 * @param {Object} requestBody - Express req.body
 * @returns {Object} { valid: boolean, errors: string[], sanitized: Object }
 */
export function validateChatbotRequest(requestBody) {
  const errors = [];
  const sanitized = {};

  // Validate message
  if (!requestBody.message || typeof requestBody.message !== 'string') {
    errors.push('Message is required and must be a string');
  } else if (requestBody.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (requestBody.message.length > 5000) {
    errors.push('Message is too long (max 5000 characters)');
  } else if (detectMaliciousPatterns(requestBody.message)) {
    errors.push('Message contains potentially malicious content');
  } else {
    sanitized.message = sanitizeText(requestBody.message);
  }

  // Validate locationIds (required for new implementation)
  if (!requestBody.locationIds) {
    errors.push('locationIds array is required');
  } else if (!Array.isArray(requestBody.locationIds)) {
    errors.push('locationIds must be an array');
  } else if (requestBody.locationIds.length === 0) {
    errors.push('At least one location must be attached');
  } else if (requestBody.locationIds.length > 10) {
    // Limit to 10 for CHATBOT specifically (to keep AI context manageable)
    // Note: Location checking can handle more (50), but chat should be focused
    errors.push('Maximum 10 locations can be attached to a single chat. Please create separate chats for more locations.');
  } else {
    sanitized.locationIds = sanitizeObjectIdArray(requestBody.locationIds, 10);
    if (sanitized.locationIds.length === 0) {
      errors.push('No valid location IDs provided');
    }
  }

  // Validate sessionId (optional)
  if (requestBody.sessionId) {
    if (typeof requestBody.sessionId !== 'string') {
      errors.push('sessionId must be a string');
    } else {
      sanitized.sessionId = sanitizeText(requestBody.sessionId, 100);
    }
  }

  // Validate conversation history (optional)
  if (requestBody.conversationHistory) {
    sanitized.conversationHistory = sanitizeConversationHistory(
      requestBody.conversationHistory,
      20
    );
  } else {
    sanitized.conversationHistory = [];
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

export default {
  sanitizeText,
  sanitizeObjectId,
  sanitizeObjectIdArray,
  sanitizeConversationHistory,
  sanitizeQueryParams,
  sanitizePagination,
  detectMaliciousPatterns,
  validateChatbotRequest,
};
