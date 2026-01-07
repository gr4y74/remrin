"use client"

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MomentWithPersona } from '@/types/moments'
import { ReactionBar } from './ReactionBar'
import { InteractionSidebar } from './InteractionSidebar'
import { CommentsDrawer } from './CommentsDrawer'
import { Volume2, VolumeX, Play, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface VideoMomentCardProps {
    moment: MomentWithPersona
    isActive: boolean
    onReact: (momentId: string, emoji: string, isAdding: boolean) => void
    onView: (momentId: string) => void
    currentUserProfile?: { id: string, username: string, avatar_url: string | null } | null
    isUIVisible?: boolean
    currentFilter?: string
    onFilterChange?: (filter: string) => void
}

export function VideoMomentCard({
    moment,
    isActive,
    onReact,
    onView,
    currentUserProfile,
    isUIVisible = true,
    currentFilter,
    onFilterChange
}: VideoMomentCardProps) {
    const router = useRouter()
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true) // Start muted for autoplay policies
    const [hasViewed, setHasViewed] = useState(false)

    // Interaction State
    const [isCommentsOpen, setIsCommentsOpen] = useState(false)
    const [likesCount, setLikesCount] = useState(moment.reactions_summary?.['❤️'] || 0)
    const [commentsCount, setCommentsCount] = useState(moment.comments_count || 0)
    const [bookmarksCount, setBookmarksCount] = useState(moment.bookmarks_count || 0)
    const [sharesCount, setSharesCount] = useState(moment.shares_count || 0)

    const [isLiked, setIsLiked] = useState(moment.userReactions?.includes('❤️') || false)
    const [isBookmarked, setIsBookmarked] = useState(false) // Ideally passed from prop

    // Check initial bookmark status
    useEffect(() => {
        const checkBookmark = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('moment_bookmarks')
                    .select('moment_id')
                    .eq('user_id', user.id)
                    .eq('moment_id', moment.id)
                    .single()
                if (data) setIsBookmarked(true)
            }
        }
        if (isActive) checkBookmark()
    }, [isActive, moment.id])

    // Update local state if props change (re-hydration)
    useEffect(() => {
        setLikesCount(moment.reactions_summary?.['❤️'] || 0)
        setIsLiked(moment.userReactions?.includes('❤️') || false)
        setCommentsCount(moment.comments_count || 0)
        setBookmarksCount(moment.bookmarks_count || 0)
        setSharesCount(moment.shares_count || 0)
    }, [moment])

    // Handle play/pause
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (isActive) {
            video.play().catch(() => {
                // Autoplay failed, likely interaction needed
                setIsPlaying(false)
            })
            setIsPlaying(true)

            if (!hasViewed) {
                const timer = setTimeout(() => {
                    onView(moment.id)
                    setHasViewed(true)
                }, 3000)
                return () => clearTimeout(timer)
            }
        } else {
            video.pause()
            setIsPlaying(false)
        }
    }, [isActive, moment.id, onView, hasViewed])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.pause()
            setIsPlaying(false)
        } else {
            video.play().catch(console.error)
            setIsPlaying(true)
        }
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        const video = videoRef.current
        if (!video) return
        video.muted = !isMuted
        setIsMuted(!isMuted)
    }

    // Interaction Handlers
    const handleLike = () => {
        // Optimistic update
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)

        // Trigger generic react
        onReact(moment.id, '❤️', newIsLiked)
    }

    const handleBookmark = async () => {
        const newIsBookmarked = !isBookmarked
        setIsBookmarked(newIsBookmarked)
        setBookmarksCount(prev => newIsBookmarked ? prev + 1 : prev - 1)

        try {
            await fetch(`/api/moments/${moment.id}/bookmark`, { method: 'POST' })
        } catch (e) {
            console.error(e)
            // Revert on error
            setIsBookmarked(!newIsBookmarked)
            setBookmarksCount(prev => !newIsBookmarked ? prev + 1 : prev - 1)
        }
    }

    const handleShare = async () => {
        setSharesCount(prev => prev + 1)
        // Call API to track
        fetch(`/api/moments/${moment.id}/share`, {
            method: 'POST',
            body: JSON.stringify({ platform: 'web_share' })
        }).catch(console.error)

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Moment by ${moment.persona.name}`,
                    text: moment.caption || 'Check this out!',
                    url: window.location.href
                })
            } catch (e) { /* Cancelled */ }
        } else {
            navigator.clipboard.writeText(window.location.href)
            // Could show toast
        }
    }

    const formatViews = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
        return count.toString()
    }

    return (
        <div className="flex flex-row h-full w-auto items-end sm:items-center gap-4">
            {/* Video Area (Fixed Aspect Ratio 9:16) */}
            <div className="relative h-full aspect-[9/16] bg-black rounded-xl overflow-hidden flex items-center justify-center group shadow-2xl ring-1 ring-white/10">
                {/* Video/Image */}
                {moment.media_type === 'video' && moment.video_url ? (
                    <video
                        ref={videoRef}
                        src={moment.video_url}
                        poster={moment.thumbnail_url || undefined}
                        className="h-full w-full object-cover"
                        loop
                        muted={isMuted}
                        playsInline
                        onClick={togglePlay}
                    />
                ) : (
                    <div className="h-full w-full relative">
                        <Image
                            src={moment.image_url || '/placeholder-moment.jpg'}
                            alt={moment.caption || 'Moment'}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

                {/* Play/Pause Indicator */}
                {moment.media_type === 'video' && !isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="bg-black/40 rounded-full p-6 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                            <Play className="h-12 w-12 text-white fill-white ml-1" />
                        </div>
                    </div>
                )}

                {/* Top Controls (Mute/View) */}
                <div className="absolute top-4 right-4 z-20">
                    {moment.media_type === 'video' && (
                        <button
                            onClick={toggleMute}
                            className="bg-black/30 rounded-full p-2 backdrop-blur-md hover:bg-black/50 transition-colors"
                        >
                            {isMuted ? (
                                <VolumeX className="h-5 w-5 text-white" />
                            ) : (
                                <Volume2 className="h-5 w-5 text-white" />
                            )}
                        </button>
                    )}
                </div>

                <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1.5 backdrop-blur-md">
                    <Eye className="h-4 w-4 text-white/90" />
                    <span className="text-white/90 text-sm font-medium">
                        {formatViews(moment.view_count)}
                    </span>
                </div>

                {/* Bottom Content (Caption & Persona) - Inside Video */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12">
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity w-fit" onClick={() => router.push(`/character/${moment.persona.id}`)}>
                        <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/20">
                            <Image
                                src={moment.persona.image_url || '/default-avatar.png'}
                                alt={moment.persona.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h3 className="text-white font-bold text-lg shadow-black drop-shadow-md hover:underline decoration-white/50 underline-offset-4">
                            @{moment.persona.name}
                        </h3>
                    </div>

                    {moment.caption && (
                        <div className="text-white/95 text-sm md:text-base leading-relaxed drop-shadow-md line-clamp-3">
                            {moment.caption.split(' ').map((word, i) =>
                                word.startsWith('#') ? <span key={i} className="font-bold text-white">{word} </span> : word + ' '
                            )}
                        </div>
                    )}

                    {/* Audio track info */}
                    <div className="flex items-center gap-2 text-white/80 text-xs opacity-80 mb-2">
                        <Volume2 className="w-3 h-3" />
                        <span className="font-medium truncate">original sound - {moment.persona.name}</span>
                    </div>
                </div>
            </div>

            {/* Sidebar Area (Outside Video) */}
            <div className={cn(
                "flex flex-col gap-6 pb-4 shrink-0 z-30 transition-opacity duration-300",
                isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <InteractionSidebar
                    momentId={moment.id}
                    creator={{
                        id: moment.persona.id,
                        name: moment.persona.name,
                        avatarUrl: moment.persona.image_url
                    }}
                    stats={{
                        likes: likesCount,
                        comments: commentsCount,
                        bookmarks: bookmarksCount,
                        shares: sharesCount
                    }}
                    userState={{
                        isLiked,
                        isBookmarked
                    }}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    onCommentClick={() => setIsCommentsOpen(true)}
                    onProfileClick={() => router.push(`/character/${moment.persona.id}`)}
                    currentFilter={currentFilter}
                    onFilterChange={onFilterChange}
                />
            </div>

            {/* Components */}
            <CommentsDrawer
                momentId={moment.id}
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                onCommentCountUpdate={(count) => setCommentsCount(count)}
                currentUserProfile={currentUserProfile}
            />
        </div>
    )
}
