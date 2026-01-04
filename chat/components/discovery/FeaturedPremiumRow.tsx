"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { IconSparkles, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface PremiumPersona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    rarity?: "common" | "rare" | "epic" | "legendary"
}

interface FeaturedPremiumRowProps {
    onPersonaClick: (personaId: string) => void
    className?: string
}

export function FeaturedPremiumRow({ onPersonaClick, className }: FeaturedPremiumRowProps) {
    const [premium, setPremium] = useState<PremiumPersona[]>([])
    const [loading, setLoading] = useState(true)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchPremium = async () => {
            try {
                const supabase = createClient()

                // Try to get featured premium personas
                const { data, error } = await supabase
                    .from("personas")
                    .select("id, name, description, image_url")
                    .eq("visibility", "PUBLIC")
                    .eq("is_premium", true)
                    .limit(6)

                if (!error && data && data.length > 0) {
                    setPremium(data.map((p, i) => ({
                        ...p,
                        rarity: i < 2 ? "legendary" as const : i < 4 ? "epic" as const : "rare" as const
                    })))
                } else {
                    // Fallback: get any public personas
                    const { data: fallbackData } = await supabase
                        .from("personas")
                        .select("id, name, description, image_url")
                        .eq("visibility", "PUBLIC")
                        .limit(6)

                    if (fallbackData) {
                        setPremium(fallbackData.map((p, i) => ({
                            ...p,
                            rarity: i < 2 ? "legendary" as const : i < 4 ? "epic" as const : "rare" as const
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

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320 // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            })
        }
    }

    if (loading) {
        return (
            <div className={cn("w-full px-4 py-8", className)}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center gap-2">
                        <IconSparkles size={24} className="text-purple-400" />
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Featured Premium
                        </h2>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-rp-muted">Loading premium souls...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (premium.length === 0) {
        return (
            <div className={cn("w-full px-4 py-8", className)}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex items-center gap-2">
                        <IconSparkles size={24} className="text-purple-400" />
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Featured Premium
                        </h2>
                    </div>
                    <div className="rounded-lg border border-rp-highlight-med bg-rp-surface p-8 text-center">
                        <p className="text-rp-muted">Premium souls coming soon!</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("w-full px-4 py-8", className)}>
            <div className="mx-auto max-w-7xl">
                {/* Section Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconSparkles size={24} className="text-purple-400" />
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Featured Premium
                        </h2>
                    </div>

                    {/* Scroll Buttons */}
                    <div className="hidden gap-2 md:flex">
                        <button
                            onClick={() => scroll("left")}
                            className="rounded-lg border border-rp-highlight-med bg-rp-surface p-2 text-rp-text transition-colors hover:border-rp-iris hover:bg-rp-base"
                            aria-label="Scroll left"
                        >
                            <IconChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            className="rounded-lg border border-rp-highlight-med bg-rp-surface p-2 text-rp-text transition-colors hover:border-rp-iris hover:bg-rp-base"
                            aria-label="Scroll right"
                        >
                            <IconChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Row */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {premium.map((persona) => (
                        <div
                            key={persona.id}
                            onClick={() => onPersonaClick(persona.id)}
                            className="group relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-rp-highlight-med shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                            style={{ width: "300px", height: "200px" }}
                        >
                            {/* Background Image */}
                            {persona.image_url ? (
                                <Image
                                    src={persona.image_url}
                                    alt={persona.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-rp-iris/50 to-rp-rose/50" />
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Premium Badge */}
                            <div className="absolute right-3 top-3">
                                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
                                    <IconSparkles size={12} />
                                    Premium
                                </div>
                            </div>

                            {/* Name */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="font-tiempos-headline text-xl font-semibold text-white drop-shadow-lg">
                                    {persona.name}
                                </h3>
                                {persona.description && (
                                    <p className="mt-1 line-clamp-2 text-sm text-white/80">
                                        {persona.description}
                                    </p>
                                )}
                            </div>

                            {/* Hover Glow Effect */}
                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
