import { createClient } from "@/lib/supabase/server"
import { performPull, getUserPity, PULL_COST_SINGLE, PULL_COST_MULTI } from "@/lib/gacha"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * POST /api/gacha/pull
 * Perform a gacha pull
 * 
 * Body:
 *   - poolId: UUID of the pool to pull from
 *   - count: 1 or 10 (number of pulls)
 * 
 * Returns:
 *   - pulls: Array of pulled items with rarity
 *   - aetherSpent: Total Aether spent
 *   - pity: Updated pity counters
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Authenticate user
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { poolId, count } = body

        // Validate input
        if (!poolId || typeof poolId !== "string") {
            return NextResponse.json(
                { error: "Missing or invalid poolId" },
                { status: 400 }
            )
        }

        if (count !== 1 && count !== 10) {
            return NextResponse.json(
                { error: "Count must be 1 or 10" },
                { status: 400 }
            )
        }

        // Perform the pull
        const { data: pulls, error, aetherSpent } = await performPull(
            supabase,
            user.id,
            poolId,
            count as 1 | 10
        )

        if (error) {
            // Handle specific errors
            if (error.includes("Insufficient")) {
                return NextResponse.json(
                    {
                        error,
                        required: count === 10 ? PULL_COST_MULTI : PULL_COST_SINGLE
                    },
                    { status: 402 }
                )
            }
            if (error.includes("not found")) {
                return NextResponse.json({ error }, { status: 404 })
            }
            return NextResponse.json({ error }, { status: 500 })
        }

        // Get updated pity
        const { data: pity } = await getUserPity(supabase, user.id, poolId)

        // Sort results by rarity for dramatic reveal
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
        const sortedPulls = [...pulls].sort((a, b) =>
            rarityOrder[a.rarity] - rarityOrder[b.rarity]
        )

        return NextResponse.json({
            success: true,
            pulls: sortedPulls,
            aetherSpent,
            count: pulls.length,
            pity: pity ? {
                pullsSinceLegendary: pity.pulls_since_legendary,
                pullsSinceRare: pity.pulls_since_rare,
                totalPulls: pity.total_pulls
            } : null,
            highlights: {
                legendaries: pulls.filter(p => p.rarity === "legendary").length,
                epics: pulls.filter(p => p.rarity === "epic").length,
                rares: pulls.filter(p => p.rarity === "rare").length
            }
        })
    } catch (error) {
        console.error("Gacha pull API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/gacha/pull
 * Get pull costs and current pity status
 * 
 * Query params:
 *   - poolId: UUID of the pool
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Authenticate user
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const poolId = searchParams.get("poolId")

        if (!poolId) {
            return NextResponse.json({
                costs: {
                    single: PULL_COST_SINGLE,
                    multi: PULL_COST_MULTI,
                    discount: `${Math.round((1 - PULL_COST_MULTI / (PULL_COST_SINGLE * 10)) * 100)}%`
                }
            })
        }

        // Get pity for specific pool
        const { data: pity } = await getUserPity(supabase, user.id, poolId)

        return NextResponse.json({
            costs: {
                single: PULL_COST_SINGLE,
                multi: PULL_COST_MULTI,
                discount: `${Math.round((1 - PULL_COST_MULTI / (PULL_COST_SINGLE * 10)) * 100)}%`
            },
            pity: pity ? {
                pullsSinceLegendary: pity.pulls_since_legendary,
                pullsSinceRare: pity.pulls_since_rare,
                totalPulls: pity.total_pulls,
                untilLegendaryPity: 90 - pity.pulls_since_legendary,
                untilRarePity: 10 - pity.pulls_since_rare
            } : null
        })
    } catch (error) {
        console.error("Gacha pull GET API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
