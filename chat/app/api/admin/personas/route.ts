import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types"

// GET: List all personas with featured/visibility status
export async function GET() {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    }
                }
            }
        )

        const { data: personas, error } = await supabase
            .from("personas")
            .select(`
                id, 
                name, 
                description, 
                image_url, 
                visibility, 
                is_featured, 
                created_at,
                tags,
                persona_stats(
                    followers_count,
                    total_chats,
                    trending_score
                )
            `)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching personas:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Flatten stats for frontend convenience if needed, or keep as is.
        // Frontend expects direct access or nested. Let's keep nested but ensure single object.
        const enrichedPersonas = personas.map(p => ({
            ...p,
            persona_stats: Array.isArray(p.persona_stats) ? p.persona_stats[0] : p.persona_stats
        }))

        return NextResponse.json({ personas: enrichedPersonas })
    } catch (error) {
        console.error("Admin personas error:", error)
        return NextResponse.json(
            { error: "Failed to fetch personas" },
            { status: 500 }
        )
    }
}

// PATCH: Batch update personas (featured status, visibility, tags, STATS)
export async function PATCH(request: Request) {
    try {
        const { updates } = await request.json()
        // updates: Array<{ id: string, is_featured?, visibility?, tags?: string[], stats?: { ... } }>

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json(
                { error: "Invalid updates format" },
                { status: 400 }
            )
        }

        const cookieStore = cookies()
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    }
                }
            }
        )

        // Process each update
        const results = await Promise.all(
            updates.map(async (update: {
                id: string
                is_featured?: boolean
                visibility?: string
                tags?: string[]
                description?: string
                stats?: {
                    total_chats?: number
                    followers_count?: number
                    trending_score?: number
                }
            }) => {
                const updateData: Record<string, unknown> = {}
                if (update.is_featured !== undefined) updateData.is_featured = update.is_featured
                if (update.visibility !== undefined) updateData.visibility = update.visibility
                if (update.tags !== undefined) updateData.tags = update.tags
                if (update.description !== undefined) updateData.description = update.description

                let errorMsg = null

                // 1. Update Personas Table
                if (Object.keys(updateData).length > 0) {
                    const { error } = await supabase
                        .from("personas")
                        .update(updateData)
                        .eq("id", update.id)
                    if (error) errorMsg = error.message
                }

                // 2. Update Stats Table (if stats provided)
                if (update.stats && !errorMsg) {
                    const { error } = await supabase
                        .from("persona_stats")
                        .upsert({
                            persona_id: update.id, // Foreign Key
                            ...update.stats,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'persona_id' })

                    if (error) errorMsg = error.message
                }

                return { id: update.id, success: !errorMsg, error: errorMsg }
            })
        )

        const failures = results.filter(r => !r.success)
        if (failures.length > 0) {
            return NextResponse.json(
                {
                    message: `${results.length - failures.length}/${results.length} updates succeeded`,
                    failures
                },
                { status: 207 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `${results.length} personas updated`
        })
    } catch (error) {
        console.error("Admin personas update error:", error)
        return NextResponse.json(
            { error: "Failed to update personas" },
            { status: 500 }
        )
    }
}

// DELETE: Delete a persona
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: "Persona ID is required" },
                { status: 400 }
            )
        }

        const cookieStore = cookies()
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    }
                }
            }
        )

        // Delete the persona (cascading deletes will handle related data)
        const { error } = await supabase
            .from("personas")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting persona:", error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Persona deleted successfully"
        })
    } catch (error) {
        console.error("Admin persona delete error:", error)
        return NextResponse.json(
            { error: "Failed to delete persona" },
            { status: 500 }
        )
    }
}
