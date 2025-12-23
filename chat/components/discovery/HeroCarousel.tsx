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
    const trackRef = useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const autoPlayRef = useRef<NodeJS.Timeout>()

    const CARD_WIDTH = 400
    const CARD_GAP = 24
    const VISIBLE_CARDS = 3

    const goToSlide = useCallback((index: number) => {
        if (!trackRef.current) return

        const wrappedIndex = ((index % items.length) + items.length) % items.length
        setCurrentIndex(wrappedIndex)

        const offset = -(wrappedIndex * (CARD_WIDTH + CARD_GAP)) +
            (window.innerWidth / 2 - CARD_WIDTH / 2)

        gsap.to(trackRef.current, {
            x: offset,
            duration: 0.8,
            ease: "power3.out"
        })
    }, [items.length, CARD_WIDTH, CARD_GAP])

    const goNext = useCallback(() => {
        goToSlide(currentIndex + 1)
    }, [currentIndex, goToSlide])

    const goPrev = useCallback(() => {
        goToSlide(currentIndex - 1)
    }, [currentIndex, goToSlide])

    // Auto-play
    useEffect(() => {
        if (!autoPlay || isHovered || items.length <= 1) return

        autoPlayRef.current = setInterval(goNext, interval)

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current)
        }
    }, [autoPlay, isHovered, items.length, interval, goNext])

    // Initialize position
    useEffect(() => {
        goToSlide(0)
    }, [goToSlide])

    // Handle keyboard
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
            className={cn(
                "relative w-full overflow-hidden py-8",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-[#0a0a0f] z-10 pointer-events-none" />

            {/* Track */}
            <div
                ref={trackRef}
                className="flex gap-6 will-change-transform"
                style={{ paddingLeft: `calc(50vw - ${CARD_WIDTH / 2}px)` }}
            >
                {items.map((item, index) => {
                    const isActive = index === currentIndex

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "relative flex-shrink-0 transition-all duration-500 cursor-pointer",
                                isActive ? "scale-100 z-20" : "scale-90 opacity-60"
                            )}
                            style={{ width: CARD_WIDTH }}
                            onClick={() => onItemClick(item)}
                        >
                            {/* Card */}
                            <div className={cn(
                                "relative aspect-[16/9] rounded-2xl overflow-hidden",
                                "border border-white/10",
                                isActive && "shadow-2xl shadow-purple-500/20"
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
                                    <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold">
                                        <IconSparkles size={12} />
                                        Featured
                                    </div>
                                )}

                                {/* Rarity badge */}
                                {item.rarity && item.rarity !== "common" && (
                                    <div className={cn(
                                        "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase",
                                        item.rarity === "rare" && "bg-purple-500 text-white",
                                        item.rarity === "epic" && "bg-pink-500 text-white",
                                        item.rarity === "legendary" && "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                                    )}>
                                        {item.rarity}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        {item.name}
                                    </h3>
                                    {item.description && (
                                        <p className="text-sm text-white/70 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Active glow */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/50 pointer-events-none" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Navigation buttons */}
            <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Previous"
            >
                <IconChevronLeft size={24} />
            </button>
            <button
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Next"
            >
                <IconChevronRight size={24} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
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
