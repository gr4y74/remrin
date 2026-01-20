"use client"

import { useEffect, useState, useRef } from "react"
import { CharacterCard } from "@/components/discovery/CharacterCard"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimilarSoul {
    id: string
    name: string
    description: string | null
    image_url: string | null
    category: string | null
    totalChats: number
}

interface SimilarSoulsProps {
    personaId: string
}

export function SimilarSouls({ personaId }: SimilarSoulsProps) {
    const [souls, setSouls] = useState<SimilarSoul[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    useEffect(() => {
        const fetchSimilarSouls = async () => {
            try {
                const response = await fetch(`/api/personas/${personaId}/similar`)
                if (response.ok) {
                    const data = await response.json()
                    setSouls(data)
                }
            } catch (error) {
                console.error("Error fetching similar souls:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSimilarSouls()
    }, [personaId])

    const updateScrollState = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return
        const scrollAmount = direction === "left" ? -320 : 320
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }

    if (isLoading) {
        return (
            <div className="animate-pulse px-4 py-8">
                <div className="mb-6 h-8 w-48 rounded bg-rp-surface/50" />
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-80 w-64 shrink-0 rounded-2xl bg-rp-surface/30" />
                    ))}
                </div>
            </div>
        )
    }

    if (souls.length === 0) return null

    return (
        <section className="animate-fade-in px-4 py-12 md:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-rp-iris" />
                        <h2 className="font-tiempos-headline text-2xl font-bold tracking-tight text-rp-text md:text-3xl">
                            More Like This
                        </h2>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="hidden gap-2 md:flex">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            className="bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 size-10 rounded-full transition-all disabled:opacity-30"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            className="bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 size-10 rounded-full transition-all disabled:opacity-30"
                        >
                            <ChevronRight className="size-5" />
                        </Button>
                    </div>
                </div>

                {/* Carousel */}
                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 md:gap-6"
                >
                    {souls.map((soul, index) => (
                        <div key={soul.id} className="w-64 shrink-0 snap-start md:w-72">
                            <CharacterCard
                                id={soul.id}
                                name={soul.name}
                                imageUrl={soul.image_url}
                                category={soul.category}
                                totalChats={soul.totalChats}
                                animationIndex={index}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
