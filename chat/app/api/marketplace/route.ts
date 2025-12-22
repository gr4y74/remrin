import { createClient } from "@/lib/supabase/server"
import { getActiveListings, ListingFilters } from "@/lib/marketplace"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/marketplace
 * List all active marketplace listings with persona details
 * Query params:
 *   - category: filter by category (future use)
 *   - sort: "price" | "popular" | "newest" (default: "newest")
 *   - limit: number of results (default: 50)
 *   - offset: pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams
        const category = searchParams.get("category") || undefined
        const sortParam = searchParams.get("sort")
        const limitParam = searchParams.get("limit")
        const offsetParam = searchParams.get("offset")

        const filters: ListingFilters = {
            category,
            sort:
                sortParam === "price" || sortParam === "popular"
                    ? sortParam
                    : "newest",
            limit: limitParam ? parseInt(limitParam, 10) : 50,
            offset: offsetParam ? parseInt(offsetParam, 10) : 0
        }

        const { data: listings, error } = await getActiveListings(supabase, filters)

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({
            listings,
            count: listings.length,
            filters: {
                category: filters.category,
                sort: filters.sort,
                limit: filters.limit,
                offset: filters.offset
            }
        })
    } catch (error) {
        console.error("Marketplace API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
