"use client"

import { useState, useCallback } from "react"
import { MomentCard } from "./MomentCard"
import { MomentModal } from "./MomentModal"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export interface MomentData {
    id: string
    imageUrl: string
    caption: string | null
    likesCount: number
    isLiked: boolean
    createdAt: string
    isPinned: boolean
    persona: {
        id: string
        name: string
        imageUrl: string | null
    }
}

interface MomentsGalleryProps {
    initialMoments: MomentData[]
    personaId?: string
    initialHasMore?: boolean
    pageSize?: number
    showViewAllLink?: boolean
    viewAllHref?: string
}

export function MomentsGallery({
    initialMoments,
    personaId,
    initialHasMore = false,
    pageSize = 12,
    showViewAllLink = false,
    viewAllHref
}: MomentsGalleryProps) {
    const [moments, setMoments] = useState<MomentData[]>(initialMoments)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedMomentIndex, setSelectedMomentIndex] = useState<number | null>(null)

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return

        setIsLoading(true)
        try {
            const supabase = createClient()
            const offset = moments.length

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
                    personas!inner(id, name, image_url)
                `)
                .order("is_pinned", { ascending: false })
                .order("created_at", { ascending: false })
                .range(offset, offset + pageSize - 1)

            if (personaId) {
                query = query.eq("persona_id", personaId)
            }

            const { data: momentsData, error } = await query

            if (error) {
                console.error("Error loading moments:", error)
                return
            }

            // Get current user to check likes
            const { data: { user } } = await supabase.auth.getUser()
            let likedMomentIds: Set<string> = new Set()

            if (user && momentsData && momentsData.length > 0) {
                const { data: likesData } = await supabase
                    .from("moment_likes")
                    .select("moment_id")
                    .eq("user_id", user.id)
                    .in("moment_id", momentsData.map(m => m.id))

                likedMomentIds = new Set(likesData?.map(l => l.moment_id) || [])
            }

            const newMoments: MomentData[] = (momentsData || []).map((m) => {
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

            setMoments((prev) => [...prev, ...newMoments])
            setHasMore(newMoments.length === pageSize)
        } catch (error) {
            console.error("Error loading more moments:", error)
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, hasMore, moments.length, personaId, pageSize])

    const handleLike = async (momentId: string, liked: boolean) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new Error("Must be logged in to like moments")
        }

        if (liked) {
            const { error } = await supabase
                .from("moment_likes")
                .insert({ moment_id: momentId, user_id: user.id })

            if (error && error.code !== "23505") { // Ignore duplicate key errors
                throw error
            }
        } else {
            const { error } = await supabase
                .from("moment_likes")
                .delete()
                .eq("moment_id", momentId)
                .eq("user_id", user.id)

            if (error) throw error
        }

        // Update local state
        setMoments((prev) =>
            prev.map((m) =>
                m.id === momentId
                    ? {
                        ...m,
                        isLiked: liked,
                        likesCount: liked ? m.likesCount + 1 : Math.max(0, m.likesCount - 1)
                    }
                    : m
            )
        )
    }

    const handlePrevMoment = () => {
        if (selectedMomentIndex !== null && selectedMomentIndex > 0) {
            setSelectedMomentIndex(selectedMomentIndex - 1)
        }
    }

    const handleNextMoment = () => {
        if (selectedMomentIndex !== null && selectedMomentIndex < moments.length - 1) {
            setSelectedMomentIndex(selectedMomentIndex + 1)
        }
    }

    const selectedMoment = selectedMomentIndex !== null ? moments[selectedMomentIndex] : null

    if (moments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-zinc-400">No moments yet</p>
                <p className="mt-1 text-sm text-zinc-500">
                    Check back later for new content
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Masonry Grid */}
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                {moments.map((moment, index) => (
                    <div key={moment.id} className="mb-4 break-inside-avoid">
                        <MomentCard
                            id={moment.id}
                            imageUrl={moment.imageUrl}
                            caption={moment.caption}
                            likesCount={moment.likesCount}
                            isLiked={moment.isLiked}
                            personaName={moment.persona.name}
                            personaImageUrl={moment.persona.imageUrl}
                            onClick={() => setSelectedMomentIndex(index)}
                            onLike={handleLike}
                        />
                    </div>
                ))}
            </div>

            {/* Load More / View All */}
            <div className="flex justify-center gap-4">
                {hasMore && (
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoading}
                        className="rounded-full border-white/10 bg-white/5 px-8 hover:bg-white/10"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                )}

                {showViewAllLink && viewAllHref && (
                    <Button
                        variant="ghost"
                        asChild
                        className="rounded-full text-purple-400 hover:text-purple-300"
                    >
                        <a href={viewAllHref}>View All Moments →</a>
                    </Button>
                )}
            </div>

            {/* Modal */}
            {selectedMoment && selectedMomentIndex !== null && (
                <MomentModal
                    isOpen={true}
                    onClose={() => setSelectedMomentIndex(null)}
                    moment={selectedMoment}
                    onLike={handleLike}
                    onPrev={selectedMomentIndex > 0 ? handlePrevMoment : undefined}
                    onNext={selectedMomentIndex < moments.length - 1 ? handleNextMoment : undefined}
                />
            )}
        </div>
    )
}
