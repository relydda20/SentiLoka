import Redis from 'ioredis';
import Review from '../models/Review.model.js';
import Location from '../models/Location.model.js';

// Create Redis client for scraper cache
const scraperRedis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Redis connection event handlers
scraperRedis.on('connect', () => {
  console.log('✓ Redis scraper cache client connected');
});

scraperRedis.on('error', (error) => {
  console.error('Redis scraper cache client error:', error);
});

scraperRedis.on('ready', () => {
  console.log('✓ Redis scraper cache client ready');
});

// Connect to Redis
scraperRedis.connect().catch((error) => {
  console.error('Failed to connect to Redis scraper cache:', error);
});

/**
 * Scraper Cache Configuration
 */
const SCRAPER_CACHE_CONFIG = {
  // Prefix for Redis keys
  KEY_PREFIX: 'scraper',
  
  // TTL for cached reviews (in seconds) - 24 hours
  // After this time, reviews will expire if not processed
  REVIEW_TTL: 60 * 60 * 24,
  
  // Batch size for bulk database inserts
  BATCH_INSERT_SIZE: 100,
  
  // Maximum reviews to keep in cache per location
  MAX_CACHE_SIZE: 10000,
};

/**
 * Generate Redis key for scraper cache
 */
const generateScraperKey = (locationId, userId, type = 'reviews') => {
  return `${SCRAPER_CACHE_CONFIG.KEY_PREFIX}:${type}:${userId}:${locationId}`;
};

/**
 * Generate Redis key for scraper metadata
 */
const generateMetadataKey = (locationId, userId) => {
  return `${SCRAPER_CACHE_CONFIG.KEY_PREFIX}:metadata:${userId}:${locationId}`;
};

/**
 * Cache a single scraped review in Redis
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @param {Object} review - Review data
 */
export const cacheScrapedReview = async (locationId, userId, review) => {
  try {
    const key = generateScraperKey(locationId, userId);
    
    // Add review to Redis list (LPUSH adds to the left/beginning)
    await scraperRedis.lpush(key, JSON.stringify(review));
    
    // Set expiry on the list (refreshes TTL on each addition)
    await scraperRedis.expire(key, SCRAPER_CACHE_CONFIG.REVIEW_TTL);
    
    // Update metadata
    await updateScraperMetadata(locationId, userId, 1);
    
    return true;
  } catch (error) {
    console.error(`Error caching scraped review for location ${locationId}:`, error);
    return false;
  }
};

/**
 * Cache multiple scraped reviews in Redis (batch)
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @param {Array} reviews - Array of review objects
 */
export const cacheScrapedReviews = async (locationId, userId, reviews) => {
  try {
    if (!reviews || reviews.length === 0) {
      return 0;
    }

    const key = generateScraperKey(locationId, userId);
    
    // Use pipeline for better performance
    const pipeline = scraperRedis.pipeline();
    
    // Add all reviews to Redis list
    reviews.forEach(review => {
      pipeline.lpush(key, JSON.stringify(review));
    });
    
    // Set expiry
    pipeline.expire(key, SCRAPER_CACHE_CONFIG.REVIEW_TTL);
    
    await pipeline.exec();
    
    // Update metadata
    await updateScraperMetadata(locationId, userId, reviews.length);
    
    console.log(`✓ Cached ${reviews.length} scraped reviews for location ${locationId}`);
    return reviews.length;
  } catch (error) {
    console.error(`Error batch caching scraped reviews for location ${locationId}:`, error);
    return 0;
  }
};

/**
 * Get all cached scraped reviews for a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @param {number} count - Number of reviews to retrieve (default: all)
 */
export const getCachedScrapedReviews = async (locationId, userId, count = -1) => {
  try {
    const key = generateScraperKey(locationId, userId);
    
    // Get reviews from Redis list (LRANGE 0 -1 gets all items)
    const reviewStrings = await scraperRedis.lrange(key, 0, count);
    
    if (!reviewStrings || reviewStrings.length === 0) {
      return [];
    }
    
    // Parse JSON strings back to objects
    const reviews = reviewStrings.map(str => JSON.parse(str));
    
    console.log(`✓ Retrieved ${reviews.length} cached scraped reviews for location ${locationId}`);
    return reviews;
  } catch (error) {
    console.error(`Error retrieving cached scraped reviews for location ${locationId}:`, error);
    return [];
  }
};

/**
 * Get count of cached reviews for a location
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 */
export const getCachedReviewCount = async (locationId, userId) => {
  try {
    const key = generateScraperKey(locationId, userId);
    const count = await scraperRedis.llen(key);
    return count;
  } catch (error) {
    console.error(`Error getting cached review count for location ${locationId}:`, error);
    return 0;
  }
};

/**
 * Update scraper metadata (total reviews cached, timestamps)
 */
const updateScraperMetadata = async (locationId, userId, incrementBy = 1) => {
  try {
    const key = generateMetadataKey(locationId, userId);
    
    const metadata = {
      locationId,
      userId,
      lastUpdated: new Date().toISOString(),
      totalCached: incrementBy,
    };
    
    // Get existing metadata
    const existing = await scraperRedis.get(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      metadata.totalCached = (parsed.totalCached || 0) + incrementBy;
      metadata.firstCached = parsed.firstCached;
    } else {
      metadata.firstCached = new Date().toISOString();
    }
    
    await scraperRedis.setex(key, SCRAPER_CACHE_CONFIG.REVIEW_TTL, JSON.stringify(metadata));
    return metadata;
  } catch (error) {
    console.error('Error updating scraper metadata:', error);
    return null;
  }
};

/**
 * Get scraper metadata
 */
export const getScraperMetadata = async (locationId, userId) => {
  try {
    const key = generateMetadataKey(locationId, userId);
    const metadata = await scraperRedis.get(key);
    return metadata ? JSON.parse(metadata) : null;
  } catch (error) {
    console.error('Error getting scraper metadata:', error);
    return null;
  }
};

/**
 * Flush cached reviews to MongoDB (batch insert)
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @param {number} batchSize - Number of reviews to process per batch
 * @returns {Promise<Object>} - Result object with counts
 */
export const flushScrapedReviewsToDatabase = async (locationId, userId, batchSize = SCRAPER_CACHE_CONFIG.BATCH_INSERT_SIZE) => {
  try {
    const key = generateScraperKey(locationId, userId);
    
    // Get total count first
    const totalCount = await scraperRedis.llen(key);
    
    if (totalCount === 0) {
      console.log(`No cached reviews to flush for location ${locationId}`);
      return {
        success: true,
        totalProcessed: 0,
        inserted: 0,
        updated: 0,
        failed: 0,
        message: 'No cached reviews to flush',
      };
    }
    
    console.log(`Starting to flush ${totalCount} cached reviews to database for location ${locationId}`);
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    let processedCount = 0;
    
    // Process in batches
    while (true) {
      // Get a batch of reviews (from the right/end of the list)
      const batch = [];
      const pipeline = scraperRedis.pipeline();
      
      for (let i = 0; i < batchSize; i++) {
        pipeline.rpop(key);
      }
      
      const results = await pipeline.exec();
      
      // Extract review data from pipeline results
      for (const [error, result] of results) {
        if (!error && result) {
          batch.push(JSON.parse(result));
        }
      }
      
      if (batch.length === 0) {
        break; // No more reviews to process
      }
      
      // Bulk upsert to MongoDB
      const bulkOps = batch.map(reviewData => ({
        updateOne: {
          filter: {
            userId,
            googleReviewId: reviewData.googleReviewId,
          },
          update: {
            $set: {
              ...reviewData,
              userId,
              locationId,
              scrapedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));
      
      try {
        const bulkResult = await Review.bulkWrite(bulkOps, { ordered: false });
        totalInserted += bulkResult.upsertedCount || 0;
        totalUpdated += bulkResult.modifiedCount || 0;
        processedCount += batch.length;
        
        console.log(`✓ Flushed batch: ${batch.length} reviews (inserted: ${bulkResult.upsertedCount}, updated: ${bulkResult.modifiedCount})`);
      } catch (bulkError) {
        console.error('Error in bulk write:', bulkError);
        totalFailed += batch.length;
      }
    }
    
    // Update location metadata
    const location = await Location.findById(locationId);
    if (location) {
      location.scrapeConfig.lastScraped = new Date();
      await location.save();
    }
    
    // Clear metadata
    const metadataKey = generateMetadataKey(locationId, userId);
    await scraperRedis.del(metadataKey);
    
    const result = {
      success: true,
      totalProcessed: processedCount,
      inserted: totalInserted,
      updated: totalUpdated,
      failed: totalFailed,
      message: `Successfully flushed ${processedCount} reviews to database`,
    };
    
    console.log(`✓ Flush complete for location ${locationId}:`, result);
    return result;
  } catch (error) {
    console.error(`Error flushing cached reviews to database for location ${locationId}:`, error);
    return {
      success: false,
      error: error.message,
      totalProcessed: 0,
      inserted: 0,
      updated: 0,
      failed: 0,
    };
  }
};

/**
 * Clear cached reviews for a location without saving to database
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 */
export const clearScrapedReviewCache = async (locationId, userId) => {
  try {
    const key = generateScraperKey(locationId, userId);
    const metadataKey = generateMetadataKey(locationId, userId);
    
    const count = await scraperRedis.llen(key);
    
    await scraperRedis.del(key);
    await scraperRedis.del(metadataKey);
    
    console.log(`✓ Cleared ${count} cached reviews for location ${locationId}`);
    return count;
  } catch (error) {
    console.error(`Error clearing cached reviews for location ${locationId}:`, error);
    return 0;
  }
};

/**
 * Get statistics about all cached scraper data
 */
export const getScraperCacheStats = async () => {
  try {
    const pattern = `${SCRAPER_CACHE_CONFIG.KEY_PREFIX}:reviews:*`;
    const keys = await scraperRedis.keys(pattern);
    
    const stats = {
      totalLocations: keys.length,
      totalReviewsCached: 0,
      locations: [],
    };
    
    for (const key of keys) {
      const count = await scraperRedis.llen(key);
      const ttl = await scraperRedis.ttl(key);
      
      // Extract locationId and userId from key
      const parts = key.split(':');
      const userId = parts[2];
      const locationId = parts[3];
      
      stats.totalReviewsCached += count;
      stats.locations.push({
        locationId,
        userId,
        cachedReviews: count,
        expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutes` : 'expired',
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting scraper cache stats:', error);
    return null;
  }
};

/**
 * Auto-flush cache when it reaches a certain size
 * @param {string} locationId - Location ID
 * @param {string} userId - User ID
 * @param {number} threshold - Flush when cache size reaches this number
 */
export const autoFlushIfNeeded = async (locationId, userId, threshold = 500) => {
  try {
    const count = await getCachedReviewCount(locationId, userId);
    
    if (count >= threshold) {
      console.log(`⚠️ Cache size (${count}) reached threshold (${threshold}). Auto-flushing...`);
      const result = await flushScrapedReviewsToDatabase(locationId, userId);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error in auto-flush:', error);
    return null;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Redis scraper cache client...');
  await scraperRedis.quit();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Redis scraper cache client...');
  await scraperRedis.quit();
});

export default {
  cacheScrapedReview,
  cacheScrapedReviews,
  getCachedScrapedReviews,
  getCachedReviewCount,
  getScraperMetadata,
  flushScrapedReviewsToDatabase,
  clearScrapedReviewCache,
  getScraperCacheStats,
  autoFlushIfNeeded,
  SCRAPER_CACHE_CONFIG,
};
