import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/supabase/types"
import { revalidatePath } from "next/cache"

// Helper to get admin client
const getAdminSupabase = () => {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )
}

// GET: List all banners
export async function GET() {
    try {
        const supabase = getAdminSupabase()

        const { data: banners, error } = await supabase
            .from("banners")
            .select("*")
            .order("sort_order", { ascending: true })

        if (error) {
            console.error("Error fetching banners:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ banners })
    } catch (error) {
        console.error("Admin banners error:", error)
        return NextResponse.json(
            { error: "Failed to fetch banners" },
            { status: 500 }
        )
    }
}

// POST: Create a new banner
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { title, image_url, link_url, is_active } = body

        console.log("[API/admin/banners] Creating banner:", { title, image_url })

        if (!title || !image_url) {
            console.error("[API/admin/banners] Missing required fields")
            return NextResponse.json(
                { error: "Title and Image URL are required" },
                { status: 400 }
            )
        }

        const supabase = getAdminSupabase()

        // Get max sort order
        console.log("[API/admin/banners] Fetching max sort order...")
        const { data: maxOrderData, error: maxOrderError } = await supabase
            .from("banners")
            .select("sort_order")
            .order("sort_order", { ascending: false })
            .limit(1)

        if (maxOrderError) {
            console.error("[API/admin/banners] Failed to fetch max order:", maxOrderError)
        }

        const nextOrder = (maxOrderData?.[0]?.sort_order ?? -1) + 1
        console.log("[API/admin/banners] Next sort order:", nextOrder)

        const bannerData = {
            title,
            image_url,
            link_url: link_url || null,
            is_active: is_active ?? true,
            sort_order: nextOrder
        }

        console.log("[API/admin/banners] Inserting:", bannerData)

        const { data, error } = await supabase
            .from("banners")
            .insert([bannerData])
            .select()
            .single()

        if (error) {
            console.error("[API/admin/banners] Insert error:", error)
            throw error
        }

        console.log("[API/admin/banners] Success:", data)

        // Revalidate the discover page to show the new banner immediately
        revalidatePath('/(platform)/discover', 'page')
        revalidatePath('/[locale]/(platform)/discover', 'page')

        return NextResponse.json({ success: true, banner: data })

    } catch (error) {
        console.error("Create banner error:", error)
        return NextResponse.json({ error: "Failed to create banner" }, { status: 500 })
    }
}

// PATCH: Update a banner (including reorder)
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, updates } = body

        if (!id && !updates) {
            // Handle batch updates (for reordering logic if needed, or single update)
            // Let's support single update first
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        const supabase = getAdminSupabase()

        const { error } = await supabase
            .from("banners")
            .update(updates)
            .eq("id", id)

        if (error) throw error

        // Revalidate on update
        revalidatePath('/(platform)/discover', 'page')
        revalidatePath('/[locale]/(platform)/discover', 'page')

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Update banner error:", error)
        return NextResponse.json({ error: "Failed to update banner" }, { status: 500 })
    }
}

// DELETE: Delete a banner
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 })
        }

        const supabase = getAdminSupabase()

        const { error } = await supabase
            .from("banners")
            .delete()
            .eq("id", id)

        if (error) throw error

        // Revalidate on delete
        revalidatePath('/(platform)/discover', 'page')
        revalidatePath('/[locale]/(platform)/discover', 'page')

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Delete banner error:", error)
        return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 })
    }
}
