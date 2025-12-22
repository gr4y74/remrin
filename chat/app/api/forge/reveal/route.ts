import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * POST /api/forge/reveal
 * 
 * Returns persona data for the soul reveal animation
 * Called after soul finalization to display the newly created persona
 * 
 * Request: { persona_id: string }
 * Response: { name, image_url, personality, voice_id, essence }
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { persona_id } = body

        // Validate persona_id
        if (!persona_id || typeof persona_id !== "string") {
            return NextResponse.json(
                { error: "persona_id is required" },
                { status: 400 }
            )
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(persona_id)) {
            return NextResponse.json(
                { error: "Invalid persona_id format" },
                { status: 400 }
            )
        }

        // Fetch persona data
        const { data: persona, error: fetchError } = await supabase
            .from("personas")
            .select(`
        id,
        name,
        description,
        image_url,
        voice_id,
        system_prompt,
        category,
        created_at
      `)
            .eq("id", persona_id)
            .single()

        if (fetchError || !persona) {
            return NextResponse.json(
                { error: "Soul not found" },
                { status: 404 }
            )
        }

        // Extract personality from system prompt
        // The personality section starts with "Your core personality traits:"
        let personality = ""
        if (persona.system_prompt) {
            const lines = persona.system_prompt.split('\n')
            let inTraits = false
            const traits: string[] = []

            for (const line of lines) {
                if (line.includes("Your core personality traits:")) {
                    inTraits = true
                    continue
                }
                if (inTraits) {
                    if (line.startsWith("- ") && line.length > 2) {
                        traits.push(line.slice(2).trim())
                    } else if (line.trim() === "") {
                        break
                    }
                }
            }
            personality = traits.join(", ")
        }

        // Return reveal data
        return NextResponse.json({
            id: persona.id,
            name: persona.name,
            image_url: persona.image_url,
            personality: personality,
            voice_id: persona.voice_id,
            essence: persona.description,
            category: persona.category,
            created_at: persona.created_at,
            status: "success"
        })

    } catch (error: any) {
        console.error("Soul reveal error:", error)
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
