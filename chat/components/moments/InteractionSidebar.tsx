"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, Bookmark, Share2, Plus, Settings, Sparkles, TrendingUp, Users, Bookmark as BookmarkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface InteractionSidebarProps {
    momentId: string
    creator: {
        id: string
        name: string
        avatarUrl: string | null
    }
    stats: {
        likes: number
        comments: number
        bookmarks: number
        shares: number
    }
    userState: {
        isLiked: boolean
        isBookmarked: boolean
    }
    onLike: () => void
    onBookmark: () => void
    onShare: () => void
    onCommentClick: () => void
    onProfileClick: () => void
    onChatClick?: () => void
    currentFilter?: string
    onFilterChange?: (filter: string) => void
}

export function InteractionSidebar({
    momentId,
    creator,
    stats,
    userState,
    onLike,
    onBookmark,
    onShare,
    onCommentClick,
    onProfileClick,
    onChatClick,
    currentFilter = 'for-you',
    onFilterChange
}: InteractionSidebarProps) {
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
        return count.toString()
    }

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Avatar Profile Link */}
            <div className="relative group cursor-pointer" onClick={onProfileClick}>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white p-[1px]">
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                            src={creator.avatarUrl || '/default-avatar.png'}
                            alt={creator.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
                {/* Follow Plus Badge (Mockup for now) */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rp-iris rounded-full p-0.5 border-2 border-rp-base">
                    <Plus className="w-3 h-3 text-white" />
                </div>
            </div>

            {/* Like */}
            <div className="flex flex-col items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "rounded-full w-12 h-12 bg-black/20 backdrop-blur-sm [&_svg]:size-7",
                        "hover:bg-black/40 transition-all active:scale-90",
                        userState.isLiked && "text-rp-love bg-rp-love/10"
                    )}
                    onClick={onLike}
                >
                    <Heart className={cn("fill-transparent transition-all", userState.isLiked && "fill-current")} />
                </Button>
                <span className="text-white text-xs font-semibold drop-shadow-md">
                    {formatCount(stats.likes)}
                </span>
            </div>

            {/* Settings / Filter Menu */}
            <div className="relative">
                <button
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="flex flex-col items-center gap-1 group"
                >
                    <div className="p-3 bg-white/10 rounded-full backdrop-blur-md group-active:scale-95 transition-all duration-200 border border-white/5 group-hover:bg-white/20">
                        <Settings className="w-7 h-7 text-white" />
                    </div>
                </button>

                {/* Filter Menu Popup */}
                {isFilterMenuOpen && onFilterChange && (
                    <div className="absolute right-full mr-3 bottom-0 bg-rp-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 min-w-[160px] animate-in fade-in slide-in-from-right-2 duration-200 z-50">
                        {[
                            { id: 'for-you', label: 'For You', icon: Sparkles },
                            { id: 'trending', label: 'Trending', icon: TrendingUp },
                            { id: 'following', label: 'Following', icon: Users },
                            { id: 'saved', label: 'Saved', icon: BookmarkIcon },
                        ].map((filter) => {
                            const Icon = filter.icon
                            const isActive = currentFilter === filter.id

                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        onFilterChange(filter.id)
                                        setIsFilterMenuOpen(false)
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left",
                                        isActive
                                            ? "bg-rp-iris text-white shadow-md"
                                            : "text-rp-text hover:bg-rp-overlay"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                                    <span className="text-sm font-medium">{filter.label}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Spinning Disc (Chat Button) */}
            <button
                onClick={onChatClick}
                className="mt-4 w-12 h-12 rounded-full bg-rp-surface border-4 border-black/50 overflow-hidden animate-[spin_5s_linear_infinite] hover:scale-110 hover:border-rp-iris/50 transition-all cursor-pointer group"
                aria-label="Open chat"
            >
                {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="chat" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-rp-iris to-rp-love" />
                )}
            </button>

        </div>
    )
}
