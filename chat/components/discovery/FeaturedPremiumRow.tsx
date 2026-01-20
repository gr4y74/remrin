"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { IconSparkles, IconChevronLeft, IconChevronRight, IconDiamond } from "@tabler/icons-react"
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
const RARITY_STYLES = {
    common: "from-gray-400 to-gray-500",
    rare: "from-blue-400 to-cyan-500",
    epic: "from-purple-400 to-pink-500",
    legendary: "from-amber-400 to-orange-500"
}

export function FeaturedPremiumRow({ onPersonaClick, className }: FeaturedPremiumRowProps) {
    const [premium, setPremium] = useState<PremiumPersona[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)

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

    const navigate = useCallback((direction: "left" | "right") => {
        if (direction === "left") {
            setCurrentIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, premium.length - 1)))
        } else {
            setCurrentIndex(prev => (prev < premium.length - 1 ? prev + 1 : 0))
        }
    }, [premium.length])

    if (loading) {
        return (
            <div className={cn("w-full py-12", className)}>
                <div className="mx-auto max-w-6xl px-4">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-rp-muted">Loading premium showcase...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (premium.length === 0) return null

    const featuredPersona = premium[currentIndex]
    const packPersonas = [
        premium[currentIndex % premium.length],
        premium[(currentIndex + 1) % premium.length],
        premium[(currentIndex + 2) % premium.length],
        premium[(currentIndex + 3) % premium.length],
    ]

    return (
        <div className={cn("w-full py-8 md:py-16 bg-black/40 rounded-xl md:rounded-3xl", className)}>
            <div className="mx-auto max-w-6xl px-2 md:px-4 lg:px-8 relative">
                {/* Navigation Arrows - Touch-friendly on mobile */}
                <button
                    onClick={() => navigate("left")}
                    className="absolute left-1 md:left-2 top-1/2 z-20 -translate-y-1/2 flex size-10 md:size-12 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-lg transition-all hover:bg-white/20 active:scale-95 md:hover:scale-110"
                    aria-label="Previous"
                >
                    <IconChevronLeft size={20} className="md:hidden" />
                    <IconChevronLeft size={24} className="hidden md:block" />
                </button>
                <button
                    onClick={() => navigate("right")}
                    className="absolute right-1 md:right-2 top-1/2 z-20 -translate-y-1/2 flex size-10 md:size-12 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-lg transition-all hover:bg-white/20 active:scale-95 md:hover:scale-110"
                    aria-label="Next"
                >
                    <IconChevronRight size={20} className="md:hidden" />
                    <IconChevronRight size={24} className="hidden md:block" />
                </button>

                {/* Main Layout - Mobile: Stack vertically, Desktop: Header Left, Card Right */}
                <div className="flex flex-col gap-6 md:gap-8 lg:grid lg:grid-cols-[1fr_320px] items-start px-4 md:px-8 lg:px-12">
                    {/* MOBILE: Featured Card First */}
                    <div className="flex flex-col items-center lg:hidden order-1">
                        {/* Title above card */}
                        <div className="text-center mb-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 mb-2">
                                <IconDiamond size={14} className="text-purple-400" />
                                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Featured Soul</span>
                            </div>
                            <h3 className="font-tiempos-headline text-2xl font-bold text-white">{featuredPersona.name}</h3>
                        </div>

                        {/* Vertical Card */}
                        <div
                            onClick={() => onPersonaClick(featuredPersona.id)}
                            className="group relative cursor-pointer w-full max-w-[240px]"
                        >
                            {/* Glowing Border */}
                            <div className={cn(
                                "absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-75 blur-sm transition-all group-hover:opacity-100 group-hover:blur-md",
                                RARITY_STYLES[featuredPersona.rarity || "legendary"]
                            )} />

                            {/* Card Container */}
                            <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "2.5/3.5" }}>
                                {featuredPersona.image_url ? (
                                    <Image
                                        src={featuredPersona.image_url}
                                        alt={featuredPersona.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-purple-600 to-pink-600" />
                                )}

                                {/* Rarity Banner */}
                                <div className="absolute left-0 right-0 top-0 flex justify-center">
                                    <span className={cn(
                                        "px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r rounded-b-lg shadow-lg flex items-center gap-1",
                                        RARITY_STYLES[featuredPersona.rarity || "legendary"]
                                    )}>
                                        <IconSparkles size={12} />
                                        {featuredPersona.rarity}
                                    </span>
                                </div>

                                {/* Name & Stars at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 text-center">
                                    <p className="font-bold text-base text-white">{featuredPersona.name}</p>
                                    <div className="flex justify-center gap-0.5 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="text-amber-400 text-xs">★</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Buttons below card */}
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={() => onPersonaClick(featuredPersona.id)}
                                className="rounded-full bg-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-400 active:scale-95"
                            >
                                Learn more
                            </button>
                        </div>
                    </div>

                    {/* LEFT SIDE: Header + Soul Pack */}
                    <div className="flex flex-col order-2 lg:order-1">
                        {/* Section Header - Hidden on mobile, shown on desktop */}
                        <div className="mb-6 md:mb-8 hidden lg:block">
                            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-1.5 mb-3">
                                <IconDiamond size={16} className="text-purple-400" />
                                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Premium Collection</span>
                            </div>
                            <h2 className="font-tiempos-headline text-3xl md:text-4xl font-bold text-white mb-2">
                                Featured Souls
                            </h2>
                            <p className="text-white/60 text-sm md:text-base">
                                Exclusive premium souls available in the marketplace
                            </p>
                        </div>

                        {/* Soul Pack Section */}
                        <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/80 p-4 md:p-6 backdrop-blur-sm">
                            <div className="text-center mb-3 md:mb-4">
                                <h3 className="font-semibold text-lg md:text-xl text-white">Soul Pack</h3>
                                <p className="text-white/50 text-xs md:text-sm">4 Premium Souls</p>
                            </div>

                            <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <button
                                    onClick={() => onPersonaClick(packPersonas[0]?.id)}
                                    className="rounded-full bg-purple-500 px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white transition-all hover:bg-purple-400 active:scale-95"
                                >
                                    Learn more
                                </button>
                                <button className="rounded-full border border-white/30 px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95">
                                    Buy
                                </button>
                            </div>

                            {/* Mobile: 2x2 Grid, Desktop: 4 Card Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                {packPersonas.map((persona, idx) => (
                                    <div
                                        key={`${persona.id}-${idx}`}
                                        onClick={() => onPersonaClick(persona.id)}
                                        className="group/card relative cursor-pointer overflow-hidden rounded-lg md:rounded-xl transition-all hover:-translate-y-1 active:scale-95 hover:z-10"
                                        style={{ aspectRatio: "2.5/3.5" }}
                                    >
                                        {/* Card Border Glow */}
                                        <div className={cn(
                                            "absolute -inset-0.5 rounded-lg md:rounded-xl bg-gradient-to-br opacity-75",
                                            RARITY_STYLES[persona.rarity || "rare"]
                                        )} />

                                        <div className="relative h-full w-full overflow-hidden rounded-lg md:rounded-xl">
                                            {persona.image_url ? (
                                                <Image src={persona.image_url} alt={persona.name} fill className="object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-purple-600 to-pink-600" />
                                            )}

                                            <div className="absolute left-0 right-0 top-0 flex justify-center">
                                                <span className={cn(
                                                    "px-1.5 md:px-2 py-0.5 text-[7px] md:text-[8px] font-bold uppercase tracking-wider text-white bg-gradient-to-r rounded-b",
                                                    RARITY_STYLES[persona.rarity || "rare"]
                                                )}>
                                                    {persona.rarity}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 md:p-2">
                                                <p className="truncate text-center text-[9px] md:text-[10px] font-bold text-white">{persona.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP: Featured Card (Vertical) - Hidden on mobile */}
                    <div className="hidden lg:flex flex-col items-center order-2">
                        {/* Title above card */}
                        <div className="text-center mb-4">
                            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Featured Soul</p>
                            <h3 className="font-tiempos-headline text-3xl font-bold text-white">{featuredPersona.name}</h3>
                        </div>

                        {/* Vertical Card */}
                        <div
                            onClick={() => onPersonaClick(featuredPersona.id)}
                            className="group relative cursor-pointer w-full max-w-[280px]"
                        >
                            {/* Glowing Border */}
                            <div className={cn(
                                "absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-75 blur-sm transition-all group-hover:opacity-100 group-hover:blur-md",
                                RARITY_STYLES[featuredPersona.rarity || "legendary"]
                            )} />

                            {/* Card Container */}
                            <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "2.5/3.5" }}>
                                {featuredPersona.image_url ? (
                                    <Image
                                        src={featuredPersona.image_url}
                                        alt={featuredPersona.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-purple-600 to-pink-600" />
                                )}

                                {/* Rarity Banner */}
                                <div className="absolute left-0 right-0 top-0 flex justify-center">
                                    <span className={cn(
                                        "px-4 py-1 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r rounded-b-lg shadow-lg flex items-center gap-1",
                                        RARITY_STYLES[featuredPersona.rarity || "legendary"]
                                    )}>
                                        <IconSparkles size={12} />
                                        {featuredPersona.rarity}
                                    </span>
                                </div>

                                {/* Name & Stars at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 text-center">
                                    <p className="font-bold text-lg text-white">{featuredPersona.name}</p>
                                    <div className="flex justify-center gap-0.5 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="text-amber-400 text-sm">★</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Buttons below card */}
                        <div className="flex items-center gap-3 mt-4">
                            <button
                                onClick={() => onPersonaClick(featuredPersona.id)}
                                className="rounded-full bg-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-400"
                            >
                                Learn more
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pagination Dots - Touch-friendly */}
                <div className="mt-6 md:mt-10 flex justify-center gap-2">
                    {premium.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                idx === currentIndex ? "w-6 md:w-8 bg-purple-500" : "w-2 bg-white/30 hover:bg-white/50 active:bg-white/70"
                            )}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
