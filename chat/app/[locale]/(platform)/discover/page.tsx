import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DiscoveryFeed } from "@/components/discovery"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Discover Souls | Remrin",
    description: "Explore and chat with AI companions. Find trending characters, browse by category, and start meaningful conversations.",
    openGraph: {
        title: "Discover Souls | Remrin",
        description: "Explore and chat with AI companions. Find trending characters, browse by category, and start meaningful conversations."
    }
}

const PAGE_SIZE = 12

export default async function DiscoverPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch categories with error handling
    let categories: Array<{ id: string; name: string; slug: string; icon: string | null; color: string | null }> = []
    try {
        const { data: categoriesData } = await supabase
            .from("categories")
            .select("id, name, slug, icon, color")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })

        categories = categoriesData ?? []
    } catch (error) {
        console.error("Error fetching categories:", error)
    }

    // Create category color map
    const categoryColors: Record<string, string> = {}
    categories.forEach((cat) => {
        if (cat.color) {
            categoryColors[cat.name] = cat.color
        }
    })

    // Fetch initial personas
    const { data: personasData } = await supabase
        .from("personas")
        .select(`
      id,
      name,
      image_url,
      category,
      description,
      is_featured,
      tags,
      persona_stats(total_chats, trending_score)
    `)
        .eq("status", "approved")
        .eq("visibility", "PUBLIC")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1)

    const initialPersonas = (personasData ?? []).map((p) => ({
        ...p,
        persona_stats: Array.isArray(p.persona_stats) ? p.persona_stats[0] ?? null : p.persona_stats
    }))
    const initialHasMore = initialPersonas.length === PAGE_SIZE

    // Fetch trending personas (featured or high trending score)
    const { data: trendingData } = await supabase
        .from("personas")
        .select(`
      id,
      name,
      image_url,
      category,
      description,
      is_featured,
      tags,
      persona_stats(total_chats, trending_score, followers_count)
    `)
        .eq("status", "approved")
        .eq("visibility", "PUBLIC")
        .or("is_featured.eq.true,persona_stats.trending_score.gt.50")
        .order("is_featured", { ascending: false })
        .limit(10)

    interface TrendingRow {
        id: string
        name: string
        image_url: string | null
        category: string | null
        description: string | null
        is_featured: boolean | null
        tags: string[] | null
        persona_stats: { total_chats: number; trending_score: number; followers_count: number } | null
    }

    // Sort by trending score as a fallback for sorting order if needed, but we already ordered by featured.
    // Let's also sort high to low score within featured?
    // The current query orders by is_featured.

    const trendingPersonas = (trendingData as TrendingRow[] | null)?.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.image_url,
        category: p.category,
        description: p.description,
        totalChats: p.persona_stats?.total_chats ?? 0,
        followersCount: p.persona_stats?.followers_count ?? 0,
        tags: p.tags ?? [],
        isFeatured: p.is_featured ?? false,
        // Map trending_score to creativity for the card
        creativity: p.persona_stats?.trending_score ?? 50
    })) ?? []

    return (
        <DiscoveryFeed
            initialPersonas={initialPersonas}
            trendingPersonas={trendingPersonas}
            categories={categories}
            categoryColors={categoryColors}
            initialHasMore={initialHasMore}
        />
    )
}
