"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Star, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendingPersona {
    id: string
    name: string
    imageUrl: string | null
    description: string | null
    totalChats: number
    isFeatured: boolean
}

interface TrendingCarouselProps {
    personas: TrendingPersona[]
}

// Format large numbers
function formatCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
}

export function TrendingCarousel({ personas }: TrendingCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const updateScrollState = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
        updateScrollState()
    }, [personas])

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return
        const scrollAmount = direction === "left" ? -320 : 320
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }

    if (personas.length === 0) return null

    return (
        <div className="relative">
            {/* Section Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star className="size-5 text-rp-iris" />
                    <h2 className="text-2xl font-bold text-rp-iris">Featured Souls</h2>
                </div>

                {/* Arrow Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className="bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 min-h-[44px] min-w-[44px] rounded-full disabled:opacity-30"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className="bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 min-h-[44px] min-w-[44px] rounded-full disabled:opacity-30"
                    >
                        <ChevronRight className="size-5" />
                    </Button>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
            >
                {personas.map((persona) => (
                    <Link
                        key={persona.id}
                        href={`/character/${persona.id}`}
                        className="block shrink-0"
                    >
                        <div
                            className={cn(
                                "border-white/5 bg-rp-surface group relative w-72 overflow-hidden rounded-2xl border transition-all duration-300",
                                "hover:border-rp-gold/30 hover:shadow-rp-gold/20 hover:scale-[1.02] hover:shadow-lg"
                            )}
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden">
                                {persona.imageUrl ? (
                                    <Image
                                        src={persona.imageUrl}
                                        alt={persona.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="288px"
                                    />
                                ) : (
                                    <div className="from-rp-gold/50 to-rp-iris/50 flex size-full items-center justify-center bg-gradient-to-br">
                                        <span className="text-rp-text/50 text-5xl font-bold">
                                            {persona.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="from-rp-base/90 via-rp-base/30 absolute inset-0 bg-gradient-to-t to-transparent" />

                                {/* Featured Badge */}
                                {persona.isFeatured && (
                                    <Badge className="bg-rp-gold/90 text-rp-base absolute left-3 top-3 gap-1 rounded-full border-0 px-2 py-0.5 text-xs">
                                        <Star className="size-3 fill-current" />
                                        Featured
                                    </Badge>
                                )}

                                {/* Stats */}
                                <div className="absolute right-3 top-3">
                                    <Badge className="bg-rp-base/60 text-rp-text flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs backdrop-blur-sm">
                                        <MessageCircle className="size-3" />
                                        {formatCount(persona.totalChats)}
                                    </Badge>
                                </div>

                                {/* Bottom Content */}
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <h3 className="text-rp-text mb-1 text-lg font-bold drop-shadow-lg">
                                        {persona.name}
                                    </h3>
                                    {persona.description && (
                                        <p className="text-rp-subtle line-clamp-2 text-sm">
                                            {persona.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
