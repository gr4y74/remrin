import { createClient } from "@/lib/supabase/server"
import { getPullHistory, getPoolPullHistory, getPullStats } from "@/lib/gacha"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/gacha/history
 * Get user's gacha pull history
 * 
 * Query params:
 *   - poolId: Filter by specific pool (optional)
 *   - limit: Number of results (default: 50)
 *   - offset: Pagination offset (default: 0)
 *   - stats: If "true", returns statistics instead of history
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
        const limitParam = searchParams.get("limit")
        const offsetParam = searchParams.get("offset")
        const showStats = searchParams.get("stats") === "true"

        // Return statistics if requested
        if (showStats) {
            const { data: stats, error } = await getPullStats(supabase, user.id)

            if (error) {
                return NextResponse.json({ error }, { status: 500 })
            }

            return NextResponse.json({
                stats,
                rates: stats ? {
                    legendary: stats.totalPulls > 0
                        ? `${((stats.byRarity.legendary / stats.totalPulls) * 100).toFixed(2)}%`
                        : "0%",
                    epic: stats.totalPulls > 0
                        ? `${((stats.byRarity.epic / stats.totalPulls) * 100).toFixed(2)}%`
                        : "0%",
                    rare: stats.totalPulls > 0
                        ? `${((stats.byRarity.rare / stats.totalPulls) * 100).toFixed(2)}%`
                        : "0%",
                    common: stats.totalPulls > 0
                        ? `${((stats.byRarity.common / stats.totalPulls) * 100).toFixed(2)}%`
                        : "0%"
                } : null
            })
        }

        const limit = limitParam ? parseInt(limitParam, 10) : 50
        const offset = offsetParam ? parseInt(offsetParam, 10) : 0

        // Get history for specific pool or all pools
        let history
        let error

        if (poolId) {
            const result = await getPoolPullHistory(supabase, user.id, poolId, limit)
            history = result.data
            error = result.error
        } else {
            const result = await getPullHistory(supabase, user.id, limit, offset)
            history = result.data
            error = result.error
        }

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        // Group by date for easier display
        const groupedHistory: Record<string, typeof history> = {}
        for (const pull of history) {
            const date = new Date(pull.pulled_at).toLocaleDateString()
            if (!groupedHistory[date]) {
                groupedHistory[date] = []
            }
            groupedHistory[date].push(pull)
        }

        return NextResponse.json({
            history,
            grouped: groupedHistory,
            count: history.length,
            pagination: {
                limit,
                offset,
                hasMore: history.length === limit
            },
            summary: {
                legendary: history.filter(p => p.rarity === "legendary").length,
                epic: history.filter(p => p.rarity === "epic").length,
                rare: history.filter(p => p.rarity === "rare").length,
                common: history.filter(p => p.rarity === "common").length
            }
        })
    } catch (error) {
        console.error("Gacha history API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
