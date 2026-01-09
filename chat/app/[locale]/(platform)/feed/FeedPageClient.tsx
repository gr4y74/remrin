"use client"

import { useState, useEffect } from 'react'
import { FeedLayout } from '@/components/moments/FeedLayout'
import { MomentWithPersona } from '@/types/moments'
import { Button } from '@/components/ui/button'
import { TrendingUp, Sparkles, Users, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAutoHide } from '@/hooks/useAutoHide'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from "@supabase/supabase-js"
import { UploadMomentModal } from '@/components/moments/UploadMomentModal'

interface FeedPageClientProps {
    initialMoments: MomentWithPersona[]
    initialFilter: string
    hasMore: boolean
    user?: User | null
}

export function FeedPageClient({
    initialMoments,
    initialFilter,
    hasMore: initialHasMore,
    user
}: FeedPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [moments, setMoments] = useState(initialMoments)
    const [filter, setFilter] = useState(initialFilter)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [selectedPersona, setSelectedPersona] = useState<{ id: string, name: string } | null>(null)
    const [currentUserProfile, setCurrentUserProfile] = useState<{ id: string, username: string, avatar_url: string | null } | null>(null)

    // Auto-hide header in feed mode
    const { isVisible: isHeaderVisible } = useAutoHide({ timeout: 3000, enabled: true })

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .eq('user_id', user.id)
                .single()
            if (data) setCurrentUserProfile(data)
        }
        fetchProfile()
    }, [user])

    // Sync state with server props when they change (e.g. filter navigation)
    useEffect(() => {
        setMoments(initialMoments)
        setFilter(initialFilter)
        setHasMore(initialHasMore)
        setIsLoading(false) // Reset loading when new data arrives
    }, [initialMoments, initialFilter, initialHasMore])

    const handleFilterChange = (newFilter: string) => {
        // Optimistic update
        setFilter(newFilter)
        setIsLoading(true) // Show loading while server re-renders
        const params = new URLSearchParams(searchParams)
        params.set('filter', newFilter)
        router.push(`/feed?${params.toString()}`)
        // Note: verify if router.push triggers component update. If not, we might need manual fetch, 
        // but typically it does. We'll rely on the useEffect above to reset loading/data.
        // Actually, router.push might not trigger full reload. 
        // A safer bet is to ALSO trigger a fetch or rely on key change. 
        // But since we have loadMore logic, let's just reset logic.
        // If router.push re-runs server component, new props arrive, useEffect fires.
    }


    const handleReact = async (momentId: string, emoji: string, isAdding: boolean) => {
        try {
            const response = await fetch('/api/moments/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    momentId,
                    emoji,
                    action: isAdding ? 'add' : 'remove'
                })
            })

            if (!response.ok) throw new Error('Failed to react')
            const { reactions } = await response.json()

            // Update local state
            setMoments(prev => prev.map(m => {
                if (m.id === momentId) {
                    const newUserReactions = isAdding
                        ? [...(m.userReactions || []), emoji]
                        : (m.userReactions || []).filter(e => e !== emoji)

                    return {
                        ...m,
                        reactions_summary: reactions,
                        userReactions: newUserReactions
                    }
                }
                return m
            }))
        } catch (error) {
            console.error('React error:', error)
        }
    }

    const handleView = async (momentId: string) => {
        try {
            await fetch('/api/moments/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ momentId })
            })
        } catch (error) {
            console.error('View tracking error:', error)
        }
    }

    const loadMore = async () => {
        if (isLoading || !hasMore) return
        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/moments/feed?filter=${filter}&offset=${moments.length}&limit=12`
            )
            const { moments: newMoments, hasMore: moreAvailable } = await response.json()
            setMoments(prev => [...prev, ...newMoments])
            setHasMore(moreAvailable)
        } catch (error) {
            console.error('Load more error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Convert MomentWithPersona to MomentData format for MomentsGallery
    const galleryMoments = moments.map(m => ({
        id: m.id,
        imageUrl: m.image_url || m.thumbnail_url || '',
        caption: m.caption,
        likesCount: m.likes_count,
        isLiked: false, // Not using likes in new system
        createdAt: m.created_at,
        isPinned: m.is_pinned,
        persona: {
            id: m.persona.id,
            name: m.persona.name,
            imageUrl: m.persona.image_url
        }
    }))

    return (
        <div className="bg-rp-base min-h-screen">
            {/* Header */}
            <div className={cn(
                "sticky top-0 z-10 bg-rp-base/80 backdrop-blur-sm transition-transform duration-300",
                !isHeaderVisible && "-translate-y-full"
            )}>
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex items-center justify-center gap-3">
                        {/* Title - Centered */}
                        <h1 className="font-tiempos-headline text-3xl font-bold text-rp-text">
                            Soul Feed
                        </h1>

                        {/* Create Button - Icon Only */}
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-rp-iris hover:bg-rp-love text-white rounded-full p-2 transition-all shadow-lg hover:shadow-xl hover:scale-110"
                            aria-label="Create moment"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <FeedLayout
                moments={moments}
                onReact={handleReact}
                onView={handleView}
                onLoadMore={loadMore}
                hasMore={hasMore}
                currentUserProfile={currentUserProfile}
                currentFilter={filter}
                onFilterChange={handleFilterChange}
            />

            {/* Upload Modal */}
            {selectedPersona && (
                <UploadMomentModal
                    isOpen={isUploadOpen}
                    onClose={() => {
                        setIsUploadOpen(false)
                        setSelectedPersona(null)
                    }}
                    personaId={selectedPersona.id}
                    personaName={selectedPersona.name}
                    onSuccess={() => {
                        // Refresh feed to show new moment
                        router.refresh()
                        setIsUploadOpen(false)
                        setSelectedPersona(null)
                    }}
                />
            )}
        </div>
    )
}

function CreateMomentButton({
    onSelectPersona,
    user
}: {
    onSelectPersona: (persona: { id: string, name: string }) => void
    user?: User | null
}) {
    const router = useRouter()
    const [personas, setPersonas] = useState<{ id: string, name: string, image_url: string | null }[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchPersonas = async () => {
            if (!user) {
                setIsLoading(false)
                return
            }

            const supabase = createClient()
            const { data } = await supabase
                .from('personas')
                .select('id, name, image_url')
                .eq('owner_id', user.id)

            if (data) setPersonas(data)
            setIsLoading(false)
        }
        fetchPersonas()
    }, [user])

    if (isLoading) return null

    // If no personas, show button but redirect to studio
    if (personas.length === 0) {
        return (
            <Button
                size="sm"
                className="bg-gradient-to-r from-rp-iris to-rp-love text-white border-0"
                onClick={() => {
                    // Import toast from sonner if needed, or just redirect
                    router.push('/studio')
                }}
            >
                <Plus className="h-4 w-4 mr-1" />
                Create
            </Button>
        )
    }

    if (personas.length === 1) {
        return (
            <Button
                size="sm"
                className="bg-gradient-to-r from-rp-iris to-rp-love text-white border-0"
                onClick={() => onSelectPersona(personas[0])}
            >
                <Plus className="h-4 w-4 mr-1" />
                Create
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    className="bg-gradient-to-r from-rp-iris to-rp-love text-white border-0"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Create
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] bg-rp-surface border-rp-muted/20">
                {personas.map(persona => (
                    <DropdownMenuItem
                        key={persona.id}
                        onClick={() => onSelectPersona(persona)}
                        className="cursor-pointer hover:bg-rp-overlay focus:bg-rp-overlay"
                    >
                        <span className="truncate">{persona.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
