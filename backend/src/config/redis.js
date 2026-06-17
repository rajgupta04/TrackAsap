import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

if (process.env.REDIS_URI) {
  try {
    redisClient = new Redis(process.env.REDIS_URI, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error('[Redis] Max retries reached. Disabling Redis cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error.message);
  }
} else {
  console.warn('[Redis] No REDIS_URI provided. Caching will be disabled.');
}

/**
 * Gets a value from cache
 * @param {string} key 
 * @returns {Promise<any|null>} Parsed JSON or null
 */
export const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[Redis] GET Error for key ${key}:`, err.message);
    return null;
  }
};

/**
 * Sets a value in cache
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttlSeconds Expiration time in seconds
 */
export const setCache = async (key, data, ttlSeconds = 3600) => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    console.error(`[Redis] SET Error for key ${key}:`, err.message);
  }
};

/**
 * Deletes a key from cache
 * @param {string} key 
 */
export const delCache = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`[Redis] DEL Error for key ${key}:`, err.message);
  }
};

export default redisClient;
