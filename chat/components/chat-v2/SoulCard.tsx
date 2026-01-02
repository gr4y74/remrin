/**
 * Soul Card - Individual Persona Display Card
 * 
 * Shows persona avatar, name, and mood with hover animations
 */

"use client"

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface SoulCardProps {
    id: string
    name: string
    imageUrl: string | null
    tagline?: string
    mood?: 'happy' | 'neutral' | 'sad' | 'excited'
    isSelected?: boolean
    onClick?: () => void
}

const MOOD_COLORS = {
    happy: 'from-rp-foam/30 to-rp-pine/30',
    neutral: 'from-rp-iris/30 to-rp-love/30',
    sad: 'from-rp-muted/30 to-rp-subtle/30',
    excited: 'from-rp-gold/30 to-rp-rose/30'
}

const MOOD_GLOW = {
    happy: 'shadow-[0_0_20px_rgba(156,207,216,0.4)]',
    neutral: 'shadow-[0_0_20px_rgba(196,167,231,0.4)]',
    sad: 'shadow-[0_0_20px_rgba(144,140,170,0.3)]',
    excited: 'shadow-[0_0_20px_rgba(235,188,186,0.5)]'
}

export function SoulCard({
    id,
    name,
    imageUrl,
    tagline,
    mood = 'neutral',
    isSelected = false,
    onClick
}: SoulCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all duration-300",
                "hover:scale-105 hover:-translate-y-1",
                isSelected
                    ? "border-rp-gold bg-gradient-to-br from-rp-gold/20 to-rp-rose/20 shadow-[0_0_20px_rgba(235,188,186,0.3)]"
                    : "border-rp-highlight-med bg-rp-surface hover:border-rp-highlight-high hover:bg-rp-overlay"
            )}
        >
            {/* Avatar with glow effect */}
            <div className={cn(
                "relative h-24 w-24 rounded-full overflow-hidden border-2 transition-all duration-300",
                isSelected
                    ? "border-rp-gold shadow-[0_0_25px_rgba(246,193,119,0.5)] scale-110"
                    : `border-rp-highlight-med group-hover:${MOOD_GLOW[mood]}`
            )}>
                {/* Mood gradient background */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-20",
                    MOOD_COLORS[mood]
                )} />

                {/* Avatar image */}
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-rp-overlay text-2xl font-bold text-rp-muted">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="text-center">
                <h3 className={cn(
                    "font-semibold transition-colors",
                    isSelected ? "text-rp-gold" : "text-rp-text"
                )}>
                    {name}
                </h3>
                {tagline && (
                    <p className="mt-1 text-xs text-rp-muted line-clamp-2">
                        {tagline}
                    </p>
                )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rp-gold shadow-lg">
                    <svg
                        className="h-4 w-4 text-rp-base"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}
        </button>
    )
}
