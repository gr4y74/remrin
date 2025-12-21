"use client"

import { cn } from "@/lib/utils"
import { IconBulb } from "@tabler/icons-react"
import { FC, useRef } from "react"

interface SuggestedRepliesProps {
    suggestions: string[]
    onSelect: (suggestion: string) => void
    className?: string
}

/**
 * SuggestedReplies - Horizontal scrollable row of suggested prompts
 * Features pill-shaped buttons with hover effects and lightbulb icon
 * Styled for dark theme compatibility
 */
export const SuggestedReplies: FC<SuggestedRepliesProps> = ({
    suggestions,
    onSelect,
    className
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    if (!suggestions.length) return null

    return (
        <div
            className={cn(
                "flex items-center gap-3 py-3 animate-fadeIn",
                className
            )}
        >
            {/* Lightbulb icon */}
            <div className="flex-shrink-0 text-muted-foreground">
                <IconBulb size={20} className="opacity-70" />
            </div>

            {/* Horizontal scrollable suggestions */}
            <div
                ref={scrollContainerRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                }}
            >
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(suggestion)}
                        className={cn(
                            // Pill-shaped button
                            "flex-shrink-0 px-4 py-2 rounded-full text-sm",
                            // Dark theme compatible styling
                            "bg-white/5 border border-white/10",
                            "text-foreground/80",
                            // Hover effects
                            "hover:bg-white/10 hover:border-white/20",
                            "hover:scale-[1.02] hover:shadow-lg",
                            // Smooth transitions
                            "transition-all duration-200 ease-out",
                            // Focus state
                            "focus:outline-none focus:ring-2 focus:ring-primary/50"
                        )}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    )
}
