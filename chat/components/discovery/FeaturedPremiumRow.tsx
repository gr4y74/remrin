"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import { IconSparkles, IconChevronLeft, IconChevronRight, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface PremiumPersona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    price?: number | null
    rarity?: "common" | "rare" | "epic" | "legendary"
}

interface FeaturedPremiumRowProps {
    onPersonaClick: (personaId: string) => void
    className?: string
}

// Rarity badge colors
const RARITY_COLORS = {
    common: "bg-gray-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-amber-500"
}

export function FeaturedPremiumRow({ onPersonaClick, className }: FeaturedPremiumRowProps) {
    const [premium, setPremium] = useState<PremiumPersona[]>([])
    const [loading, setLoading] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const trackRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchPremium = async () => {
            try {
                const supabase = createClient()

                const { data, error } = await supabase
                    .from("personas")
                    .select("id, name, description, image_url, price, rarity")
                    .eq("visibility", "PUBLIC")
                    .not("price", "is", null)
                    .gt("price", 0)
                    .order("price", { ascending: false })
                    .limit(12)

                if (!error && data && data.length > 0) {
                    setPremium(data.map((p) => ({
                        ...p,
                        rarity: (p.rarity as "common" | "rare" | "epic" | "legendary") || "common"
                    })))
                } else {
                    const { data: fallbackData } = await supabase
                        .from("personas")
                        .select("id, name, description, image_url, price, rarity")
                        .eq("visibility", "PUBLIC")
                        .limit(12)

                    if (fallbackData) {
                        setPremium(fallbackData.map((p) => ({
                            ...p,
                            rarity: (p.rarity as "common" | "rare" | "epic" | "legendary") || "common"
                        })))
                    }
                }
            } catch (error) {
                console.error("Error fetching premium personas:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchPremium()
    }, [])

    const handleScroll = (direction: "left" | "right") => {
        if (!trackRef.current) return
        const track = trackRef.current
        const cardWidth = track.querySelector(".product-card")?.clientWidth || 200
        const gap = 16
        const scrollAmount = cardWidth + gap

        // Pause animation temporarily
        track.style.animationPlayState = "paused"

        if (direction === "left") {
            track.scrollLeft -= scrollAmount
        } else {
            track.scrollLeft += scrollAmount
        }

        // Resume if not manually paused
        if (!isPaused) {
            setTimeout(() => {
                if (trackRef.current) {
                    trackRef.current.style.animationPlayState = "running"
                }
            }, 100)
        }
    }

    const togglePause = () => {
        setIsPaused(!isPaused)
        if (trackRef.current) {
            trackRef.current.style.animationPlayState = isPaused ? "running" : "paused"
        }
    }

    if (loading) {
        return (
            <div className={cn("w-full py-8", className)}>
                <div className="mx-auto max-w-[1400px] px-4">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-rp-muted animate-pulse">Loading premium collection...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (premium.length === 0) return null

    // Duplicate items for seamless infinite scroll
    const displayItems = [...premium, ...premium]

    return (
        <div className={cn("w-full py-8 md:py-12", className)}>
            <div className="mx-auto max-w-[1400px] px-4 md:px-6">
                {/* Header */}
                <div className="mb-6 md:mb-8 animate-fadeInUp">
                    <div className="inline-flex items-center gap-2 bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
                        <IconSparkles size={14} />
                        Premium Collection
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rp-text leading-tight mb-2">
                        Discover, collect, connect.
                        <br className="hidden sm:block" />
                        <span className="text-rp-subtle">All in one place.</span>
                    </h2>
                    <p className="text-rp-subtle text-sm md:text-base mb-4">
                        Exclusive premium souls available in the marketplace
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/marketplace"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rp-text text-rp-base font-semibold text-sm hover:bg-rp-text/90 transition-all hover:-translate-y-0.5"
                        >
                            Browse All
                        </Link>
                        <button className="text-purple-400 font-semibold text-sm hover:text-purple-300 transition-colors">
                            Learn more →
                        </button>
                    </div>
                </div>

                {/* Carousel */}
                <div className="relative">
                    {/* Track Container */}
                    <div className="overflow-hidden py-4 -my-4">
                        <div
                            ref={trackRef}
                            className={cn(
                                "flex gap-4 md:gap-6",
                                !isPaused && "animate-carousel"
                            )}
                            style={{
                                animationPlayState: isPaused ? "paused" : "running"
                            }}
                            onMouseEnter={() => {
                                if (trackRef.current && !isPaused) {
                                    trackRef.current.style.animationPlayState = "paused"
                                }
                            }}
                            onMouseLeave={() => {
                                if (trackRef.current && !isPaused) {
                                    trackRef.current.style.animationPlayState = "running"
                                }
                            }}
                        >
                            {displayItems.map((persona, idx) => (
                                <button
                                    key={`${persona.id}-${idx}`}
                                    onClick={() => onPersonaClick(persona.id)}
                                    className="product-card flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] group text-left"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-rp-surface shadow-md mb-3 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                                        {persona.image_url ? (
                                            <Image
                                                src={persona.image_url}
                                                alt={persona.name}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600" />
                                        )}

                                        {/* Rarity Badge */}
                                        {persona.rarity && persona.rarity !== "common" && (
                                            <span className={cn(
                                                "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white shadow-sm",
                                                RARITY_COLORS[persona.rarity]
                                            )}>
                                                {persona.rarity}
                                            </span>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                                            <span className="bg-white text-rp-base px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                View Details
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <h3 className="font-semibold text-rp-text text-sm leading-tight line-clamp-2 mb-0.5">
                                        {persona.name}
                                    </h3>
                                    {persona.description && (
                                        <p className="text-rp-subtle text-xs line-clamp-1">
                                            {persona.description}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-3 mt-6">
                    <button
                        onClick={() => handleScroll("left")}
                        className="w-10 h-10 rounded-full bg-rp-surface hover:bg-rp-overlay flex items-center justify-center text-rp-text transition-all hover:scale-105 shadow-sm"
                        aria-label="Previous"
                    >
                        <IconChevronLeft size={18} />
                    </button>
                    <button
                        onClick={togglePause}
                        className="w-12 h-12 rounded-full bg-rp-surface hover:bg-rp-overlay flex items-center justify-center text-rp-text transition-all hover:scale-105 shadow-sm"
                        aria-label={isPaused ? "Play" : "Pause"}
                    >
                        {isPaused ? <IconPlayerPlay size={20} /> : <IconPlayerPause size={20} />}
                    </button>
                    <button
                        onClick={() => handleScroll("right")}
                        className="w-10 h-10 rounded-full bg-rp-surface hover:bg-rp-overlay flex items-center justify-center text-rp-text transition-all hover:scale-105 shadow-sm"
                        aria-label="Next"
                    >
                        <IconChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* CSS for carousel animation */}
            <style jsx>{`
                @keyframes carousel {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-carousel {
                    animation: carousel 40s linear infinite;
                    will-change: transform;
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
