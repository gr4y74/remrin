import { createClient } from "@/lib/supabase/server"
import { compileNBBPrompt, type SoulData } from "@/lib/forge/nbb-compiler"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { hasPermission, getFeatureLimit } from "@/src/lib/permissions"
import { SubscriptionTier } from "@/lib/server/feature-gates"

/**
 * POST /api/forge/finalize-soul
 * 
 * Finalizes soul creation and saves to database
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

        // Get user's tier
        const { data: wallet } = await supabase
            .from('wallets')
            .select('tier')
            .eq('user_id', user.id)
            .single()

        const userTier = (wallet?.tier || 'wanderer') as SubscriptionTier

        // Check soul count limit
        const { count, error: countError } = await supabase
            .from('personas')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id)

        const limit = getFeatureLimit(userTier, 'soul_count')

        if (countError) {
            console.error("Count error:", countError)
        } else if (count !== null && count >= limit) {
            return NextResponse.json(
                {
                    error: `Soul limit reached. Your current tier (${userTier}) allows owning up to ${limit} souls.`,
                    limitReached: true,
                    max: limit,
                    current: count
                },
                { status: 403 }
            )
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
                creator_id: user.id,
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
