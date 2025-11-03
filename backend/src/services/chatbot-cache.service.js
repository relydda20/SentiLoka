import Redis from 'ioredis';

/**
 * Chatbot Cache Service
 *
 * Reduces redundant processing by caching:
 * 1. Review aggregations (stats, keywords, topics)
 * 2. AI-generated summaries
 * 3. Location comparisons
 *
 * Integrates with scraper workflow to auto-invalidate when new reviews arrive
 */

// Reuse the same Redis configuration from queue.config.js
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  console.error('❌ Chatbot cache Redis error:', err);
});

redis.on('connect', () => {
  console.log('✅ Chatbot cache connected to Redis');
});

/**
 * Cache TTL (Time To Live) in seconds
 * These are aggressive TTLs - data stays fresh but saves API calls
 */
const CACHE_TTL = {
  CONTEXT: 1800,     // 30 minutes - review stats/aggregations
  SUMMARY: 3600,     // 1 hour - AI-generated combined summary
  COMPARISON: 1800,  // 30 minutes - location comparison data
};

/**
 * Build cache key for review context
 * Supports multiple locations by sorting IDs for consistent cache keys
 */
function buildContextKey(userId, locationIds = null) {
  if (!locationIds || locationIds.length === 0) {
    return `chatbot:ctx:${userId}:global`;
  }
  
  // Single location (backward compatible)
  if (locationIds.length === 1) {
    return `chatbot:ctx:${userId}:loc:${locationIds[0]}`;
  }
  
  // Multiple locations: sort IDs for consistent caching
  // Example: [loc2, loc1, loc3] → "loc1+loc2+loc3"
  const sortedIds = Array.isArray(locationIds) 
    ? [...locationIds].sort().join('+')
    : locationIds;
  
  return `chatbot:ctx:${userId}:locs:${sortedIds}`;
}

/**
 * Build cache key for AI summary
 * Supports multiple locations by sorting IDs for consistent cache keys
 */
function buildSummaryKey(userId, locationIds = null) {
  if (!locationIds || locationIds.length === 0) {
    return `chatbot:sum:${userId}:global`;
  }
  
  // Single location (backward compatible)
  if (locationIds.length === 1) {
    return `chatbot:sum:${userId}:loc:${locationIds[0]}`;
  }
  
  // Multiple locations: sort IDs for consistent caching
  const sortedIds = Array.isArray(locationIds)
    ? [...locationIds].sort().join('+')
    : locationIds;
  
  return `chatbot:sum:${userId}:locs:${sortedIds}`;
}

/**
 * Build cache key for location comparison
 */
function buildComparisonKey(userId, locationId1, locationId2) {
  // Normalize order to ensure consistent caching regardless of param order
  const [loc1, loc2] = [locationId1, locationId2].sort();
  return `chatbot:cmp:${userId}:${loc1}:${loc2}`;
}

/**
 * Get cached review context (aggregations, stats, keywords, topics)
 * This is the expensive database query + processing we want to avoid repeating
 * Now supports single or multiple locationIds
 */
export async function getCachedContext(userId, locationIds = null) {
  try {
    const key = buildContextKey(userId, locationIds);
    const cached = await redis.get(key);

    if (cached) {
      const locationCount = Array.isArray(locationIds) ? locationIds.length : (locationIds ? 1 : 0);
      console.log(`✅ Cache HIT: ${key} (${locationCount} location${locationCount !== 1 ? 's' : ''})`);
      return JSON.parse(cached);
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('Error getting cached context:', error);
    return null; // Fail gracefully
  }
}

/**
 * Set cached review context
 * Now supports single or multiple locationIds
 */
export async function setCachedContext(userId, context, locationIds = null) {
  try {
    const key = buildContextKey(userId, locationIds);
    await redis.setex(key, CACHE_TTL.CONTEXT, JSON.stringify(context));
    const locationCount = Array.isArray(locationIds) ? locationIds.length : (locationIds ? 1 : 0);
    console.log(`💾 Cached context: ${key} (${locationCount} location${locationCount !== 1 ? 's' : ''}, TTL: ${CACHE_TTL.CONTEXT}s)`);
  } catch (error) {
    console.error('Error setting cached context:', error);
  }
}

/**
 * Get cached AI-generated summary
 * This saves an OpenAI API call ($$$ savings!)
 * Now supports single or multiple locationIds
 */
export async function getCachedSummary(userId, locationIds = null) {
  try {
    const key = buildSummaryKey(userId, locationIds);
    const cached = await redis.get(key);

    if (cached) {
      const locationCount = Array.isArray(locationIds) ? locationIds.length : (locationIds ? 1 : 0);
      console.log(`✅ Cache HIT (AI Summary): ${key} (${locationCount} location${locationCount !== 1 ? 's' : ''})`);
      return cached;
    }

    console.log(`❌ Cache MISS (AI Summary): ${key}`);
    return null;
  } catch (error) {
    console.error('Error getting cached summary:', error);
    return null;
  }
}

/**
 * Set cached AI-generated summary
 * Now supports single or multiple locationIds
 */
export async function setCachedSummary(userId, summary, locationIds = null) {
  try {
    const key = buildSummaryKey(userId, locationIds);
    await redis.setex(key, CACHE_TTL.SUMMARY, summary);
    const locationCount = Array.isArray(locationIds) ? locationIds.length : (locationIds ? 1 : 0);
    console.log(`💾 Cached AI summary: ${key} (${locationCount} location${locationCount !== 1 ? 's' : ''}, TTL: ${CACHE_TTL.SUMMARY}s)`);
  } catch (error) {
    console.error('Error setting cached summary:', error);
  }
}

/**
 * Get cached location comparison
 */
export async function getCachedComparison(userId, locationId1, locationId2) {
  try {
    const key = buildComparisonKey(userId, locationId1, locationId2);
    const cached = await redis.get(key);

    if (cached) {
      console.log(`✅ Cache HIT (Comparison): ${key}`);
      return JSON.parse(cached);
    }

    console.log(`❌ Cache MISS (Comparison): ${key}`);
    return null;
  } catch (error) {
    console.error('Error getting cached comparison:', error);
    return null;
  }
}

/**
 * Set cached location comparison
 */
export async function setCachedComparison(userId, locationId1, locationId2, comparisonData) {
  try {
    const key = buildComparisonKey(userId, locationId1, locationId2);
    await redis.setex(key, CACHE_TTL.COMPARISON, JSON.stringify(comparisonData));
    console.log(`💾 Cached comparison: ${key} (TTL: ${CACHE_TTL.COMPARISON}s)`);
  } catch (error) {
    console.error('Error setting cached comparison:', error);
  }
}

/**
 * IMPORTANT: Invalidate cache when new reviews are analyzed
 * Call this from sentiment analysis controller after batch analysis completes
 *
 * @param {string} userId - User ID
 * @param {string|string[]} locationIds - Location ID(s) (optional, if null invalidates all user cache)
 */
export async function invalidateCacheForLocation(userId, locationIds = null) {
  try {
    const keysToDelete = [];

    if (locationIds) {
      // Convert to array for uniform handling
      const ids = Array.isArray(locationIds) ? locationIds : [locationIds];

      for (const locationId of ids) {
        // Invalidate single-location caches
        keysToDelete.push(
          buildContextKey(userId, [locationId]),
          buildSummaryKey(userId, [locationId])
        );

        // Invalidate any multi-location caches involving this location
        const multiLocPattern = `chatbot:*:${userId}:locs:*${locationId}*`;
        const multiLocKeys = await redis.keys(multiLocPattern);
        keysToDelete.push(...multiLocKeys);

        // Invalidate any comparisons involving this location
        const comparisonPattern = `chatbot:cmp:${userId}:*${locationId}*`;
        const comparisonKeys = await redis.keys(comparisonPattern);
        keysToDelete.push(...comparisonKeys);
      }

      // Also invalidate global cache (since it includes these locations' reviews)
      keysToDelete.push(
        buildContextKey(userId, null),
        buildSummaryKey(userId, null)
      );

    } else {
      // Invalidate ALL user caches (used when we don't know which location changed)
      const allUserKeys = await redis.keys(`chatbot:*:${userId}:*`);
      keysToDelete.push(...allUserKeys);
    }

    if (keysToDelete.length > 0) {
      // Remove duplicates
      const uniqueKeys = [...new Set(keysToDelete)];
      await redis.del(...uniqueKeys);
      const locationCount = Array.isArray(locationIds) ? locationIds.length : (locationIds ? 1 : 'all');
      console.log(`🗑️ Cache invalidated: ${uniqueKeys.length} keys for user ${userId} (${locationCount} location${locationCount !== 1 && locationCount !== 'all' ? 's' : ''})`);
      return uniqueKeys.length;
    }

    return 0;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats() {
  try {
    const keys = await redis.keys('chatbot:*');

    return {
      totalKeys: keys.length,
      breakdown: {
        contexts: keys.filter(k => k.includes(':ctx:')).length,
        summaries: keys.filter(k => k.includes(':sum:')).length,
        comparisons: keys.filter(k => k.includes(':cmp:')).length,
      }
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

export default {
  getCachedContext,
  setCachedContext,
  getCachedSummary,
  setCachedSummary,
  getCachedComparison,
  setCachedComparison,
  invalidateCacheForLocation,
  getCacheStats,
};
