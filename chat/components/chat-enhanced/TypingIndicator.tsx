"use client"

import { cn } from "@/lib/utils"
import { FC } from "react"

interface TypingIndicatorProps {
    characterName?: string
    className?: string
}

/**
 * TypingIndicator - Talkie-style typing indicator
 * Shows three pulsing dots with optional character name
 * Features glassmorphism background matching message style
 */
export const TypingIndicator: FC<TypingIndicatorProps> = ({
    characterName,
    className
}) => {
    return (
        <div
            className={cn(
                // Glassmorphism styling
                "inline-flex items-center gap-3 rounded-2xl px-4 py-3",
                "border border-white/10 bg-white/5 backdrop-blur-md",
                "animate-fadeIn",
                className
            )}
        >
            {/* Three animated dots */}
            <div className="flex items-center gap-1">
                <span
                    className="size-2 animate-pulse-dot rounded-full bg-foreground/60"
                    style={{ animationDelay: "0ms" }}
                />
                <span
                    className="size-2 animate-pulse-dot rounded-full bg-foreground/60"
                    style={{ animationDelay: "160ms" }}
                />
                <span
                    className="size-2 animate-pulse-dot rounded-full bg-foreground/60"
                    style={{ animationDelay: "320ms" }}
                />
            </div>

            {/* Character name text */}
            {characterName && (
                <span className="text-muted-foreground text-sm">
                    {characterName} is typing...
                </span>
            )}
        </div>
    )
}
