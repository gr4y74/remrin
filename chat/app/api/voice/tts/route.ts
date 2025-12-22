import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * Voice TTS API Route
 *
 * POST /api/voice/tts
 * Request: { text: string, voiceId?: string }
 * Response: { audioUrl: string, duration: number, cached: boolean }
 *
 * Currently designed for client-side Web Speech API usage.
 * This endpoint provides duration estimation and caching metadata.
 * Can be extended for ElevenLabs/Google/Azure integration.
 */

// Simple in-memory cache (will reset on cold start)
const cache = new Map<string, { duration: number; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour
const MAX_CACHE_SIZE = 1000

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // requests per window
const RATE_WINDOW = 60000 // 1 minute

// Average words per minute for duration estimation
const AVERAGE_WPM = 150

/**
 * Hash text for caching
 */
function hashText(text: string, voiceId: string): string {
    let hash = 0
    const str = `${voiceId}:${text}`
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return Math.abs(hash).toString(36)
}

/**
 * Estimate duration based on text length
 */
function estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
    const seconds = (wordCount / AVERAGE_WPM) * 60
    return Math.max(1, Math.round(seconds))
}

/**
 * Check rate limit
 */
function checkRateLimit(clientId: string): boolean {
    const now = Date.now()
    const limit = rateLimits.get(clientId)

    if (!limit || now > limit.resetTime) {
        rateLimits.set(clientId, { count: 1, resetTime: now + RATE_WINDOW })
        return true
    }

    if (limit.count >= RATE_LIMIT) {
        return false
    }

    limit.count++
    return true
}

/**
 * Clean expired cache entries
 */
function cleanCache() {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key)
        }
    }
    // Enforce max size
    if (cache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - MAX_CACHE_SIZE)
        keysToDelete.forEach(key => cache.delete(key))
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get client identifier for rate limiting
        const clientId = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "anonymous"

        // Check rate limit
        if (!checkRateLimit(clientId)) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { text, voiceId = "female-1" } = body

        // Validate input
        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid 'text' field" },
                { status: 400 }
            )
        }

        if (text.length > 5000) {
            return NextResponse.json(
                { error: "Text too long. Maximum 5000 characters." },
                { status: 400 }
            )
        }

        // Generate cache key
        const cacheKey = hashText(text, voiceId)

        // Clean cache periodically
        if (Math.random() < 0.1) cleanCache()

        // Check cache
        const cached = cache.get(cacheKey)
        if (cached) {
            return NextResponse.json({
                // For client-side Web Speech API, we return a speech:// protocol
                // This signals the client to use browser TTS
                audioUrl: `speech://${cacheKey}`,
                duration: cached.duration,
                cached: true,
                provider: "browser"
            })
        }

        // Estimate duration
        const duration = estimateDuration(text)

        // Store in cache
        cache.set(cacheKey, { duration, timestamp: Date.now() })

        /**
         * Future: External TTS Provider Integration
         *
         * To add ElevenLabs, Google, or Azure TTS:
         * 1. Check environment for API keys
         * 2. Call the external API
         * 3. Return a real audio URL or base64
         *
         * Example for ElevenLabs:
         * if (process.env.ELEVENLABS_API_KEY) {
         *   const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${providerVoiceId}`, {
         *     method: 'POST',
         *     headers: {
         *       'xi-api-key': process.env.ELEVENLABS_API_KEY,
         *       'Content-Type': 'application/json'
         *     },
         *     body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.5 } })
         *   })
         *   const audioBuffer = await response.arrayBuffer()
         *   const base64 = Buffer.from(audioBuffer).toString('base64')
         *   return NextResponse.json({ audioUrl: `data:audio/mpeg;base64,${base64}`, duration, cached: false })
         * }
         */

        // Return response for client-side TTS
        return NextResponse.json({
            audioUrl: `speech://${cacheKey}`,
            duration,
            cached: false,
            provider: "browser",
            // Include voice settings for client
            voiceSettings: {
                voiceId,
                text
            }
        })

    } catch (error: any) {
        console.error("TTS API Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        provider: "browser",
        message: "TTS API is ready. Use POST with { text, voiceId } to synthesize speech."
    })
}
