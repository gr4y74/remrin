import { createClient } from "@/lib/supabase/server"
import { getActivePools, getPoolById, getFeaturedItems } from "@/lib/gacha"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/gacha/pools
 * Returns active gacha pools with featured items
 * 
 * Query params:
 *   - id: Get a specific pool with full details
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const searchParams = request.nextUrl.searchParams
        const poolId = searchParams.get("id")

        // Get specific pool details
        if (poolId) {
            const { data: pool, error: poolError } = await getPoolById(supabase, poolId)

            if (poolError || !pool) {
                return NextResponse.json(
                    { error: "Pool not found" },
                    { status: 404 }
                )
            }

            // Get featured items for this pool
            const { data: featuredItems } = await getFeaturedItems(supabase, poolId)

            return NextResponse.json({
                pool,
                featured: featuredItems,
                rates: {
                    common: "80%",
                    rare: "15%",
                    epic: "4.5%",
                    legendary: "0.5%"
                },
                pity: {
                    rare: { soft: 8, hard: 10 },
                    legendary: { soft: 75, hard: 90 }
                }
            })
        }

        // Get all active pools
        const { data: pools, error } = await getActivePools(supabase)

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        // Get featured items for each pool
        const poolsWithFeatured = await Promise.all(
            pools.map(async (pool) => {
                const { data: featured } = await getFeaturedItems(supabase, pool.id)
                return {
                    ...pool,
                    featured: featured || []
                }
            })
        )

        return NextResponse.json({
            pools: poolsWithFeatured,
            count: pools.length
        })
    } catch (error) {
        console.error("Gacha pools API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
