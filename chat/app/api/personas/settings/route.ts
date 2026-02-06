import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Default settings structure
const DEFAULT_SETTINGS = {
    identity: {
        call_me: "",
        my_pronouns: "",
        my_description: "",
        my_personality: ""
    },
    relationship: {
        type: "friend",
        dynamic: "",
        history: "",
        boundaries: ""
    },
    world: {
        setting: "",
        important_people: [],
        important_places: [],
        custom_lore: ""
    },
    preferences: {
        response_style: "adaptive",
        response_length: "adaptive",
        emoji_usage: "moderate",
        nsfw_enabled: false,
        custom_instructions: ""
    },
    voice: {
        nickname_for_me: "",
        her_catchphrases: [],
        topics_to_avoid: [],
        topics_she_loves: []
    }
}

/**
 * GET /api/personas/settings?persona_id=xxx
 * Get user's custom settings for a persona
 */
export async function GET(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const personaId = searchParams.get("persona_id")

        if (!personaId) {
            return NextResponse.json({ error: "Missing persona_id" }, { status: 400 })
        }

        // Fetch user's settings for this persona
        const { data: settings, error } = await supabase
            .from("persona_user_settings")
            .select("*")
            .eq("user_id", user.id)
            .eq("persona_id", personaId)
            .single()

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows returned (which is fine, user hasn't customized yet)
            throw error
        }

        return NextResponse.json({
            settings: settings?.settings || DEFAULT_SETTINGS,
            has_customizations: !!settings,
            created_at: settings?.created_at || null,
            updated_at: settings?.updated_at || null
        })

    } catch (error: any) {
        console.error("Get persona settings error:", error)
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }
}

/**
 * PUT /api/personas/settings
 * Save/update user's custom settings for a persona
 */
export async function PUT(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { persona_id, settings } = body

        if (!persona_id) {
            return NextResponse.json({ error: "Missing persona_id" }, { status: 400 })
        }

        if (!settings || typeof settings !== "object") {
            return NextResponse.json({ error: "Invalid settings object" }, { status: 400 })
        }

        // Verify persona exists
        const { data: persona, error: personaError } = await supabase
            .from("personas")
            .select("id, name")
            .eq("id", persona_id)
            .single()

        if (personaError || !persona) {
            return NextResponse.json({ error: "Persona not found" }, { status: 404 })
        }

        // Upsert settings (insert or update)
        const { data, error } = await supabase
            .from("persona_user_settings")
            .upsert({
                user_id: user.id,
                persona_id: persona_id,
                settings: settings
            }, {
                onConflict: "user_id,persona_id"
            })
            .select()
            .single()

        if (error) {
            console.error("Upsert error:", error)
            throw error
        }

        return NextResponse.json({
            message: "Settings saved successfully",
            settings: data.settings,
            updated_at: data.updated_at
        })

    } catch (error: any) {
        console.error("Save persona settings error:", error)
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }
}

/**
 * DELETE /api/personas/settings?persona_id=xxx
 * Reset user's settings for a persona (delete customizations)
 */
export async function DELETE(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const personaId = searchParams.get("persona_id")

        if (!personaId) {
            return NextResponse.json({ error: "Missing persona_id" }, { status: 400 })
        }

        const { error } = await supabase
            .from("persona_user_settings")
            .delete()
            .eq("user_id", user.id)
            .eq("persona_id", personaId)

        if (error) throw error

        return NextResponse.json({
            message: "Settings reset to defaults",
            settings: DEFAULT_SETTINGS
        })

    } catch (error: any) {
        console.error("Delete persona settings error:", error)
        return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 })
    }
}
