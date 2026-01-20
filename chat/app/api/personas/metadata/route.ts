import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types"

export async function GET() {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        // Fetch all public personas to extract unique tags and categories
        const { data: personas, error } = await supabase
            .from("personas")
            .select("tags, category")
            .eq("visibility", "public")

        if (error) {
            console.error("Metadata fetch error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Extract unique tags
        const tagsSet = new Set<string>()
        const categoriesSet = new Set<string>()

        personas?.forEach((persona) => {
            if (persona.tags && Array.isArray(persona.tags)) {
                persona.tags.forEach((tag) => tagsSet.add(tag))
            }
            if (persona.category) {
                categoriesSet.add(persona.category)
            }
        })

        const tags = Array.from(tagsSet).sort()
        const categories = Array.from(categoriesSet).sort()

        return NextResponse.json({
            tags,
            categories,
        })
    } catch (error) {
        console.error("Metadata API error:", error)
        return NextResponse.json(
            { error: "Failed to fetch metadata" },
            { status: 500 }
        )
    }
}
