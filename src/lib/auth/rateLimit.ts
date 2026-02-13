/**
 * In-memory sliding window rate limiter.
 *
 * Inspired by Loomiverse _usage.js checkRateLimit().
 * Per-instance on serverless (not perfect, but catches obvious abuse).
 */

const rateLimitMap = new Map<string, number[]>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const LIMITS: Record<string, RateLimitConfig> = {
  authenticated: { maxRequests: 20, windowMs: 60_000 },
  anonymous: { maxRequests: 5, windowMs: 60_000 },
}

interface RateLimitResult {
  allowed: boolean
  retryAfterMs?: number
}

export function checkRateLimit(
  key: string,
  isAuthenticated: boolean
): RateLimitResult {
  const now = Date.now()
  const { maxRequests, windowMs } = isAuthenticated
    ? LIMITS.authenticated
    : LIMITS.anonymous

  const timestamps = (rateLimitMap.get(key) || []).filter(
    (t) => now - t < windowMs
  )

  if (timestamps.length >= maxRequests) {
    rateLimitMap.set(key, timestamps)
    console.warn(`[RateLimit] Blocked ${key} (${timestamps.length}/${maxRequests} in ${windowMs}ms window)`)
    return {
      allowed: false,
      retryAfterMs: windowMs - (now - timestamps[0]),
    }
  }

  timestamps.push(now)
  rateLimitMap.set(key, timestamps)

  // Cleanup old entries to prevent memory leak
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap) {
      if (v.every((t) => now - t >= windowMs)) {
        rateLimitMap.delete(k)
      }
    }
  }

  return { allowed: true }
}
