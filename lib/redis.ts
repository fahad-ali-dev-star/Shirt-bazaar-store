import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;
let isInitialized = false;

/**
 * Returns a singleton Upstash Redis client instance if configured.
 * Gracefully returns null if environment variables are missing.
 */
export function getRedis(): Redis | null {
  if (isInitialized) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      redisClient = new Redis({
        url,
        token,
      });
    } catch (err) {
      console.warn("Failed to initialize Upstash Redis client:", err);
      redisClient = null;
    }
  } else {
    redisClient = null;
  }

  isInitialized = true;
  return redisClient;
}

/**
 * Fetch cached data from Redis. Returns null on cache miss or errors.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`Redis get error for key "${key}":`, err);
    return null;
  }
}

/**
 * Save data to Redis with a TTL in seconds (default: 1 hour / 3600s).
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> {
  const redis = getRedis();
  if (!redis || value === undefined || value === null) return;

  try {
    if (ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.warn(`Redis set error for key "${key}":`, err);
  }
}

/**
 * Invalidate (delete) one or multiple cache keys in Redis.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;

  try {
    const validKeys = keys.filter(Boolean);
    if (validKeys.length > 0) {
      await redis.del(...validKeys);
    }
  } catch (err) {
    console.warn("Redis invalidate error:", err);
  }
}
