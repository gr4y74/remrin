import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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
        const importedPersonas = Array.isArray(body.personas) ? body.personas : []

        if (importedPersonas.length === 0) {
            return NextResponse.json({ error: "No personas found in import data" }, { status: 400 })
        }

        // Get existing persona names for this user to handle duplicates
        const { data: existingPersonas } = await supabase
            .from("personas")
            .select("name")
            .eq("creator_id", user.id)

        const existingNames = new Set(existingPersonas?.map(p => p.name) || [])

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        for (const personaData of importedPersonas) {
            try {
                // Basic validation
                if (!personaData.name || !personaData.system_prompt) {
                    results.failed++
                    results.errors.push(`Missing required fields for: ${personaData.name || 'Unknown'}`)
                    continue
                }

                // Handle duplicate names
                let finalName = personaData.name
                while (existingNames.has(finalName)) {
                    finalName = `${finalName} (Copy)`
                }
                existingNames.add(finalName)

                const payload = {
                    name: finalName,
                    tagline: personaData.tagline || "",
                    description: personaData.description || "",
                    system_prompt: personaData.system_prompt,
                    behavioral_blueprint: personaData.behavioral_blueprint || null,
                    image_url: personaData.image_url || null,
                    voice_id: personaData.voice_id || null,
                    safety_level: personaData.safety_level || "ADULT",
                    visibility: "PRIVATE", // Default to private on import
                    status: "draft",
                    category: personaData.category || "general",
                    tags: personaData.tags || [],
                    intro_message: personaData.intro_message || "",
                    owner_id: user.id,
                    creator_id: user.id,
                    config: personaData.config || {},
                    metadata: personaData.metadata || {}
                }

                const { error: insertError } = await supabase
                    .from("personas")
                    .insert([payload])

                if (insertError) {
                    throw insertError
                }

                results.success++
            } catch (err: any) {
                console.error("Failed to import persona:", personaData.name, err)
                results.failed++
                results.errors.push(`Failed to import ${personaData.name}: ${err.message}`)
            }
        }

        return NextResponse.json({
            message: "Import completed",
            ...results
        })

    } catch (error: any) {
        console.error("Import route error:", error)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}
