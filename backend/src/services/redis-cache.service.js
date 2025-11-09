import Redis from 'ioredis';

// Create Redis client for caching
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Redis connection event handlers
redisClient.on('connect', () => {
  console.log('✓ Redis cache client connected');
});

redisClient.on('error', (error) => {
  console.error('Redis cache client error:', error);
});

redisClient.on('ready', () => {
  console.log('✓ Redis cache client ready');
});

// Connect to Redis
redisClient.connect().catch((error) => {
  console.error('Failed to connect to Redis:', error);
});

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Cache TTL (Time To Live) in seconds
  TTL: {
    REVIEWS: 60 * 60 * 24, // 24 hours for reviews
    REVIEWS_SUMMARY: 60 * 60 * 12, // 12 hours for review summaries
    LOCATION_STATS: 60 * 60 * 6, // 6 hours for location statistics
    LOCATION_SENTIMENTS: 60 * 60 * 12, // 12 hours for sentiment data
    SHORT: 60 * 30, // 30 minutes for frequently changing data
  },
  // Cache key prefixes
  PREFIX: {
    REVIEWS: 'reviews',
    REVIEWS_SUMMARY: 'reviews:summary',
    LOCATION_STATS: 'location:stats',
    LOCATION_SENTIMENTS: 'location:sentiments',
    REVIEW_BY_ID: 'review',
  },
};

/**
 * Generate cache key
 */
const generateKey = (prefix, ...identifiers) => {
  return `${prefix}:${identifiers.join(':')}`;
};

/**
 * Set cache with TTL
 */
export const setCache = async (key, value, ttl = CACHE_CONFIG.TTL.REVIEWS) => {
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Get cache by key
 */
export const getCache = async (key) => {
  try {
    const cached = await redisClient.get(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Delete cache by key
 */
export const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete cache by pattern
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    
    const pipeline = redisClient.pipeline();
    keys.forEach((key) => pipeline.del(key));
    await pipeline.exec();
    
    console.log(`✓ Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
    return keys.length;
  } catch (error) {
    console.error(`Error deleting cache by pattern ${pattern}:`, error);
    return 0;
  }
};

/**
 * Check if cache exists
 */
export const hasCache = async (key) => {
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`Error checking cache existence for key ${key}:`, error);
    return false;
  }
};

/**
 * Cache reviews for a location
 */
export const cacheLocationReviews = async (locationId, userId, reviews, ttl = CACHE_CONFIG.TTL.REVIEWS) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.REVIEWS, userId, locationId);
  return await setCache(key, reviews, ttl);
};

/**
 * Get cached reviews for a location
 */
export const getCachedLocationReviews = async (locationId, userId) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.REVIEWS, userId, locationId);
  return await getCache(key);
};

/**
 * Cache review summaries for a location
 */
export const cacheLocationReviewSummaries = async (locationId, userId, summaries, ttl = CACHE_CONFIG.TTL.REVIEWS_SUMMARY) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.REVIEWS_SUMMARY, userId, locationId);
  return await setCache(key, summaries, ttl);
};

/**
 * Get cached review summaries for a location
 */
export const getCachedLocationReviewSummaries = async (locationId, userId) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.REVIEWS_SUMMARY, userId, locationId);
  return await getCache(key);
};

/**
 * Cache location statistics
 */
export const cacheLocationStats = async (locationId, userId, stats, ttl = CACHE_CONFIG.TTL.LOCATION_STATS) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.LOCATION_STATS, userId, locationId);
  return await setCache(key, stats, ttl);
};

/**
 * Get cached location statistics
 */
export const getCachedLocationStats = async (locationId, userId) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.LOCATION_STATS, userId, locationId);
  return await getCache(key);
};

/**
 * Cache location sentiment data
 */
export const cacheLocationSentiments = async (locationId, userId, sentiments, ttl = CACHE_CONFIG.TTL.LOCATION_SENTIMENTS) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.LOCATION_SENTIMENTS, userId, locationId);
  return await setCache(key, sentiments, ttl);
};

/**
 * Get cached location sentiment data
 */
export const getCachedLocationSentiments = async (locationId, userId) => {
  const key = generateKey(CACHE_CONFIG.PREFIX.LOCATION_SENTIMENTS, userId, locationId);
  return await getCache(key);
};

/**
 * Invalidate all caches for a specific location
 */
export const invalidateLocationCache = async (locationId, userId) => {
  try {
    const patterns = [
      generateKey(CACHE_CONFIG.PREFIX.REVIEWS, userId, locationId),
      generateKey(CACHE_CONFIG.PREFIX.REVIEWS_SUMMARY, userId, locationId),
      generateKey(CACHE_CONFIG.PREFIX.LOCATION_STATS, userId, locationId),
      generateKey(CACHE_CONFIG.PREFIX.LOCATION_SENTIMENTS, userId, locationId),
    ];

    const deletePromises = patterns.map((pattern) => deleteCache(pattern));
    await Promise.all(deletePromises);

    console.log(`✓ Invalidated all caches for location ${locationId}`);
    return true;
  } catch (error) {
    console.error(`Error invalidating location cache for ${locationId}:`, error);
    return false;
  }
};

/**
 * Invalidate all caches for a user
 */
export const invalidateUserCache = async (userId) => {
  try {
    const patterns = [
      `${CACHE_CONFIG.PREFIX.REVIEWS}:${userId}:*`,
      `${CACHE_CONFIG.PREFIX.REVIEWS_SUMMARY}:${userId}:*`,
      `${CACHE_CONFIG.PREFIX.LOCATION_STATS}:${userId}:*`,
      `${CACHE_CONFIG.PREFIX.LOCATION_SENTIMENTS}:${userId}:*`,
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      const deleted = await deleteCacheByPattern(pattern);
      totalDeleted += deleted;
    }

    console.log(`✓ Invalidated ${totalDeleted} cache keys for user ${userId}`);
    return totalDeleted;
  } catch (error) {
    console.error(`Error invalidating user cache for ${userId}:`, error);
    return 0;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const info = await redisClient.info('stats');
    const dbsize = await redisClient.dbsize();
    const memory = await redisClient.info('memory');

    return {
      dbsize,
      info: info,
      memory: memory,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

/**
 * Clear all cache (use with caution!)
 */
export const clearAllCache = async () => {
  try {
    await redisClient.flushdb();
    console.log('✓ Cleared all cache');
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis cache client...');
  await redisClient.quit();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis cache client...');
  await redisClient.quit();
});

export default {
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  hasCache,
  cacheLocationReviews,
  getCachedLocationReviews,
  cacheLocationReviewSummaries,
  getCachedLocationReviewSummaries,
  cacheLocationStats,
  getCachedLocationStats,
  cacheLocationSentiments,
  getCachedLocationSentiments,
  invalidateLocationCache,
  invalidateUserCache,
  getCacheStats,
  clearAllCache,
  generateKey,
  CACHE_CONFIG,
};
