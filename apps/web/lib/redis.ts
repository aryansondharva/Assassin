import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Defensive creation: fallback to a dummy client or log warning if environment variables are missing
let redis: Redis | null = null

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  })
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Redis caching will be bypassed.'
    )
  }
}

export default redis

/**
 * Cache wrapper with automatic bypass fallback
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  if (!redis) {
    return fetcher()
  }

  try {
    const cached = await redis.get<string>(key)
    if (cached) {
      // Upstash parses JSON automatically if it is serialized, but we double check
      return typeof cached === 'string' ? JSON.parse(cached) : cached
    }
  } catch (error) {
    console.error(`[Redis Cache GET Error] key: ${key}`, error)
  }

  const data = await fetcher()

  try {
    if (redis) {
      await redis.set(key, JSON.stringify(data), { ex: ttlSeconds })
    }
  } catch (error) {
    console.error(`[Redis Cache SET Error] key: ${key}`, error)
  }

  return data
}

/**
 * Invalidate cache key
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`[Redis Cache DEL Error] key: ${key}`, error)
  }
}
