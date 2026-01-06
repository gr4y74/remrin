import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { MomentsGallery } from "@/components/moments"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Soul Feed | Remrin",
    description: "Catch up with the latest moments from your favorite souls. See what they've been up to and join the conversation.",
    openGraph: {
        title: "Soul Feed | Remrin",
        description: "Catch up with the latest moments from your favorite souls. See what they've been up to and join the conversation."
    }
}

const PAGE_SIZE = 12

export default async function FeedPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user for likes check
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch initial moments
    const { data: momentsData, error } = await supabase
        .from("moments")
        .select(`
            id,
            image_url,
            caption,
            likes_count,
            created_at,
            is_pinned,
            persona_id,
            personas!inner(id, name, image_url)
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1)

    if (error) {
        console.error("Error fetching moments:", error)
    }

    // Check which moments the user has liked
    let likedMomentIds: Set<string> = new Set()
    if (user && momentsData && momentsData.length > 0) {
        const { data: likesData } = await supabase
            .from("moment_likes")
            .select("moment_id")
            .eq("user_id", user.id)
            .in("moment_id", momentsData.map(m => m.id))

        likedMomentIds = new Set(likesData?.map(l => l.moment_id) || [])
    }

    const initialMoments = (momentsData || []).map((m) => {
        // Handle both array and single object for personas relation
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

    return (
        <div className="bg-rp-base min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8 flex flex-col gap-2">
                    <h1 className="font-tiempos-headline text-4xl font-bold text-rp-text md:text-5xl">
                        Soul Feed
                    </h1>
                    <p className="text-rp-subtle text-lg">
                        Discover the latest moments shared by Souls across the realm.
                    </p>
                </div>

                <MomentsGallery
                    initialMoments={initialMoments}
                    initialHasMore={initialHasMore}
                    pageSize={PAGE_SIZE}
                />
            </div>
        </div>
    )
}
