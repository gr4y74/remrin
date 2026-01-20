import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        // Extract filter parameters
        const query = searchParams.get("q") || ""
        const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
        const category = searchParams.get("category")
        const priceRange = searchParams.get("priceRange")
        const rarity = searchParams.get("rarity")
        const sortBy = searchParams.get("sortBy") || "newest"
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = parseInt(searchParams.get("offset") || "0")

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

        // Build query
        let queryBuilder = supabase
            .from("personas")
            .select(
                `
        id,
        name,
        description,
        image_url,
        category,
        tags,
        price,
        visibility,
        is_featured,
        created_at,
        persona_stats(
          followers_count,
          total_chats,
          trending_score
        )
      `,
                { count: "exact" }
            )
            .eq("visibility", "public")

        // Text search
        if (query) {
            queryBuilder = queryBuilder.or(
                `name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`
            )
        }

        // Category filter
        if (category) {
            queryBuilder = queryBuilder.eq("category", category)
        }

        // Tags filter (contains all specified tags)
        if (tags.length > 0) {
            queryBuilder = queryBuilder.contains("tags", tags)
        }

        // Price range filter
        if (priceRange) {
            switch (priceRange) {
                case "free":
                    queryBuilder = queryBuilder.or("price.is.null,price.eq.0")
                    break
                case "1-100":
                    queryBuilder = queryBuilder.gte("price", 1).lte("price", 100)
                    break
                case "100-500":
                    queryBuilder = queryBuilder.gte("price", 100).lte("price", 500)
                    break
                case "500+":
                    queryBuilder = queryBuilder.gte("price", 500)
                    break
            }
        }

        // Rarity filter (if rarity field exists in metadata)
        // Note: This assumes rarity is stored in metadata JSON field
        // Adjust based on actual schema
        if (rarity) {
            queryBuilder = queryBuilder.contains("metadata", { rarity })
        }

        // Sorting
        switch (sortBy) {
            case "popular":
                queryBuilder = queryBuilder.order("trending_score", {
                    ascending: false,
                    foreignTable: "persona_stats",
                })
                break
            case "price_low":
                queryBuilder = queryBuilder.order("price", {
                    ascending: true,
                    nullsFirst: true,
                })
                break
            case "price_high":
                queryBuilder = queryBuilder.order("price", {
                    ascending: false,
                    nullsFirst: false,
                })
                break
            case "newest":
            default:
                queryBuilder = queryBuilder.order("created_at", { ascending: false })
                break
        }

        // Pagination
        queryBuilder = queryBuilder.range(offset, offset + limit - 1)

        const { data: personas, error, count } = await queryBuilder

        if (error) {
            console.error("Search error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Flatten persona_stats
        const enrichedPersonas = personas?.map((p) => ({
            ...p,
            persona_stats: Array.isArray(p.persona_stats)
                ? p.persona_stats[0]
                : p.persona_stats,
        }))

        return NextResponse.json({
            personas: enrichedPersonas || [],
            total: count || 0,
            limit,
            offset,
        })
    } catch (error) {
        console.error("Search API error:", error)
        return NextResponse.json(
            { error: "Failed to search personas" },
            { status: 500 }
        )
    }
}
