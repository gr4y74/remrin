"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface ReactionBarProps {
    momentId: string
    reactions: Record<string, number>
    userReactions: string[]
    onReact: (emoji: string, isAdding: boolean) => void
    compact?: boolean
}

const AVAILABLE_REACTIONS = ['❤️', '🔥', '😂', '😍', '😮', '👏', '💜', '✨']

export function ReactionBar({
    momentId,
    reactions,
    userReactions,
    onReact,
    compact = false
}: ReactionBarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isAnimating, setIsAnimating] = useState<string | null>(null)

    const handleReact = (emoji: string) => {
        const hasReacted = userReactions.includes(emoji)

        // Trigger animation
        setIsAnimating(emoji)
        setTimeout(() => setIsAnimating(null), 300)

        onReact(emoji, !hasReacted)
        setIsOpen(false)
    }

    // Get top reactions to display
    const topReactions = Object.entries(reactions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, compact ? 3 : 5)

    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Existing reactions */}
            {topReactions.map(([emoji, count]) => {
                const hasReacted = userReactions.includes(emoji)
                return (
                    <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200",
                            "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                            hasReacted && "bg-rp-iris/30 ring-1 ring-rp-iris",
                            isAnimating === emoji && "scale-110"
                        )}
                    >
                        <span className={cn(
                            "text-base transition-transform",
                            isAnimating === emoji && "animate-bounce"
                        )}>
                            {emoji}
                        </span>
                        <span className="text-white text-xs font-medium">
                            {count}
                        </span>
                    </button>
                )
            })}

            {/* Add reaction button */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center justify-center rounded-full transition-all duration-200",
                            "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                            compact ? "h-8 w-8" : "h-9 w-9"
                        )}
                    >
                        <Plus className="h-4 w-4 text-white" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-2 bg-rp-surface border-rp-muted/20"
                    align="start"
                    side="top"
                >
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {AVAILABLE_REACTIONS.map((emoji) => {
                            const hasReacted = userReactions.includes(emoji)
                            return (
                                <button
                                    key={emoji}
                                    onClick={() => handleReact(emoji)}
                                    className={cn(
                                        "p-2 rounded-lg transition-all hover:scale-110 hover:bg-rp-overlay",
                                        hasReacted && "bg-rp-iris/20"
                                    )}
                                >
                                    <span className="text-xl">{emoji}</span>
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Total count indicator */}
            {!compact && totalReactions > 0 && topReactions.length < Object.keys(reactions).length && (
                <span className="text-white/60 text-xs">
                    +{totalReactions - topReactions.reduce((a, [, c]) => a + c, 0)} more
                </span>
            )}
        </div>
    )
}
