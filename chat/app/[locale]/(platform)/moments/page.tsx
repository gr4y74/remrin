import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { MomentsGallery, MomentData } from "@/components/moments"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Moments | Remrin",
    description: "Explore moments shared by your favorite AI companions. Browse galleries, like photos, and discover new content.",
    openGraph: {
        title: "Moments | Remrin",
        description: "Explore moments shared by your favorite AI companions. Browse galleries, like photos, and discover new content."
    }
}

const PAGE_SIZE = 12

interface MomentsPageProps {
    searchParams: Promise<{ persona?: string }>
}

export default async function MomentsPage({ searchParams }: MomentsPageProps) {
    const { persona: personaId } = await searchParams
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user for checking likes
    const { data: { user } } = await supabase.auth.getUser()

    // Build moments query
    let query = supabase
        .from("moments")
        .select(`
            id,
            image_url,
            caption,
            likes_count,
            created_at,
            is_pinned,
            persona_id,
            personas!inner(id, name, image_url, status)
        `)
        .eq("personas.status", "approved")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1)

    if (personaId) {
        query = query.eq("persona_id", personaId)
    }

    const { data: momentsData, error } = await query

    if (error) {
        console.error("Error fetching moments:", error)
    }

    // Get user's liked moments
    let likedMomentIds: Set<string> = new Set()
    if (user && momentsData && momentsData.length > 0) {
        const { data: likesData } = await supabase
            .from("moment_likes")
            .select("moment_id")
            .eq("user_id", user.id)
            .in("moment_id", momentsData.map(m => m.id))

        likedMomentIds = new Set(likesData?.map(l => l.moment_id) || [])
    }

    // Transform data
    const initialMoments: MomentData[] = (momentsData || []).map((m) => {
        // Handle both array and object for personas relation
        const personaData = Array.isArray(m.personas) ? m.personas[0] : m.personas
        return {
            id: m.id,
            imageUrl: m.image_url,
            caption: m.caption,
            likesCount: m.likes_count,
            isLiked: likedMomentIds.has(m.id),
            createdAt: m.created_at,
            isPinned: m.is_pinned,
            persona: {
                id: personaData?.id || m.persona_id,
                name: personaData?.name || "Unknown",
                imageUrl: personaData?.image_url || null
            }
        }
    })

    const initialHasMore = initialMoments.length === PAGE_SIZE

    // Get persona info for header if filtering
    let personaName: string | null = null
    if (personaId) {
        const { data: persona } = await supabase
            .from("personas")
            .select("name")
            .eq("id", personaId)
            .single()
        personaName = persona?.name || null
    }

    return (
        <div className="min-h-screen bg-rp-base">
            {/* Header */}
            <header className="border-b border-rp-highlight-med bg-rp-base/80 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-rp-text">
                        {personaName ? `${personaName}'s Moments` : "Moments"}
                    </h1>
                    <p className="mt-2 text-rp-subtle">
                        {personaName
                            ? `Browse gallery content from ${personaName}`
                            : "Explore moments shared by your favorite characters"
                        }
                    </p>

                    {/* Filter indicator */}
                    {personaId && (
                        <a
                            href="/moments"
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-rp-surface px-4 py-2 text-sm text-rp-subtle transition-colors hover:bg-rp-overlay"
                        >
                            <span>Showing: {personaName}</span>
                            <span className="text-rp-muted">×</span>
                        </a>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <MomentsGallery
                    initialMoments={initialMoments}
                    personaId={personaId}
                    initialHasMore={initialHasMore}
                    pageSize={PAGE_SIZE}
                />
            </main>
        </div>
    )
}
