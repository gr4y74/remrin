"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { gsap } from "gsap"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { IconChevronLeft, IconChevronRight, IconSparkles } from "@tabler/icons-react"

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

    const CARD_WIDTH = 380
    const CARD_SPACING = 0.1 // stagger spacing

    // Animate cards to position
    const animateToIndex = useCallback((index: number) => {
        const wrappedIndex = ((index % items.length) + items.length) % items.length
        setCurrentIndex(wrappedIndex)

        cardsRef.current.forEach((card, i) => {
            if (!card) return

            const distance = i - wrappedIndex
            const absDistance = Math.abs(distance)

            // Calculate position with curve effect
            const xOffset = distance * (CARD_WIDTH * 0.4)
            const zOffset = -absDistance * 100
            const scale = Math.max(0.6, 1 - absDistance * 0.15)
            const opacity = Math.max(0.3, 1 - absDistance * 0.3)
            const rotateY = distance * -5

            gsap.to(card, {
                x: xOffset,
                z: zOffset,
                scale: scale,
                opacity: opacity,
                rotateY: rotateY,
                duration: 0.8,
                ease: "power3.out"
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
                "relative w-full h-[280px] overflow-hidden",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ perspective: "1000px" }}
        >
            {/* Edge gradients */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

            {/* Cards container */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
            >
                {items.map((item, index) => {
                    const isActive = index === currentIndex

                    return (
                        <div
                            key={item.id}
                            ref={el => { cardsRef.current[index] = el }}
                            className={cn(
                                "absolute cursor-pointer transition-shadow duration-300",
                                isActive && "z-20"
                            )}
                            style={{
                                width: CARD_WIDTH,
                                transformStyle: "preserve-3d"
                            }}
                            onClick={() => isActive ? onItemClick(item) : animateToIndex(index)}
                        >
                            {/* Card */}
                            <div className={cn(
                                "relative aspect-[16/9] rounded-2xl overflow-hidden",
                                "border-2 transition-all duration-300",
                                isActive
                                    ? "border-purple-500/50 shadow-2xl shadow-purple-500/30"
                                    : "border-white/10"
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
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900" />
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                {/* Featured badge */}
                                {item.isFeatured && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold">
                                        <IconSparkles size={12} />
                                        Featured
                                    </div>
                                )}

                                {/* Rarity */}
                                {item.rarity && item.rarity !== "common" && (
                                    <div className={cn(
                                        "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                        item.rarity === "rare" && "bg-purple-500 text-white",
                                        item.rarity === "epic" && "bg-pink-500 text-white",
                                        item.rarity === "legendary" && "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                                    )}>
                                        {item.rarity}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-xl font-bold text-white mb-1 truncate">
                                        {item.name}
                                    </h3>
                                    {item.description && (
                                        <p className="text-xs text-white/60 line-clamp-1">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Active glow ring */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-400/50 ring-offset-2 ring-offset-transparent pointer-events-none" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Navigation buttons */}
            <button
                onClick={goPrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110"
                aria-label="Previous"
            >
                <IconChevronLeft size={20} />
            </button>
            <button
                onClick={goNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110"
                aria-label="Next"
            >
                <IconChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => animateToIndex(index)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            index === currentIndex
                                ? "w-6 bg-purple-500"
                                : "bg-white/30 hover:bg-white/50"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
