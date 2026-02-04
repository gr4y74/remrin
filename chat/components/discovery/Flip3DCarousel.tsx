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

                                    {/* BACK (New Blurred Background Design) */}
                                    <div className={styles.cardBack}>
                                        {/* Blurred Background */}
                                        <div className="absolute inset-0 z-0">
                                            <div className="absolute inset-0">
                                                <Image
                                                    src={persona.imageUrl || '/placeholder-persona.png'}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                    sizes="320px"
                                                />
                                            </div>
                                            <div className="absolute inset-0 backdrop-blur-2xl bg-black/40" />
                                        </div>

                                        {/* Content with Glassmorphism */}
                                        <div className="relative z-10 flex h-full flex-col p-5 bg-black/20 backdrop-blur-sm">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="font-outfit text-2xl font-extrabold tracking-widest text-white drop-shadow-lg uppercase">
                                                    {persona.name}
                                                </div>
                                                <div className="font-mono text-xs font-bold text-amber-500 text-right">
                                                    <span className="block text-[8px] text-gray-500 tracking-wider">CREATIVITY</span>
                                                    {Math.round(displayCreativity)}
                                                </div>
                                            </div>

                                            {/* Featured Badge */}
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 backdrop-blur-md mb-4 text-[11px] font-bold tracking-wider text-amber-400 uppercase w-fit">
                                                ✨ Featured Soul
                                            </div>

                                            {/* Description */}
                                            <div className="text-[13px] italic leading-relaxed text-white/85 mb-5 drop-shadow-md">
                                                {persona.description || "A mysterious soul waiting to be discovered."}
                                            </div>

                                            {/* Traits */}
                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {displayTraits.map((trait, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-[10px] font-semibold text-white uppercase tracking-wide">
                                                        {trait}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex gap-4 mt-auto mb-4">
                                                <div className="flex flex-col">
                                                    <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Chats</div>
                                                    <div className="font-mono text-base font-bold text-white">{displayStats.logic * 4}</div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Follows</div>
                                                    <div className="font-mono text-base font-bold text-white">{displayStats.empathy * 2}</div>
                                                </div>
                                            </div>

                                            {/* Chat Now CTA */}
                                            <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-500/50 font-outfit text-sm font-extrabold tracking-widest text-white uppercase transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30">
                                                💬 Chat Now
                                            </button>
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
