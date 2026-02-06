import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

        // Fetch all personas owned by the user
        const { data: personas, error: fetchError } = await supabase
            .from("personas")
            .select("name, tagline, description, system_prompt, intro_message, image_url, voice_id, safety_level, visibility, category, tags, metadata, config")
            .eq("creator_id", user.id)

        if (fetchError) {
            console.error("Error fetching personas for export:", fetchError)
            return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 })
        }

        const exportData = {
            version: "1.0",
            exported_at: new Date().toISOString(),
            count: personas.length,
            personas: personas.map(p => ({
                ...p,
                // Ensure we only export what's needed as per user request
                // Includes: system prompts, metadata, and configuration
            }))
        }

        const fileName = `personas_backup_${new Date().toISOString().split('T')[0]}.json`

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${fileName}"`
            }
        })
    } catch (error) {
        console.error("Export route error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
