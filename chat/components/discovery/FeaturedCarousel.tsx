"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import styles from "./Flip3DCarousel.module.css"
import { cn } from "@/lib/utils"

// Compatible interface for FeaturedCarousel
export interface FeaturedCharacter {
    id: string
    name: string
    imageUrl: string
    // Optional fields that might be passed or we map to defaults
    category?: string
    description?: string
    creativity?: number
    tags?: string[]
    followersCount?: number
    totalChats?: number
}

interface FeaturedCarouselProps {
    characters: FeaturedCharacter[]
    onCharacterClick?: (character: FeaturedCharacter) => void
}

// Helper to get random traits deterministically (fallback)
function getPlaceholderTraits(id: string) {
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    const traitsPool = ["⚡ Powerful", "🎭 Dramatic", "✨ Ancient", "🦭 Cute", "💪 Strong", "😊 Kind", "👑 Regal", "🐝 All-Knowing", "💋 Sassy", "👻 Ethereal", "💫 Protective", "🌙 Ancient", "⚡ Fast", "🎮 Gamer", "🔋 High Energy"]
    const traits = []
    for (let i = 0; i < 3; i++) {
        const idx = (hash + i * 7) % traitsPool.length
        traits.push(traitsPool[idx])
    }
    return traits
}

export function FeaturedCarousel({ characters, onCharacterClick }: FeaturedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    const personas = characters

    useEffect(() => {
        if (currentIndex >= personas.length && personas.length > 0) {
            setCurrentIndex(0)
        }
    }, [personas.length, currentIndex])

    const nextCard = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % personas.length)
    }, [personas.length])

    const prevCard = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + personas.length) % personas.length)
    }, [personas.length])

    // Keyboard nav
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextCard()
            if (e.key === "ArrowLeft") prevCard()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [nextCard, prevCard])

    if (!personas || personas.length === 0) return null

    return (
        <div className={styles.carouselContainer}>
            {/* Nav Buttons */}
            <button
                onClick={prevCard}
                className="absolute left-4 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/70"
                aria-label="Previous character"
            >
                <ChevronLeft className="h-5 w-5 text-white" />
            </button>

            <button
                onClick={nextCard}
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md transition-all hover:scale-110 hover:bg-black/70"
                aria-label="Next character"
            >
                <ChevronRight className="h-5 w-5 text-white" />
            </button>

            {/* Track - Static container for absolute cards */}
            <div className={styles.carouselTrack}>
                {personas.map((persona, index) => {
                    // Calculate circular offset
                    const count = personas.length
                    let offset = (index - currentIndex) % count

                    if (offset > count / 2) offset -= count
                    if (offset < -count / 2) offset += count

                    const distance = Math.abs(offset)
                    const isCenter = distance === 0

                    // TRAITS LOGIC: Use real tags if available, else generated
                    const displayTraits = (persona.tags && persona.tags.length > 0)
                        ? persona.tags.slice(0, 3)
                        : getPlaceholderTraits(persona.id)

                    // STATS LOGIC: Use real metrics
                    const chatVal = persona.totalChats || 0
                    const followVal = persona.followersCount || 0

                    const chatPercent = Math.min(100, Math.max(5, (chatVal / 200) * 100))
                    const followPercent = Math.min(100, Math.max(5, (followVal / 50) * 100))

                    const displayCreativity = persona.creativity || 50

                    const displayCategory = persona.category || "Featured Soul"
                    const displayDescription = persona.description || "A mysterious soul waiting to be discovered."

                    return (
                        <div
                            key={persona.id}
                            className={cn(
                                styles.cardFlipContainer,
                                isCenter ? styles.center : styles.side
                            )}
                            style={{
                                "--offset": offset,
                                "--distance": distance
                            } as React.CSSProperties}
                            onClick={() => {
                                if (offset !== 0) {
                                    setCurrentIndex(index)
                                }
                            }}
                        >
                            <div className={styles.cardFlipInner}>
                                {/* FRONT */}
                                <div className={styles.cardFront}>
                                    <Image
                                        src={persona.imageUrl || '/placeholder-persona.png'}
                                        alt={persona.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 220px, 260px"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-4 pt-10">
                                        <h3 className="font-outfit text-2xl font-extrabold uppercase tracking-wide text-white drop-shadow-md">
                                            {persona.name}
                                        </h3>
                                        <p className="text-xs italic text-white/70">
                                            {displayCategory}
                                        </p>
                                    </div>
                                </div>

                                {/* BACK (Info Only) */}
                                <div className={styles.cardBack}>
                                    <div className="relative h-full w-full bg-gradient-to-br from-amber-500 via-yellow-600 to-red-700 p-2.5">
                                        {/* Holo Foil Overlay */}
                                        <div className={styles.holoFoil} />

                                        {/* Card Content Inner */}
                                        <div className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-[12px] bg-[#0a0a0f]/95">

                                            {/* Header */}
                                            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-black/20">
                                                <div className="font-outfit text-lg font-extrabold uppercase tracking-wide text-white truncate max-w-[140px]">
                                                    {persona.name}
                                                </div>
                                                <div className="font-mono text-[10px] font-bold text-amber-500 flex flex-col items-end">
                                                    <span className="text-[8px] text-gray-500">CREATIVITY</span>
                                                    {Math.round(displayCreativity)}
                                                </div>
                                            </div>

                                            {/* Body - Full Height for Info */}
                                            <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">

                                                {/* Category/Type Pill */}
                                                <div className="flex">
                                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                                                        {displayCategory}
                                                    </span>
                                                </div>

                                                {/* Bio */}
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-[11px] leading-relaxed text-zinc-300 italic border-l-2 border-zinc-700 pl-3">
                                                        {displayDescription}
                                                    </div>
                                                </div>

                                                {/* Traits */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {displayTraits.map((t, i) => (
                                                        <span key={i} className="rounded border border-white/10 bg-white/10 px-2 py-1 text-[9px] uppercase tracking-wider text-white">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Divider */}
                                                <div className="h-px w-full bg-white/10" />

                                                {/* Stats Bars */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3 font-mono text-[9px]">
                                                        <span className="w-14 text-zinc-400 font-bold">CHATS</span>
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                                                            <div
                                                                className={styles.statBarFill}
                                                                style={{ width: `${chatPercent}%`, background: '#f59e0b' }}
                                                            />
                                                        </div>
                                                        <span className="w-8 text-right text-zinc-500">{chatVal}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 font-mono text-[9px]">
                                                        <span className="w-14 text-zinc-400 font-bold">FOLLOWS</span>
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                                                            <div
                                                                className={styles.statBarFill}
                                                                style={{ width: `${followPercent}%`, background: '#cc5500' }}
                                                            />
                                                        </div>
                                                        <span className="w-8 text-right text-zinc-500">{followVal}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div
                                                className="flex items-center justify-between border-t border-white/10 bg-[#111] px-4 py-2.5 cursor-pointer hover:bg-[#222] transition-colors group"
                                                onClick={() => onCharacterClick && onCharacterClick(persona)}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="font-outfit text-xs font-extrabold tracking-widest text-white group-hover:text-amber-500 transition-colors">CHAT NOW</div>
                                                </div>
                                                <div className="h-6 w-6 rounded bg-white p-0.5 group-hover:scale-110 transition-transform">
                                                    <svg viewBox="0 0 100 100" fill="none" className="h-full w-full">
                                                        <rect width="100" height="100" fill="black" />
                                                        <rect x="20" y="20" width="60" height="60" fill="white" />
                                                        <path d="M50 35 L70 65 L30 65 Z" fill="black" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
