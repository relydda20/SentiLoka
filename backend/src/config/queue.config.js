import Queue from 'bull';
import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Redis client for Bull
const createRedisClient = (type) => {
  const client = new Redis(redisConfig);

  client.on('error', (error) => {
    console.error(`Redis ${type} client error:`, error);
  });

  client.on('connect', () => {
    console.log(`✓ Redis ${type} client connected`);
  });

  return client;
};

// Queue configuration options
export const queueConfig = {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed jobs
  },
  settings: {
    lockDuration: 600000,  // 10 minutes - long enough for scraping
    maxStalledCount: 2,
    guardInterval: 5000,
    stalledInterval: 30000,
  },
};

// Create scraper queue
export const scraperQueue = new Queue('scraper-jobs', queueConfig);

// Queue event handlers
scraperQueue.on('error', (error) => {
  console.error('Scraper queue error:', error);
});

scraperQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

scraperQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

scraperQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

scraperQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

scraperQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} has stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing scraper queue...');
  await scraperQueue.close();
  process.exit(0);
});

export default scraperQueue;
