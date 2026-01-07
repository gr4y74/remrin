"use client"

import { useState, useCallback } from "react"
import { MomentCard } from "./MomentCard"
import { MomentModal } from "./MomentModal"
import { FeedLayout } from "./FeedLayout"
import { Button } from "@/components/ui/button"
import { Loader2, Grid3X3, Play } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MomentWithPersona } from "@/types/moments"
import { cn } from "@/lib/utils"

export interface MomentData {
    id: string
    imageUrl: string
    videoUrl?: string | null
    thumbnailUrl?: string | null
    mediaType?: 'image' | 'video'
    caption: string | null
    likesCount: number
    isLiked: boolean
    createdAt: string
    isPinned: boolean
    reactionsCount?: number
    reactionsSummary?: Record<string, number>
    userReactions?: string[]
    persona: {
        id: string
        name: string
        imageUrl: string | null
    }
}

type ViewMode = 'grid' | 'feed'

interface MomentsGalleryProps {
    initialMoments: MomentData[]
    personaId?: string
    initialHasMore?: boolean
    pageSize?: number
    showViewAllLink?: boolean
    viewAllHref?: string
    defaultViewMode?: ViewMode
    showViewToggle?: boolean
}

export function MomentsGallery({
    initialMoments,
    personaId,
    initialHasMore = false,
    pageSize = 12,
    showViewAllLink = false,
    viewAllHref,
    defaultViewMode = 'grid',
    showViewToggle = true
}: MomentsGalleryProps) {
    const [moments, setMoments] = useState<MomentData[]>(initialMoments)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedMomentIndex, setSelectedMomentIndex] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)

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
                    video_url,
                    thumbnail_url,
                    media_type,
                    caption,
                    likes_count,
                    created_at,
                    is_pinned,
                    persona_id,
                    reactions_summary,
                    view_count,
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

            // Get current user to check likes and reactions
            const { data: { user } } = await supabase.auth.getUser()
            let likedMomentIds: Set<string> = new Set()
            let userReactionsMap: Map<string, string[]> = new Map()

            if (user && momentsData && momentsData.length > 0) {
                const momentIds = momentsData.map(m => m.id)

                // Get likes
                const { data: likesData } = await supabase
                    .from("moment_likes")
                    .select("moment_id")
                    .eq("user_id", user.id)
                    .in("moment_id", momentIds)

                likedMomentIds = new Set(likesData?.map(l => l.moment_id) || [])

                // Get user's reactions
                const { data: reactionsData } = await supabase
                    .from("moment_reactions")
                    .select("moment_id, reaction_emoji")
                    .eq("user_id", user.id)
                    .in("moment_id", momentIds)

                if (reactionsData) {
                    reactionsData.forEach(r => {
                        const existing = userReactionsMap.get(r.moment_id) || []
                        userReactionsMap.set(r.moment_id, [...existing, r.reaction_emoji])
                    })
                }
            }

            const newMoments: MomentData[] = (momentsData || []).map((m) => {
                // Handle both array and single object for personas relation
                const personaData = Array.isArray(m.personas) ? m.personas[0] : m.personas
                return {
                    id: m.id,
                    imageUrl: m.image_url,
                    videoUrl: m.video_url,
                    thumbnailUrl: m.thumbnail_url,
                    mediaType: m.media_type || 'image',
                    caption: m.caption,
                    likesCount: m.likes_count,
                    isLiked: likedMomentIds.has(m.id),
                    createdAt: m.created_at,
                    isPinned: m.is_pinned,
                    reactionsSummary: m.reactions_summary || {},
                    userReactions: userReactionsMap.get(m.id) || [],
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

    const handleReact = async (momentId: string, emoji: string, isAdding: boolean) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw new Error("Must be logged in to react")
        }

        if (isAdding) {
            const { error } = await supabase
                .from("moment_reactions")
                .insert({
                    moment_id: momentId,
                    user_id: user.id,
                    reaction_emoji: emoji
                })

            if (error && error.code !== "23505") {
                throw error
            }
        } else {
            const { error } = await supabase
                .from("moment_reactions")
                .delete()
                .eq("moment_id", momentId)
                .eq("user_id", user.id)
                .eq("reaction_emoji", emoji)

            if (error) throw error
        }

        // Update local state
        setMoments((prev) =>
            prev.map((m) => {
                if (m.id !== momentId) return m

                const newReactionsSummary = { ...(m.reactionsSummary || {}) }
                if (isAdding) {
                    newReactionsSummary[emoji] = (newReactionsSummary[emoji] || 0) + 1
                } else {
                    newReactionsSummary[emoji] = Math.max(0, (newReactionsSummary[emoji] || 0) - 1)
                }

                const newUserReactions = isAdding
                    ? [...(m.userReactions || []), emoji]
                    : (m.userReactions || []).filter(e => e !== emoji)

                return {
                    ...m,
                    reactionsSummary: newReactionsSummary,
                    userReactions: newUserReactions
                }
            })
        )
    }

    const handleView = async (momentId: string) => {
        try {
            await fetch(`/api/moments/${momentId}/view`, { method: 'POST' })
        } catch (error) {
            console.error("Error recording view:", error)
        }
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

    // Convert MomentData to MomentWithPersona for FeedLayout
    const feedMoments: (MomentWithPersona & { userReactions?: string[] })[] = moments.map(m => ({
        id: m.id,
        persona_id: m.persona.id,
        created_by_user_id: null,
        media_type: m.mediaType || 'image',
        image_url: m.imageUrl,
        video_url: m.videoUrl || null,
        thumbnail_url: m.thumbnailUrl || null,
        duration_seconds: null,
        caption: m.caption,
        created_at: m.createdAt,
        likes_count: m.likesCount,
        view_count: 0,
        is_pinned: m.isPinned,
        reactions_summary: m.reactionsSummary || {},
        userReactions: m.userReactions || [],
        persona: {
            id: m.persona.id,
            name: m.persona.name,
            image_url: m.persona.imageUrl
        }
    }))

    if (moments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-rp-subtle text-lg">No moments yet</p>
                <p className="text-rp-muted mt-1 text-sm">
                    Check back later for new content
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* View Mode Toggle */}
            {showViewToggle && (
                <div className="flex justify-center">
                    <div className="inline-flex rounded-full bg-rp-surface/80 p-1 backdrop-blur-sm border border-rp-muted/20">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                viewMode === 'grid'
                                    ? "bg-rp-iris text-white shadow-md"
                                    : "text-rp-subtle hover:text-rp-text hover:bg-rp-overlay/50"
                            )}
                        >
                            <Grid3X3 className="h-4 w-4" />
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('feed')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                viewMode === 'feed'
                                    ? "bg-rp-iris text-white shadow-md"
                                    : "text-rp-subtle hover:text-rp-text hover:bg-rp-overlay/50"
                            )}
                        >
                            <Play className="h-4 w-4" />
                            Feed
                        </button>
                    </div>
                </div>
            )}

            {/* Content based on view mode */}
            {viewMode === 'feed' ? (
                <FeedLayout
                    moments={feedMoments}
                    onReact={handleReact}
                    onView={handleView}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    isLoading={isLoading}
                />
            ) : (
                <>
                    {/* Masonry Grid */}
                    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                        {moments.map((moment, index) => (
                            <div key={moment.id} className="mb-4 break-inside-avoid">
                                <MomentCard
                                    id={moment.id}
                                    imageUrl={moment.imageUrl || moment.thumbnailUrl || ''}
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
                                className="border-rp-muted/20 bg-rp-surface hover:bg-rp-overlay text-rp-text rounded-full px-8"
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
                                className="text-rp-iris hover:text-rp-iris/80 hover:bg-rp-iris/10 rounded-full"
                            >
                                <a href={viewAllHref}>View All Moments →</a>
                            </Button>
                        )}
                    </div>
                </>
            )}

            {/* Modal */}
            {selectedMoment && selectedMomentIndex !== null && viewMode === 'grid' && (
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
