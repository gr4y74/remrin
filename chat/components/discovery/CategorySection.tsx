"use client"

import { useRef } from "react"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { FlipCard, FlipCardPersona } from "./FlipCard"

interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    persona_stats?: {
        total_chats?: number
        followers_count?: number
    }
}

interface Section {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
    age_rating: string
}

interface CategorySectionProps {
    section: Section
    personas: Persona[]
    onPersonaClick: (personaId: string) => void
    className?: string
}

export function CategorySection({ section, personas, onPersonaClick, className }: CategorySectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 278 // 258px card width + 20px gap
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            })
        }
    }

    if (personas.length === 0) {
        return null // Don't render empty sections
    }

    // Convert Persona to FlipCardPersona format
    const convertToFlipCardPersona = (persona: Persona): FlipCardPersona => ({
        id: persona.id,
        name: persona.name,
        imageUrl: persona.image_url,
        category: section.name,
        description: persona.description,
        // Optional fields will use placeholder data from FlipCard
        subtitle: `${persona.persona_stats?.total_chats?.toLocaleString() || 0} chats`,
    })

    return (
        <div className={cn("w-full px-4 py-6 md:py-8", className)}>
            <div className="mx-auto w-full max-w-7xl">
                {/* Section Header */}
                <div className="mb-4 md:mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {section.icon && (
                            <div
                                className="flex size-8 md:size-10 items-center justify-center rounded-lg text-xl md:text-2xl"
                                style={{ backgroundColor: section.color + '20' || '#6366f120' }}
                            >
                                {section.icon}
                            </div>
                        )}
                        <div>
                            <h2 className="font-tiempos-headline text-xl md:text-3xl font-semibold text-rp-text">
                                {section.name}
                            </h2>
                            {section.description && (
                                <p className="text-rp-muted text-xs md:text-sm hidden md:block">{section.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Scroll Buttons - Desktop only */}
                    {personas.length > 4 && (
                        <div className="hidden gap-2 md:flex">
                            <button
                                onClick={() => scroll("left")}
                                className="rounded-lg border border-rp-iris/20 bg-rp-surface p-2 text-rp-text transition-colors hover:border-rp-iris hover:bg-rp-base"
                                aria-label="Scroll left"
                            >
                                <IconChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => scroll("right")}
                                className="rounded-lg border border-rp-iris/20 bg-rp-surface p-2 text-rp-text transition-colors hover:border-rp-iris hover:bg-rp-base"
                                aria-label="Scroll right"
                            >
                                <IconChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile: Swipe indicator */}
                <div className="mb-2 flex items-center justify-center gap-2 text-xs text-rp-muted md:hidden">
                    <IconChevronLeft size={14} />
                    <span>Swipe to explore</span>
                    <IconChevronRight size={14} />
                </div>

                {/* Scrollable Row with FlipCards */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-pl-4 md:scroll-pl-0 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {personas.map((persona) => (
                        <div key={persona.id} className="shrink-0 snap-start">
                            <FlipCard
                                persona={convertToFlipCardPersona(persona)}
                                onClick={() => onPersonaClick(persona.id)}
                            />
                        </div>
                    ))}
                    {/* Spacer for peek effect on mobile */}
                    <div className="shrink-0 w-4 md:hidden" aria-hidden="true" />
                </div>
            </div>
        </div>
    )
}
