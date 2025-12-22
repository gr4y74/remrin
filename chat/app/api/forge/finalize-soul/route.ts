import { createClient } from "@/lib/supabase/server"
import { compileNBBPrompt, type SoulData } from "@/lib/forge/nbb-compiler"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Rate limiting: max souls per day per user
const soulCreationCounts = new Map<string, { count: number; resetTime: number }>()
const MAX_SOULS_PER_DAY = 5
const DAY_IN_MS = 24 * 60 * 60 * 1000

/**
 * POST /api/forge/finalize-soul
 * 
 * Finalizes soul creation and saves to database
 * Called by the Mother of Souls when the ritual is complete
 * 
 * Request: { name, essence, personality, bond_type, voice_id?, image_url }
 * Response: { persona_id: string, status: 'success' }
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required. Please log in to create a soul." },
                { status: 401 }
            )
        }

        // Check rate limit
        const now = Date.now()
        const userLimit = soulCreationCounts.get(user.id)

        if (userLimit) {
            if (now < userLimit.resetTime) {
                if (userLimit.count >= MAX_SOULS_PER_DAY) {
                    return NextResponse.json(
                        { error: `Rate limit exceeded. You can create up to ${MAX_SOULS_PER_DAY} souls per day.` },
                        { status: 429 }
                    )
                }
            } else {
                // Reset counter for new day
                soulCreationCounts.set(user.id, { count: 0, resetTime: now + DAY_IN_MS })
            }
        } else {
            soulCreationCounts.set(user.id, { count: 0, resetTime: now + DAY_IN_MS })
        }

        // Parse request body
        const body = await request.json()
        const { name, essence, personality, bond_type, voice_id, image_url } = body

        // === VALIDATION ===

        // Name validation
        if (!name || typeof name !== "string") {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            )
        }

        if (name.length > 50) {
            return NextResponse.json(
                { error: "Name must be 50 characters or less" },
                { status: 400 }
            )
        }

        // Essence validation
        if (!essence || typeof essence !== "string") {
            return NextResponse.json(
                { error: "Essence (description) is required" },
                { status: 400 }
            )
        }

        // Personality validation
        if (!personality || typeof personality !== "string") {
            return NextResponse.json(
                { error: "Personality traits are required" },
                { status: 400 }
            )
        }

        // Bond type validation
        if (!bond_type || typeof bond_type !== "string") {
            return NextResponse.json(
                { error: "Bond type is required" },
                { status: 400 }
            )
        }

        // Image URL validation
        if (!image_url || typeof image_url !== "string") {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            )
        }

        // Validate image URL format
        try {
            new URL(image_url)
        } catch {
            return NextResponse.json(
                { error: "Invalid image URL format" },
                { status: 400 }
            )
        }

        // === COMPILE SYSTEM PROMPT ===

        const soulData: SoulData = {
            name: name.trim(),
            essence: essence.trim(),
            personality: personality.trim(),
            bond_type: bond_type.trim(),
            voice_id: voice_id?.trim() || undefined,
            image_url: image_url.trim()
        }

        const compiledPrompt = compileNBBPrompt(soulData)

        // === INSERT INTO DATABASE ===

        const { data: persona, error: insertError } = await supabase
            .from("personas")
            .insert({
                owner_id: user.id,
                name: soulData.name,
                description: soulData.essence,
                system_prompt: compiledPrompt,
                image_url: soulData.image_url,
                voice_id: soulData.voice_id || null,
                visibility: "PRIVATE",
                status: "approved",
                category: "personal"
            })
            .select()
            .single()

        if (insertError) {
            console.error("Failed to create persona:", insertError)
            return NextResponse.json(
                { error: "Failed to create soul. Please try again." },
                { status: 500 }
            )
        }

        // Update rate limit counter
        const currentLimit = soulCreationCounts.get(user.id)!
        currentLimit.count++

        // Return success
        return NextResponse.json({
            persona_id: persona.id,
            status: "success",
            message: `${soulData.name} has been brought to life!`
        })

    } catch (error: any) {
        console.error("Finalize soul error:", error)
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
