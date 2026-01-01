/**
 * Simple in-memory rate limiter
 * Note: In a serverless environment (like Vercel), this memory is instance-local and ephemeral.
 * For robust distributed rate limiting on serverless, use Redis (e.g., Upstash).
 */

interface RateLimitConfig {
    interval: number // Window size in milliseconds
    limit: number // Max requests per window
}

const rateLimits = new Map<string, number[]>()

export function rateLimit(ip: string, config: RateLimitConfig = { interval: 60000, limit: 20 }): boolean {
    const now = Date.now()
    const windowStart = now - config.interval

    let timestamps = rateLimits.get(ip) || []

    // Filter out old requests
    timestamps = timestamps.filter(timestamp => timestamp > windowStart)

    if (timestamps.length >= config.limit) {
        return false // Rate limit exceeded
    }

    timestamps.push(now)
    rateLimits.set(ip, timestamps)

    return true
}
