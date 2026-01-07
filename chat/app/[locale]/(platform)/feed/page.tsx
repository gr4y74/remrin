import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { FeedPageClient } from "./FeedPageClient"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Soul Feed | Remrin",
    description: "Discover moments from souls across the realm. Watch, react, and engage with the community.",
    openGraph: {
        title: "Soul Feed | Remrin",
        description: "Discover moments from souls across the realm. Watch, react, and engage with the community."
    }
}

const PAGE_SIZE = 12

export default async function FeedPage({
    searchParams
}: {
    searchParams: Promise<{ filter?: string; layout?: string }>
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const params = await searchParams
    const filter = params.filter || 'for-you'
    const layout = params.layout || 'grid'

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch initial moments
    let query = supabase
        .from("moments")
        .select(`
            id,
            persona_id,
            created_by_user_id,
            media_type,
            image_url,
            video_url,
            thumbnail_url,
            duration_seconds,
            caption,
            created_at,
            likes_count,
            view_count,
            is_pinned,
            reactions_summary,
            personas!inner(id, name, image_url)
        `)

    // Apply filter
    if (filter === 'trending') {
        query = query
            .order('view_count', { ascending: false })
            .order('likes_count', { ascending: false })
    } else {
        query = query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
    }

    query = query.range(0, PAGE_SIZE - 1)

    const { data: momentsData, error } = await query

    if (error) {
        console.error("Error fetching moments:", error)
    }

    // Get user's reactions
    let userReactionsMap: Record<string, string[]> = {}
    if (user && momentsData && momentsData.length > 0) {
        const { data: reactions } = await supabase
            .from("moment_reactions")
            .select("moment_id, reaction_emoji")
            .eq("user_id", user.id)
            .in("moment_id", momentsData.map(m => m.id))

        userReactionsMap = (reactions || []).reduce((acc, r) => {
            if (!acc[r.moment_id]) acc[r.moment_id] = []
            acc[r.moment_id].push(r.reaction_emoji)
            return acc
        }, {} as Record<string, string[]>)
    }

    const initialMoments = (momentsData || []).map((m) => {
        const personaData = Array.isArray(m.personas) ? m.personas[0] : m.personas
        return {
            id: m.id,
            persona_id: m.persona_id,
            created_by_user_id: m.created_by_user_id,
            media_type: m.media_type as 'image' | 'video',
            image_url: m.image_url,
            video_url: m.video_url,
            thumbnail_url: m.thumbnail_url,
            duration_seconds: m.duration_seconds,
            caption: m.caption,
            created_at: m.created_at,
            likes_count: m.likes_count,
            view_count: m.view_count,
            is_pinned: m.is_pinned,
            reactions_summary: m.reactions_summary || {},
            persona: {
                id: personaData?.id || m.persona_id,
                name: personaData?.name || "Unknown",
                image_url: personaData?.image_url || null
            },
            userReactions: userReactionsMap[m.id] || []
        }
    })

    return (
        <FeedPageClient
            initialMoments={initialMoments}
            initialFilter={filter}
            initialLayout={layout}
            hasMore={initialMoments.length === PAGE_SIZE}
            user={user}
        />
    )
}
