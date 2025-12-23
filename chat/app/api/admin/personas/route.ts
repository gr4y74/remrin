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
            .select("id, name, description, image_url, visibility, is_featured, created_at")
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching personas:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ personas })
    } catch (error) {
        console.error("Admin personas error:", error)
        return NextResponse.json(
            { error: "Failed to fetch personas" },
            { status: 500 }
        )
    }
}

// PATCH: Batch update personas (featured status or visibility)
export async function PATCH(request: Request) {
    try {
        const { updates } = await request.json()
        // updates: Array<{ id: string, is_featured?: boolean, visibility?: string }>

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
            updates.map(async (update: { id: string; is_featured?: boolean; visibility?: string }) => {
                const updateData: Record<string, unknown> = {}
                if (update.is_featured !== undefined) {
                    updateData.is_featured = update.is_featured
                }
                if (update.visibility !== undefined) {
                    updateData.visibility = update.visibility
                }

                const { error } = await supabase
                    .from("personas")
                    .update(updateData)
                    .eq("id", update.id)

                return { id: update.id, success: !error, error: error?.message }
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
