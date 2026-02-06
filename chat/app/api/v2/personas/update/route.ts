import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * PATCH /api/v2/personas/update
 * 
 * Update an existing persona with soul template data.
 * Used for injecting soul templates into existing characters.
 */
export async function PATCH(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { persona_id, soul_data } = body

        if (!persona_id) {
            return NextResponse.json({ error: "Missing persona_id" }, { status: 400 })
        }

        if (!soul_data || typeof soul_data !== 'object') {
            return NextResponse.json({ error: "Missing or invalid soul_data" }, { status: 400 })
        }

        // Verify ownership - user must own the persona to update it
        const { data: existingPersona, error: fetchError } = await supabase
            .from("personas")
            .select("id, creator_id, name")
            .eq("id", persona_id)
            .single()

        if (fetchError || !existingPersona) {
            return NextResponse.json({ error: "Persona not found" }, { status: 404 })
        }

        // Check if user is admin or owner
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("user_id", user.id)
            .single()

        const isAdmin = profile?.is_admin === true
        const isOwner = existingPersona.creator_id === user.id

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "You don't have permission to update this persona" }, { status: 403 })
        }

        // Build update payload from soul_data (Full Replace mode)
        const updatePayload: Record<string, any> = {}

        // Core soul fields
        if (soul_data.name !== undefined) updatePayload.name = soul_data.name
        // Note: tagline is stored in config, not as a top-level column
        if (soul_data.description !== undefined) updatePayload.description = soul_data.description
        if (soul_data.system_prompt !== undefined) updatePayload.system_prompt = soul_data.system_prompt
        if (soul_data.intro_message !== undefined) updatePayload.intro_message = soul_data.intro_message
        if (soul_data.safety_level !== undefined) updatePayload.safety_level = soul_data.safety_level
        if (soul_data.category !== undefined) updatePayload.category = soul_data.category
        if (soul_data.tags !== undefined) updatePayload.tags = soul_data.tags
        if (soul_data.voice_id !== undefined) updatePayload.voice_id = soul_data.voice_id
        if (soul_data.image_url !== undefined) updatePayload.image_url = soul_data.image_url

        // Metadata and config (merge with existing if provided)
        if (soul_data.metadata !== undefined) {
            updatePayload.metadata = soul_data.metadata
        }
        if (soul_data.config !== undefined) {
            // Include tagline in config if provided
            const configData = { ...soul_data.config }
            if (soul_data.tagline !== undefined) {
                configData.tagline = soul_data.tagline
            }
            updatePayload.config = configData
        } else if (soul_data.tagline !== undefined) {
            // If only tagline provided without config, set it in config
            updatePayload.config = { tagline: soul_data.tagline }
        }

        if (Object.keys(updatePayload).length === 0) {
            // No actual changes
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
        }

        // Perform the update
        const { data: updatedPersona, error: updateError } = await supabase
            .from("personas")
            .update(updatePayload)
            .eq("id", persona_id)
            .select()
            .single()

        if (updateError) {
            console.error("Failed to update persona:", updateError)
            return NextResponse.json({ error: "Failed to update persona", details: updateError.message }, { status: 500 })
        }

        return NextResponse.json({
            message: "Persona updated successfully",
            persona: updatedPersona,
            fields_updated: Object.keys(updatePayload).filter(k => k !== 'updated_at')
        })

    } catch (error: any) {
        console.error("Update route error:", error)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}

/**
 * GET /api/v2/personas/update?id=xxx
 * 
 * Get a single persona's full data for editing.
 */
export async function GET(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const personaId = searchParams.get("id")

        if (!personaId) {
            return NextResponse.json({ error: "Missing persona id" }, { status: 400 })
        }

        // Fetch persona
        const { data: persona, error: fetchError } = await supabase
            .from("personas")
            .select("*")
            .eq("id", personaId)
            .single()

        if (fetchError || !persona) {
            return NextResponse.json({ error: "Persona not found" }, { status: 404 })
        }

        // Check if user is admin or owner
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("user_id", user.id)
            .single()

        const isAdmin = profile?.is_admin === true
        const isOwner = persona.creator_id === user.id

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "You don't have permission to view this persona's details" }, { status: 403 })
        }

        return NextResponse.json({ persona })

    } catch (error: any) {
        console.error("Get persona route error:", error)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}
