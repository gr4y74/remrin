import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types"

type ContentSection = Database["public"]["Tables"]["content_sections"]["Row"]
type ContentSectionInsert = Database["public"]["Tables"]["content_sections"]["Insert"]
type ContentSectionUpdate = Database["public"]["Tables"]["content_sections"]["Update"]

// GET: List all content sections with persona counts
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

        // Fetch all sections with persona IDs to count them
        const { data: sections, error } = await supabase
            .from("content_sections")
            .select(`
                *,
                section_personas(persona_id)
            `)
            .order("sort_order", { ascending: true })

        if (error) {
            console.error("Error fetching content sections:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform the data to include persona count
        const enrichedSections = sections.map(section => ({
            ...section,
            persona_count: Array.isArray(section.section_personas)
                ? section.section_personas.length
                : 0,
            section_personas: undefined // Remove the raw join data
        }))

        return NextResponse.json({ sections: enrichedSections })
    } catch (error) {
        console.error("Admin content sections error:", error)
        return NextResponse.json(
            { error: "Failed to fetch content sections" },
            { status: 500 }
        )
    }
}

// POST: Create new content section
export async function POST(request: Request) {
    try {
        const body = await request.json()
        console.log("Creating content section with body:", body)
        const { name, slug, description, icon, color, age_rating, sort_order, is_active } = body

        if (!name || !slug) {
            return NextResponse.json(
                { error: "Name and slug are required" },
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

        // Get current user for created_by
        const { data: { user } } = await supabase.auth.getUser()

        const insertData: ContentSectionInsert = {
            name,
            slug,
            description: description || null,
            icon: icon || null,
            color: color || null,
            age_rating: age_rating || 'everyone',
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
            created_by: user?.id || null
        }

        const { data: section, error } = await supabase
            .from("content_sections")
            .insert(insertData)
            .select()
            .single()

        if (error) {
            console.error("Error creating content section:", error)
            return NextResponse.json(
                { error: error.message, details: error },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            section,
            message: "Content section created successfully"
        })
    } catch (error) {
        console.error("Admin content section create error:", error)
        return NextResponse.json(
            { error: "Failed to create content section" },
            { status: 500 }
        )
    }
}

// PATCH: Update content section
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        console.log("Updating content section with body:", body)
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json(
                { error: "Section ID is required" },
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

        // Build update object with only allowed fields
        const updateData: ContentSectionUpdate = {}
        if (updates.name !== undefined) updateData.name = updates.name
        if (updates.slug !== undefined) updateData.slug = updates.slug
        if (updates.description !== undefined) updateData.description = updates.description
        if (updates.icon !== undefined) updateData.icon = updates.icon
        if (updates.color !== undefined) updateData.color = updates.color
        if (updates.age_rating !== undefined) updateData.age_rating = updates.age_rating
        if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order
        if (updates.is_active !== undefined) updateData.is_active = updates.is_active

        const { data: section, error } = await supabase
            .from("content_sections")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Error updating content section:", error)
            return NextResponse.json(
                { error: error.message, details: error },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            section,
            message: "Content section updated successfully"
        })
    } catch (error) {
        console.error("Admin content section update error:", error)
        return NextResponse.json(
            { error: "Failed to update content section" },
            { status: 500 }
        )
    }
}

// DELETE: Delete content section
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: "Section ID is required" },
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

        // Delete the section (cascading deletes will handle section_personas)
        const { error } = await supabase
            .from("content_sections")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Error deleting content section:", error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Content section deleted successfully"
        })
    } catch (error) {
        console.error("Admin content section delete error:", error)
        return NextResponse.json(
            { error: "Failed to delete content section" },
            { status: 500 }
        )
    }
}
