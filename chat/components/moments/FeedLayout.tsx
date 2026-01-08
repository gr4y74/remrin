"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { VideoMomentCard } from './VideoMomentCard'
import { ReactionBar } from './ReactionBar'
import { MomentWithPersona } from '@/types/moments'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { CollapsibleFilterMenu } from './CollapsibleFilterMenu'
import { useAutoHide } from '@/hooks/useAutoHide'

interface FeedMoment extends MomentWithPersona {
    userReactions?: string[]
}

interface FeedLayoutProps {
    moments: FeedMoment[]
    onReact: (momentId: string, emoji: string, isAdding: boolean) => Promise<void> | void
    onView: (momentId: string) => void
    onLoadMore?: () => void
    hasMore?: boolean
    isLoading?: boolean

    currentUserProfile?: { id: string, username: string, avatar_url: string | null } | null
    currentFilter: string
    onFilterChange: (filter: string) => void
}

export function FeedLayout({
    moments,
    onReact,
    onView,
    onLoadMore,
    hasMore,
    isLoading,
    currentUserProfile,
    currentFilter,
    onFilterChange
}: FeedLayoutProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const touchStartY = useRef<number | null>(null)

    // Auto-hide UI after 3 seconds of inactivity
    const { isVisible: isUIVisible } = useAutoHide({ timeout: 3000 })

    const currentMoment = moments[currentIndex]

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }, [currentIndex])

    const goToNext = useCallback(() => {
        if (currentIndex < moments.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else if (hasMore && onLoadMore && !isLoading) {
            onLoadMore()
        }
    }, [currentIndex, moments.length, hasMore, onLoadMore, isLoading])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
                e.preventDefault()
                goToPrevious()
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
                e.preventDefault()
                goToNext()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goToPrevious, goToNext])

    // Touch/swipe navigation
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleTouchStart = (e: TouchEvent) => {
            touchStartY.current = e.touches[0].clientY
        }

        const handleTouchEnd = (e: TouchEvent) => {
            if (touchStartY.current === null) return
            const touchEndY = e.changedTouches[0].clientY
            const diff = touchStartY.current - touchEndY

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToNext()
                } else {
                    goToPrevious()
                }
            }
            touchStartY.current = null
        }

        container.addEventListener('touchstart', handleTouchStart)
        container.addEventListener('touchend', handleTouchEnd)

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [goToPrevious, goToNext])

    // Mouse wheel navigation
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let wheelTimeout: NodeJS.Timeout | null = null
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            if (wheelTimeout) return

            wheelTimeout = setTimeout(() => {
                wheelTimeout = null
            }, 300)

            if (e.deltaY > 0) {
                goToNext()
            } else {
                goToPrevious()
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [goToPrevious, goToNext])

    // Handle react wrapper
    const handleReact = useCallback((momentId: string, emoji: string, isAdding: boolean) => {
        onReact(momentId, emoji, isAdding)
    }, [onReact])

    if (!currentMoment) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-rp-subtle text-xl font-medium">No moments to display</p>
                <p className="text-rp-muted mt-2">Check back later for new content</p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="relative h-[calc(100vh-120px)] flex items-center justify-center bg-rp-base overflow-hidden"
        >
            {/* Main Content Container */}
            <div className="flex items-center justify-center gap-8 max-w-7xl w-full px-4 h-full py-8">

                {/* Left Side Controls */}
                <div className={cn(
                    "hidden lg:flex items-center gap-4 shrink-0 transition-opacity duration-300",
                    isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    {/* Left Navigation Arrow */}
                    {currentIndex > 0 && (
                        <button
                            onClick={goToPrevious}
                            className={cn(
                                "rounded-full bg-rp-surface/80 p-3 backdrop-blur-md",
                                "hover:bg-rp-overlay transition-all duration-200 hover:scale-110",
                                "border border-rp-muted/20 shadow-lg"
                            )}
                            aria-label="Previous moment"
                        >
                            <ChevronLeft className="h-6 w-6 text-rp-text" />
                        </button>
                    )}
                </div>

                {/* Video Card - Centered */}
                <div className="flex flex-col items-center gap-4 h-full max-h-[85vh] justify-center">
                    {/* Video/Image Card */}
                    <div className="h-full w-auto relative flex items-center justify-center">
                        <VideoMomentCard
                            moment={currentMoment}
                            isActive={true}
                            onReact={handleReact}
                            onView={onView}
                            currentUserProfile={currentUserProfile}
                            isUIVisible={isUIVisible}
                            currentFilter={currentFilter}
                            onFilterChange={onFilterChange}
                        />
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-1.5">
                        {moments.slice(Math.max(0, currentIndex - 3), currentIndex).map((_, idx) => (
                            <button
                                key={`prev-${idx}`}
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 3) + idx)}
                                className="h-1.5 w-1.5 rounded-full bg-rp-muted/30 hover:bg-rp-muted/50 transition-colors"
                            />
                        ))}
                        <div className="h-2 w-8 rounded-full bg-rp-iris shadow-sm shadow-rp-iris/30" />
                        {moments.slice(currentIndex + 1, currentIndex + 4).map((_, idx) => (
                            <button
                                key={`next-${idx}`}
                                onClick={() => setCurrentIndex(currentIndex + 1 + idx)}
                                className="h-1.5 w-1.5 rounded-full bg-rp-muted/30 hover:bg-rp-muted/50 transition-colors"
                            />
                        ))}
                        {hasMore && currentIndex >= moments.length - 3 && (
                            <div className="h-1.5 w-1.5 rounded-full bg-rp-muted/20" />
                        )}
                    </div>

                    {/* Counter */}
                    <p className="text-sm text-rp-muted">
                        {currentIndex + 1} / {moments.length}{hasMore && '+'}
                    </p>
                </div>

                {/* Right Side Controls */}
                <div className={cn(
                    "hidden lg:flex items-center gap-4 shrink-0 transition-opacity duration-300",
                    isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    {/* Right Navigation Arrow */}
                    {(currentIndex < moments.length - 1 || hasMore) && (
                        <button
                            onClick={goToNext}
                            disabled={isLoading}
                            className={cn(
                                "rounded-full bg-rp-surface/80 p-3 backdrop-blur-md",
                                "hover:bg-rp-overlay transition-all duration-200 hover:scale-110",
                                "border border-rp-muted/20 shadow-lg",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label="Next moment"
                        >
                            <ChevronRight className="h-6 w-6 text-rp-text" />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Navigation - REMOVED */}


            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2 bg-rp-surface/80 backdrop-blur-md rounded-full px-4 py-2 border border-rp-muted/20">
                        <div className="h-4 w-4 border-2 border-rp-iris border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-rp-text">Loading more...</span>
                    </div>
                </div>
            )}

            {/* Swipe Hint - Mobile */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 md:hidden">
                <p className="text-xs text-rp-muted/60 animate-pulse">Swipe up for next</p>
            </div>
        </div>
    )
}
