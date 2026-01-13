"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import styles from "./Flip3DCarousel.module.css"
import { cn } from "@/lib/utils"

export interface FlipCarouselPersona {
    id: string
    name: string
    subtitle?: string
    imageUrl: string | null
    category: string | null
    description: string | null
    // Mapped from trending_score or provided directly
    creativity?: number
    // Placeholder traits if not real
    traits?: string[]
    // Placeholder stats
    stats?: { logic: number; empathy: number }
    setId?: string
}

interface Flip3DCarouselProps {
    personas: FlipCarouselPersona[]
}

// Helper to get random traits/stats deterministically based on ID or Name string hash
// so they don't jitter on re-render.
function getPlaceholderData(id: string) {
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)

    // Pseudo-random based on hash
    const traitsPool = ["⚡ Powerful", "🎭 Dramatic", "✨ Ancient", "🦭 Cute", "💪 Strong", "😊 Kind", "👑 Regal", "🐝 All-Knowing", "💋 Sassy", "👻 Ethereal", "💫 Protective", "🌙 Ancient", "⚡ Fast", "🎮 Gamer", "🔋 High Energy"]
    const traits = []
    for (let i = 0; i < 3; i++) {
        const idx = (hash + i * 7) % traitsPool.length
        traits.push(traitsPool[idx])
    }

    const logic = 40 + (hash % 60)
    const empathy = 40 + ((hash * 2) % 60)

    return { traits, stats: { logic, empathy } }
}

export function Flip3DCarousel({ personas }: Flip3DCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    // Ensure we don't go out of bounds if data changes
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
            {/* Background Effects */}
            <div className={styles.starsWrapper}>
                <div className={styles.stars}></div>
                <div className={styles.stars2}></div>
            </div>
            <div className={styles.fogWrapper}>
                <div className={`${styles.fogLayer} ${styles.fogPink}`}></div>
                <div className={`${styles.fogLayer} ${styles.fogBlue}`}></div>
            </div>

            {/* Nav Buttons */}
            <button
                onClick={prevCard}
                className="absolute left-4 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20"
                aria-label="Previous character"
            >
                <ChevronLeft className="h-6 w-6 text-white" />
            </button>

            <button
                onClick={nextCard}
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20"
                aria-label="Next character"
            >
                <ChevronRight className="h-6 w-6 text-white" />
            </button>

            {/* Track */}
            <div
                className={styles.carouselTrack}
                // We physically move the track to keep the current item centered? 
                // Alternatively, we render a window of items. 
                // The CSS demo didn't slide the track, it just changed classes. 
                // BUT, to loop infinitely visually usually requires a visible window. 
                // Given the CSS logic: 
                // .carousel-track { display: flex; gap: 40px; justify-content: center; transform: ... }
                // In React, simple class switching works if all items are rendered.
                // Let's render ALL items but hide those far away if list is huge?
                // For "Trending" usually < 20 items. Render all is fine.
                // BUT we need to ensure the CURRENT one is visually in the middle.
                // We can translate the track based on index.
                // Item width ~340px + 40px gap = 380px per item.
                // Center offset needs calculation.
                // Actually, the CSS demo didn't have track movement logic in CSS, it was static?
                // Wait, looking at demo HTML: `track.appendChild(cardContainer)` and `updateCardPositions`.
                // It just changes classes. It relies on Flexbox centering? 
                // If flexbox centers the content, and we have 5 items, the middle one is center.
                // But if we cycle, we want it to ROTATE.
                // Let's implement a simple transform-based sliding track to keep active centered.
                style={{
                    transform: `translateX(calc(0px - ${currentIndex * 380}px + 50% - 190px - 20px))`
                    // 380 = 340 width + 40 gap.
                    // But we want the currentIndex-th item to be at the center of the CONTAINER 
                    // which is width=100%.
                    // Actually, a simpler way for 3D Carousel is to just render a window around the index 
                    // or translate the whole track.
                    // Let's try centering the track on the active index:
                    // TranslateX = (ContainerWidth/2) - (ItemWidth/2) - (Index * (ItemWidth + Gap))
                    // Since ContainerWidth is dynamic 100%, we might need a wrapper.
                    // Or simpler: Just render the items and use the `order` property? No, animation is key.
                    // Let's stick to the transform approach.
                    // Assuming track is centered initially at 0.
                    // To center item `i`, we move left by `i * (340 + 40)`.
                    // And add half visual viewport width?
                    // Let's just use a simpler heuristic:
                    // We render the list. We want item `currentIndex` to be in the center.
                }}
            >
                {/* 
                  Actually, the calculation above in style is tricky with 100% width.
                  Alternative: Force the track to be wide and centered.
                  Or better: Just re-order the array?
                  No, animations break.
                  
                  Let's try a different layout approach:
                  Absolute positioning for a "deck" style or the same Flex row with Translate.
                  
                  Let's use the transform calculation:
                  `translateX( calc(50vw - 190px - ${currentIndex * 380}px) )` 
                  (assuming container is full width, which it might not be. 50% is safer).
               */}
                <div style={{
                    display: 'flex',
                    gap: '40px',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `translateX(calc(50% - 170px - ${currentIndex * 380}px))`
                    // 170 is half of card width (340/2). 
                    // So we start at 50% (center of container), move back half card, move back N cards.
                }}>
                    {personas.map((persona, index) => {
                        const isCenter = index === currentIndex
                        const isSide = !isCenter
                        const dist = Math.abs(index - currentIndex)
                        // Optimization: Don't render if too far? 
                        // Keep DOM light.
                        // if (dist > 2) return null // might break flex layout spacing. Use visibility:hidden instead?

                        // We need placeholder data if missing
                        const { traits, stats } = getPlaceholderData(persona.id)
                        const displayTraits = persona.traits || traits
                        const displayStats = persona.stats || stats
                        const displayCreativity = persona.creativity || (displayStats.logic + displayStats.empathy) / 2

                        return (
                            <div
                                key={persona.id}
                                className={cn(
                                    styles.cardFlipContainer,
                                    isCenter ? styles.center : styles.side
                                )}
                                onClick={() => {
                                    // Click side card to navigate to it
                                    if (!isCenter) setCurrentIndex(index)
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
                                            sizes="(max-width: 768px) 100vw, 340px"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-6 pt-12">
                                            <h3 className="font-outfit text-3xl font-extrabold uppercase tracking-wide text-white drop-shadow-md">
                                                {persona.name}
                                            </h3>
                                            <p className="text-sm italic text-white/70">
                                                {persona.subtitle || persona.category}
                                            </p>
                                        </div>
                                    </div>

                                    {/* BACK (Trading Style) */}
                                    <div className={styles.cardBack}>
                                        <div className="relative h-full w-full bg-gradient-to-br from-amber-500 via-yellow-600 to-red-700 p-3">
                                            {/* Holo Foil Overlay */}
                                            <div className={styles.holoFoil} />

                                            {/* Card Content Inner */}
                                            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-[#0a0a0f]/95">

                                                {/* Header */}
                                                <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
                                                    <div className="font-outfit text-lg font-extrabold uppercase tracking-wide text-white">
                                                        {persona.name}
                                                    </div>
                                                    <div className="font-mono text-xs font-bold text-amber-500">
                                                        <span className="mr-1 text-[10px] text-gray-500">CREATIVITY</span>
                                                        {Math.round(displayCreativity)}
                                                    </div>
                                                </div>

                                                {/* Art Box */}
                                                <div className="relative h-48 w-full border-b-4 border-amber-500 bg-black">
                                                    <Image
                                                        src={persona.imageUrl || '/placeholder-persona.png'}
                                                        alt={persona.name}
                                                        fill
                                                        className="object-cover object-top"
                                                        sizes="320px"
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent px-3.5 pb-1.5 pt-5 text-xs italic text-white/80">
                                                        {persona.category || "Unknown Entity"}
                                                    </div>
                                                </div>

                                                {/* Body */}
                                                <div className="flex flex-1 flex-col gap-3 p-3.5">
                                                    {/* Traits */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {displayTraits.map((t, i) => (
                                                            <span key={i} className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Bio */}
                                                    <div className="border-l-2 border-zinc-800 pl-2 text-xs italic leading-relaxed text-zinc-300">
                                                        {persona.description ? (
                                                            <span className="line-clamp-3">{persona.description}</span>
                                                        ) : "No bio available."}
                                                    </div>

                                                    {/* Stats Bars */}
                                                    <div className="mt-auto flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2.5 font-mono text-[10px]">
                                                            <span className="w-12 text-zinc-500">LOGIC</span>
                                                            <div className="h-1 flex-1 overflow-hidden rounded bg-zinc-800">
                                                                <div
                                                                    className={styles.statBarFill}
                                                                    style={{ width: `${displayStats.logic}%`, background: '#f59e0b' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 font-mono text-[10px]">
                                                            <span className="w-12 text-zinc-500">EMPATHY</span>
                                                            <div className="h-1 flex-1 overflow-hidden rounded bg-zinc-800">
                                                                <div
                                                                    className={styles.statBarFill}
                                                                    style={{ width: `${displayStats.empathy}%`, background: '#f59e0b' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between border-t border-white/10 bg-[#111] px-3.5 py-2">
                                                    <div className="flex flex-col items-center">
                                                        <div className="font-outfit text-sm font-extrabold tracking-widest text-white">REMRIN</div>
                                                        <div className="font-mono text-[8px] text-zinc-500 tracking-wider">
                                                            {persona.setId || "#001-BETA"} • 2026
                                                        </div>
                                                    </div>
                                                    {/* QR Chip graphic */}
                                                    <div className="h-10 w-10 rounded bg-white p-0.5">
                                                        <svg viewBox="0 0 100 100" fill="none" className="h-full w-full">
                                                            <rect width="100" height="100" fill="white" />
                                                            <rect x="15" y="15" width="25" height="25" fill="black" />
                                                            <rect x="60" y="15" width="25" height="25" fill="black" />
                                                            <rect x="15" y="60" width="25" height="25" fill="black" />
                                                            <rect x="50" y="50" width="20" height="20" fill="black" />
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
        </div>
    )
}
