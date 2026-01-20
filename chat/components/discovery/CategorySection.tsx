"use client"

import { useRef } from "react"
import Image from "next/image"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

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
            const scrollAmount = 320 // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            })
        }
    }

    if (personas.length === 0) {
        return null // Don't render empty sections
    }

    return (
        <div className={cn("w-full px-4 py-6 md:py-8", className)}>
            <div className="mx-auto max-w-7xl">
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

                {/* Scrollable Row with Snap Scroll */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-pl-4 md:scroll-pl-0 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {personas.map((persona) => (
                        <div
                            key={persona.id}
                            onClick={() => onPersonaClick(persona.id)}
                            className="group relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-rp-iris/20 shadow-lg transition-all hover:-translate-y-1 active:scale-95 hover:shadow-2xl hover:border-rp-iris/40 snap-start"
                            style={{
                                width: "calc(100vw - 5rem)",
                                maxWidth: "300px",
                                height: "350px"
                            }}
                        >
                            {/* Background Image */}
                            {persona.image_url ? (
                                <Image
                                    src={persona.image_url}
                                    alt={persona.name}
                                    fill
                                    sizes="(max-width: 768px) calc(100vw - 5rem), 300px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-rp-iris/50 to-rp-rose/50" />
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                                <h3 className="font-tiempos-headline text-lg md:text-xl font-semibold text-white drop-shadow-lg">
                                    {persona.name}
                                </h3>
                                {persona.description && (
                                    <p className="mt-1 line-clamp-2 text-xs md:text-sm text-white/80">
                                        {persona.description}
                                    </p>
                                )}
                                {persona.persona_stats && (
                                    <div className="mt-2 flex gap-2 md:gap-3 text-[10px] md:text-xs text-white/70">
                                        {persona.persona_stats.total_chats !== undefined && (
                                            <span>{persona.persona_stats.total_chats.toLocaleString()} chats</span>
                                        )}
                                        {persona.persona_stats.followers_count !== undefined && (
                                            <span>{persona.persona_stats.followers_count.toLocaleString()} followers</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Hover Glow Effect */}
                            <div
                                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                                style={{
                                    background: `linear-gradient(to top, ${section.color || '#6366f1'}20, transparent)`
                                }}
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
