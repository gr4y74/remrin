"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { gsap } from "gsap"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { IconSparkles } from "@tabler/icons-react"

interface CarouselItem {
    id: string
    name: string
    description?: string | null
    imageUrl?: string | null
    rarity?: "common" | "rare" | "epic" | "legendary"
    isFeatured?: boolean
}

interface HeroCarouselProps {
    items: CarouselItem[]
    onItemClick: (item: CarouselItem) => void
    autoPlay?: boolean
    interval?: number
    className?: string
}

export function HeroCarousel({
    items,
    onItemClick,
    autoPlay = true,
    interval = 5000,
    className
}: HeroCarouselProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLDivElement | null)[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const autoPlayRef = useRef<NodeJS.Timeout>()

    // Card dimensions - same aspect ratio as gallery cards (3:4)
    const CARD_WIDTH = 220
    const CARD_HEIGHT = 290
    const VISIBLE_CARDS = 5 // Always show 5 cards (2 on each side + 1 center)

    // Animate cards to position - centered layout
    const animateToIndex = useCallback((index: number) => {
        const wrappedIndex = ((index % items.length) + items.length) % items.length
        setCurrentIndex(wrappedIndex)

        cardsRef.current.forEach((card, i) => {
            if (!card) return

            // Calculate distance from center
            let distance = i - wrappedIndex

            // Handle wrapping for smooth infinite feel
            if (distance > items.length / 2) distance -= items.length
            if (distance < -items.length / 2) distance += items.length

            const absDistance = Math.abs(distance)

            // Position calculation - spread cards evenly from center
            const spacing = CARD_WIDTH * 0.75
            const xOffset = distance * spacing

            // Scale and opacity based on distance
            const scale = absDistance === 0 ? 1 : Math.max(0.7, 1 - absDistance * 0.12)
            const opacity = absDistance === 0 ? 1 : Math.max(0.3, 1 - absDistance * 0.25)
            const zIndex = 10 - absDistance

            // Slight rotation for depth
            const rotateY = distance * -8

            gsap.to(card, {
                x: xOffset,
                scale: scale,
                opacity: opacity,
                rotateY: rotateY,
                zIndex: zIndex,
                duration: 0.6,
                ease: "power2.out"
            })
        })
    }, [items.length])

    const goNext = useCallback(() => {
        animateToIndex(currentIndex + 1)
    }, [currentIndex, animateToIndex])

    const goPrev = useCallback(() => {
        animateToIndex(currentIndex - 1)
    }, [currentIndex, animateToIndex])

    // Auto-play
    useEffect(() => {
        if (!autoPlay || isHovered || items.length <= 1) return

        autoPlayRef.current = setInterval(goNext, interval)

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current)
        }
    }, [autoPlay, isHovered, items.length, interval, goNext])

    // Initialize
    useEffect(() => {
        animateToIndex(0)
    }, [animateToIndex])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goPrev()
            if (e.key === "ArrowRight") goNext()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [goNext, goPrev])

    if (items.length === 0) return null

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full py-8 overflow-hidden",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Edge gradients for fade effect */}
            <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-rp-base via-rp-base/80 to-transparent z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-rp-base via-rp-base/80 to-transparent z-20 pointer-events-none" />

            {/* Cards container - centered */}
            <div
                className="relative flex items-center justify-center mx-auto"
                style={{
                    height: CARD_HEIGHT + 40,
                    perspective: "1000px"
                }}
            >
                {items.map((item, index) => {
                    const isActive = index === currentIndex

                    return (
                        <div
                            key={item.id}
                            ref={el => { cardsRef.current[index] = el }}
                            className="absolute cursor-pointer"
                            style={{
                                width: CARD_WIDTH,
                                height: CARD_HEIGHT,
                                transformStyle: "preserve-3d"
                            }}
                            onClick={() => isActive ? onItemClick(item) : animateToIndex(index)}
                        >
                            {/* Card - same aspect ratio as gallery */}
                            <div className={cn(
                                "relative w-full h-full rounded-2xl overflow-hidden",
                                "border-2 transition-all duration-300",
                                isActive
                                    ? "border-rp-iris/60 shadow-2xl shadow-rp-iris/40"
                                    : "border-rp-highlight-low"
                            )}>
                                {/* Image */}
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        priority={index < 3}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-rp-iris/50 to-rp-rose/50 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-rp-text/30">
                                            {item.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-rp-base/90 via-rp-base/20 to-transparent" />

                                {/* Featured badge */}
                                {item.isFeatured && isActive && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-rp-gold to-rp-rose text-rp-base text-[10px] font-bold">
                                        <IconSparkles size={10} />
                                        Featured
                                    </div>
                                )}

                                {/* Rarity badge */}
                                {item.rarity && item.rarity !== "common" && (
                                    <div className={cn(
                                        "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                        item.rarity === "rare" && "bg-rp-iris text-rp-base",
                                        item.rarity === "epic" && "bg-rp-rose text-rp-base",
                                        item.rarity === "legendary" && "bg-gradient-to-r from-rp-gold to-rp-love text-rp-base"
                                    )}>
                                        {item.rarity}
                                    </div>
                                )}

                                {/* Content - at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-base font-bold text-rp-text truncate">
                                        {item.name}
                                    </h3>
                                    {item.description && (
                                        <p className="text-[10px] text-rp-subtle line-clamp-1 mt-0.5">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Active glow effect */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl ring-1 ring-rp-iris/30 pointer-events-none" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Navigation buttons - Prev/Next at bottom center */}
            <div className="flex items-center justify-center gap-4 mt-6 relative z-30">
                <button
                    onClick={goPrev}
                    className="px-6 py-2 rounded-full bg-transparent border border-rp-muted text-rp-subtle text-sm font-medium hover:bg-rp-overlay hover:border-rp-muted/40 transition-all"
                >
                    Prev
                </button>
                <button
                    onClick={goNext}
                    className="px-6 py-2 rounded-full bg-rp-surface border border-rp-muted text-rp-text text-sm font-medium hover:bg-rp-overlay hover:border-rp-muted/40 transition-all"
                >
                    Next
                </button>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-4 relative z-30">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => animateToIndex(index)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            index === currentIndex
                                ? "w-6 bg-rp-iris"
                                : "bg-rp-muted/20 hover:bg-rp-muted/40"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
