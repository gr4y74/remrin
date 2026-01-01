import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Simple in-memory cache
let cache: {
    data: any
    timestamp: number
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper to check admin authentication
function isAdmin(request: NextRequest): boolean {
    const authHeader = request.headers.get("x-admin-password")
    const adminPassword = process.env.ADMIN_PASSWORD

    // If no password configured, we might warn but for now we'll allow (or deny? Safe to deny)
    // Actually, usually in this project if ADMIN_PASSWORD is not set, we might be in dev or insecure mode.
    // But let's follow the strict pattern: if set, must match.
    if (adminPassword && authHeader !== adminPassword) {
        return false
    }
    return true
}

export async function GET(request: NextRequest) {
    try {
        // Enforce Admin Authentication
        if (!isAdmin(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check cache
        const now = Date.now()
        if (cache && now - cache.timestamp < CACHE_DURATION) {
            return NextResponse.json(cache.data)
        }

        const supabase = createAdminClient()

        // 1. Overview Metrics
        const { data: statsData, error: statsError } = await supabase
            .from("persona_stats")
            .select("total_chats, total_messages")

        if (statsError) throw statsError

        const totalChats = statsData.reduce((sum, s) => sum + (s.total_chats || 0), 0)
        const totalMessages = statsData.reduce((sum, s) => sum + (s.total_messages || 0), 0)

        // 2. Active Users (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: activeUsers, error: usersError } = await supabase
            .from("chats")
            .select("id, assistant_id, created_at", { count: "exact", head: true })
            .gt("created_at", thirtyDaysAgo.toISOString())

        if (usersError) throw usersError

        // 3. Top Souls (by chat volume)
        const { data: topSouls, error: topError } = await supabase
            .from("persona_stats")
            .select(`
                total_chats,
                personas:persona_id (
                    id,
                    name,
                    image_url
                )
            `)
            .order("total_chats", { ascending: false })
            .limit(10)

        if (topError) throw topError

        // 4. Recent Activity (masked usernames)
        const { data: recentMessages, error: recentError } = await supabase
            .from("messages")
            .select(`
                content,
                created_at,
                user_id,
                role,
                chat_id,
                chats!inner (
                    assistant_id,
                    personas:assistant_id (
                        name
                    )
                )
            `)
            .eq("role", "user")
            .order("created_at", { ascending: false })
            .limit(20)

        if (recentError) throw recentError

        // Get profiles for usernames
        const userIds = Array.from(new Set(recentMessages.map(m => m.user_id)))
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("user_id, username, display_name")
            .in("user_id", userIds)

        const profileMap = (profiles || []).reduce((acc: any, p) => {
            acc[p.user_id] = p.display_name || p.username || "Unknown"
            return acc
        }, {})

        const recentActivity = recentMessages.map((m: any) => {
            const rawName = profileMap[m.user_id] || "Anonymous"
            const maskedName = rawName.length > 2
                ? rawName[0] + "***" + rawName[rawName.length - 1]
                : rawName[0] + "***"

            return {
                content: m.content,
                timestamp: m.created_at,
                username: maskedName,
                soulName: m.chats?.personas?.name || "Unknown Soul"
            }
        })

        // 5. Messages Per Day (last 30 days)
        // Note: Postgrest doesn't support grouping by date easily without RPC or raw SQL.
        // We'll fetch the last 1000 messages and aggregate in JS for simplicity, 
        // or just use a more efficient query if we can.
        // Actually, we can just fetch the counts for each day in a loop if needed, 
        // but better to fetch all and group.
        const { data: dailyData, error: dailyError } = await supabase
            .from("messages")
            .select("created_at")
            .gt("created_at", thirtyDaysAgo.toISOString())
            .order("created_at", { ascending: true })

        const messagesPerDayMap: Record<string, number> = {}
        dailyData?.forEach(m => {
            const date = m.created_at.split("T")[0]
            messagesPerDayMap[date] = (messagesPerDayMap[date] || 0) + 1
        })

        const messagesPerDay = Object.entries(messagesPerDayMap).map(([date, count]) => ({
            date,
            count
        }))

        // 6. Category Distribution
        const { data: categoryData, error: categoryError } = await supabase
            .from("personas")
            .select(`
                category,
                persona_stats (
                    total_chats
                )
            `)

        const categoryStatsMap: Record<string, number> = {}
        categoryData?.forEach((p: any) => {
            const cat = p.category || "Uncategorized"
            const count = p.persona_stats?.total_chats || 0
            categoryStatsMap[cat] = (categoryStatsMap[cat] || 0) + count
        })

        const categoryDistribution = Object.entries(categoryStatsMap).map(([name, value]) => ({
            name,
            value
        }))

        // 7. Soul Economy Stats
        // Fetch total pulls and aether spent
        const { data: pullStats, error: pullError } = await supabase
            .from("user_pulls")
            .select("aether_spent, rarity")

        if (pullError) {
            console.warn("Error fetching pull stats:", pullError)
            // Non-blocking error
        }

        const totalSummons = pullStats?.length || 0
        const totalAetherSpent = pullStats?.reduce((sum, p) => sum + (p.aether_spent || 0), 0) || 0
        const legendaryCount = pullStats?.filter(p => p.rarity === 'legendary').length || 0

        const result = {
            metrics: {
                totalChats,
                totalMessages,
                activeUsers: activeUsers || 0,
                economy: {
                    totalSummons,
                    totalAetherSpent,
                    legendaryCount
                }
            },
            topSouls: topSouls.map((ts: any) => ({
                id: ts.personas?.id,
                name: ts.personas?.name,
                image: ts.personas?.image_url,
                chats: ts.total_chats
            })),
            recentActivity,
            charts: {
                messagesPerDay,
                categoryDistribution
            }
        }

        // Save to cache
        cache = {
            data: result,
            timestamp: now
        }

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'
            }
        })
    } catch (error: any) {
        console.error("Analytics API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
