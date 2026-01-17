import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types"

type SectionPersonaInsert = Database["public"]["Tables"]["section_personas"]["Insert"]

// POST: Add persona(s) to a section
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { section_id, persona_ids, sort_order } = body

        if (!section_id || !persona_ids || !Array.isArray(persona_ids)) {
            return NextResponse.json(
                { error: "section_id and persona_ids (array) are required" },
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

        // Get current user for added_by
        const { data: { user } } = await supabase.auth.getUser()

        // Create insert records
        const inserts: SectionPersonaInsert[] = persona_ids.map((persona_id, index) => ({
            section_id,
            persona_id,
            sort_order: sort_order ?? index,
            added_by: user?.id || null
        }))

        const { data, error } = await supabase
            .from("section_personas")
            .upsert(inserts, { onConflict: 'section_id,persona_id' })
            .select()

        if (error) {
            console.error("Error adding personas to section:", error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            assignments: data,
            message: `${persona_ids.length} persona(s) added to section`
        })
    } catch (error) {
        console.error("Admin section personas add error:", error)
        return NextResponse.json(
            { error: "Failed to add personas to section" },
            { status: 500 }
        )
    }
}

// DELETE: Remove persona from section
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const section_id = searchParams.get('section_id')
        const persona_id = searchParams.get('persona_id')

        if (!section_id || !persona_id) {
            return NextResponse.json(
                { error: "section_id and persona_id are required" },
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

        const { error } = await supabase
            .from("section_personas")
            .delete()
            .eq("section_id", section_id)
            .eq("persona_id", persona_id)

        if (error) {
            console.error("Error removing persona from section:", error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Persona removed from section"
        })
    } catch (error) {
        console.error("Admin section persona remove error:", error)
        return NextResponse.json(
            { error: "Failed to remove persona from section" },
            { status: 500 }
        )
    }
}

// PATCH: Bulk update section assignments for a persona
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { persona_id, section_ids } = body

        console.log('[PATCH /api/admin/section-personas] Request:', { persona_id, section_ids })

        if (!persona_id || !section_ids || !Array.isArray(section_ids)) {
            console.error('[PATCH /api/admin/section-personas] Invalid request:', { persona_id, section_ids })
            return NextResponse.json(
                { error: "persona_id and section_ids (array) are required" },
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

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        console.log('[PATCH /api/admin/section-personas] User:', user?.id)

        // First, remove all existing assignments for this persona
        const { error: deleteError } = await supabase
            .from("section_personas")
            .delete()
            .eq("persona_id", persona_id)

        if (deleteError) {
            console.error('[PATCH /api/admin/section-personas] Delete error:', deleteError)
        }

        // Then, add new assignments
        if (section_ids.length > 0) {
            const inserts: SectionPersonaInsert[] = section_ids.map((section_id, index) => ({
                section_id,
                persona_id,
                sort_order: index,
                added_by: user?.id || null
            }))

            console.log('[PATCH /api/admin/section-personas] Inserting:', inserts)

            const { error, data } = await supabase
                .from("section_personas")
                .insert(inserts)
                .select()

            if (error) {
                console.error('[PATCH /api/admin/section-personas] Insert error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                })
                return NextResponse.json(
                    { error: error.message, details: error.details, hint: error.hint },
                    { status: 500 }
                )
            }

            console.log('[PATCH /api/admin/section-personas] Success:', data)
        }

        return NextResponse.json({
            success: true,
            message: `Persona assigned to ${section_ids.length} section(s)`
        })
    } catch (error) {
        console.error("[PATCH /api/admin/section-personas] Unexpected error:", error)
        return NextResponse.json(
            { error: "Failed to update section assignments", details: String(error) },
            { status: 500 }
        )
    }
}
