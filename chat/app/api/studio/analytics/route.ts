import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Simple in-memory cache per user
let cache: Record<string, {
    data: any
    timestamp: number
}> = {}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = user.id

        // Check cache
        const now = Date.now()
        if (cache[userId] && now - cache[userId].timestamp < CACHE_DURATION) {
            return NextResponse.json(cache[userId].data)
        }

        // 1. Fetch Souls owned by user
        const { data: ownedSouls, error: soulsError } = await supabase
            .from("personas")
            .select("id, name, image_url, category")
            .eq("creator_id", userId)

        if (soulsError) throw soulsError

        if (!ownedSouls || ownedSouls.length === 0) {
            return NextResponse.json({
                metrics: { totalChats: 0, totalMessages: 0, activeUsers: 0 },
                topSouls: [],
                recentActivity: [],
                charts: { messagesPerDay: [], categoryDistribution: [] }
            })
        }

        const soulIds = ownedSouls.map(s => s.id)

        // 2. Fetch Stats for these Souls
        const { data: statsData, error: statsError } = await supabase
            .from("persona_stats")
            .select("total_chats, total_messages, persona_id")
            .in("persona_id", soulIds)

        if (statsError) throw statsError

        const totalChats = statsData.reduce((sum, s) => sum + (s.total_chats || 0), 0)
        const totalMessages = statsData.reduce((sum, s) => sum + (s.total_messages || 0), 0)

        // 3. Active Users (last 30 days) for these Souls
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: activeUsers, error: usersError } = await supabase
            .from("chats")
            .select("id", { count: "exact", head: true })
            .in("assistant_id", soulIds)
            .gt("created_at", thirtyDaysAgo.toISOString())

        if (usersError) throw usersError

        // 4. Recent Activity for these Souls
        // We join messages with chats to filter by assistant_id (soulId)
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
            .in("chats.assistant_id", soulIds)
            .eq("role", "user")
            .order("created_at", { ascending: false })
            .limit(20)

        if (recentError) throw recentError

        // Get profiles for usernames (service role might be needed for privacy or just use what user can see)
        // Since this is for the creator, they should be able to see who interacted? 
        // Actually, for privacy we'll still mask them.
        const userIds = Array.from(new Set(recentMessages.map(m => m.user_id)))
        const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, username, display_name")
            .in("user_id", userIds)

        const profileMap = (profiles || []).reduce((acc: any, p) => {
            acc[p.user_id] = p.display_name || p.username || "Anonymous"
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

        // 5. Category Distribution (for owned souls)
        const categoryStatsMap: Record<string, number> = {}
        ownedSouls.forEach(s => {
            const cat = s.category || "Uncategorized"
            const stat = statsData.find(sd => sd.persona_id === s.id)
            const count = stat?.total_chats || 0
            categoryStatsMap[cat] = (categoryStatsMap[cat] || 0) + count
        })

        const categoryDistribution = Object.entries(categoryStatsMap).map(([name, value]) => ({
            name,
            value
        }))

        // 6. Messages Per Day (last 30 days) for these Souls
        const { data: dailyData } = await supabase
            .from("messages")
            .select("created_at, chat_id, chats!inner(assistant_id)")
            .in("chats.assistant_id", soulIds)
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

        const result = {
            metrics: {
                totalChats,
                totalMessages,
                activeUsers: activeUsers || 0
            },
            topSouls: statsData.map(sd => {
                const s = ownedSouls.find(os => os.id === sd.persona_id)
                return {
                    id: s?.id,
                    name: s?.name,
                    image: s?.image_url,
                    chats: sd.total_chats
                }
            }).sort((a, b) => b.chats - a.chats).slice(0, 10),
            recentActivity,
            charts: {
                messagesPerDay,
                categoryDistribution
            }
        }

        // Save to cache
        cache[userId] = {
            data: result,
            timestamp: now
        }

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60'
            }
        })
    } catch (error: any) {
        console.error("Creator Analytics API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
