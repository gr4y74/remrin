import { NextRequest, NextResponse } from "next/server"
import { buildSoulPortraitPrompt, getPortraitGenerationParams } from "@/lib/forge/prompt-builder"
import { uploadPortraitFromUrl } from "@/db/storage/soul-portraits"

// Use Node.js runtime for Replicate API calls
export const runtime = "nodejs"
export const maxDuration = 120 // 2 minutes for image generation

// Default fallback image
const FALLBACK_IMAGE_URL = "/images/default-portrait.png"

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per window
const RATE_WINDOW = 60000 // 1 minute

// Replicate API configuration
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions"
const SDXL_MODEL_VERSION = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"

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
 * Start a Replicate prediction
 */
async function startPrediction(prompt: string, negativePrompt: string) {
    const apiToken = process.env.REPLICATE_API_TOKEN

    if (!apiToken) {
        throw new Error("REPLICATE_API_TOKEN is not configured")
    }

    const params = getPortraitGenerationParams()

    const response = await fetch(REPLICATE_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: SDXL_MODEL_VERSION.split(":")[1],
            input: {
                prompt,
                negative_prompt: negativePrompt,
                width: params.width,
                height: params.height,
                num_inference_steps: params.num_inference_steps,
                guidance_scale: params.guidance_scale,
                refine: params.refine,
                refine_steps: params.refine_steps,
                scheduler: params.scheduler,
                num_outputs: 1
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error("Replicate API error:", errorText)
        throw new Error(`Replicate API error: ${response.status}`)
    }

    return response.json()
}

/**
 * Poll for prediction completion
 */
async function pollPrediction(predictionUrl: string, maxWaitMs: number = 90000): Promise<string> {
    const apiToken = process.env.REPLICATE_API_TOKEN
    const startTime = Date.now()
    const pollInterval = 2000 // 2 seconds

    while (Date.now() - startTime < maxWaitMs) {
        const response = await fetch(predictionUrl, {
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json",
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to poll prediction: ${response.status}`)
        }

        const prediction = await response.json()

        if (prediction.status === "succeeded") {
            // SDXL returns array of images
            const output = prediction.output
            if (Array.isArray(output) && output.length > 0) {
                return output[0]
            }
            throw new Error("No output image in prediction result")
        }

        if (prediction.status === "failed" || prediction.status === "canceled") {
            throw new Error(`Prediction ${prediction.status}: ${prediction.error || "Unknown error"}`)
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error("Prediction timed out")
}

/**
 * POST /api/forge/generate-portrait
 * 
 * Generate a soul portrait image using SDXL
 * 
 * Request: { appearance_description: string, style_hints?: string }
 * Response: { image_url: string, status: 'success' | 'error' }
 */
export async function POST(request: NextRequest) {
    try {
        // Get client identifier for rate limiting
        const clientId = request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "anonymous"

        // Check rate limit
        if (!checkRateLimit(clientId)) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded. Please try again later.",
                    status: "error",
                    fallback_url: FALLBACK_IMAGE_URL
                },
                { status: 429 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { appearance_description, style_hints } = body

        // Validate input
        if (!appearance_description || typeof appearance_description !== "string") {
            return NextResponse.json(
                {
                    error: "Missing or invalid 'appearance_description' field",
                    status: "error",
                    fallback_url: FALLBACK_IMAGE_URL
                },
                { status: 400 }
            )
        }

        if (appearance_description.length < 10) {
            return NextResponse.json(
                {
                    error: "Description too short. Please provide at least 10 characters.",
                    status: "error",
                    fallback_url: FALLBACK_IMAGE_URL
                },
                { status: 400 }
            )
        }

        if (appearance_description.length > 1000) {
            return NextResponse.json(
                {
                    error: "Description too long. Maximum 1000 characters.",
                    status: "error",
                    fallback_url: FALLBACK_IMAGE_URL
                },
                { status: 400 }
            )
        }

        console.log(`🎨 [Portrait Gen] Starting generation for: "${appearance_description.slice(0, 50)}..."`)

        // Build the prompt
        const { positive, negative } = buildSoulPortraitPrompt(appearance_description, style_hints)
        console.log(`📝 [Portrait Gen] Prompt built: ${positive.slice(0, 100)}...`)

        // Check if Replicate is configured
        if (!process.env.REPLICATE_API_TOKEN) {
            console.warn("⚠️ [Portrait Gen] REPLICATE_API_TOKEN not configured, returning fallback")
            return NextResponse.json({
                image_url: FALLBACK_IMAGE_URL,
                status: "success",
                generated: false,
                message: "Image generation not configured, using fallback"
            })
        }

        // Start prediction
        const prediction = await startPrediction(positive, negative)
        console.log(`🚀 [Portrait Gen] Prediction started: ${prediction.id}`)

        // Poll for completion
        const imageUrl = await pollPrediction(prediction.urls.get)
        console.log(`✅ [Portrait Gen] Generation complete, uploading to storage...`)

        // Upload to Supabase storage for permanent URL
        // For now, we'll return the Replicate URL directly
        // In production, uncomment and use the user's ID:
        // const { url: permanentUrl } = await uploadPortraitFromUrl(imageUrl, userId)

        // For now, return the Replicate URL directly
        // Note: Replicate URLs expire after ~1 hour
        // TODO: Integrate with user auth to get userId for permanent storage

        console.log(`🎉 [Portrait Gen] Complete!`)

        return NextResponse.json({
            image_url: imageUrl,
            status: "success",
            generated: true,
            prediction_id: prediction.id
        })

    } catch (error: any) {
        console.error("🚨 [Portrait Gen] Error:", error.message)

        return NextResponse.json(
            {
                error: error.message || "Generation failed",
                status: "error",
                fallback_url: FALLBACK_IMAGE_URL
            },
            { status: 500 }
        )
    }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
    const configured = !!process.env.REPLICATE_API_TOKEN

    return NextResponse.json({
        status: "ok",
        configured,
        message: configured
            ? "Portrait generation API is ready. Use POST with { appearance_description, style_hints? }"
            : "REPLICATE_API_TOKEN not configured. Generation will return fallback images."
    })
}
