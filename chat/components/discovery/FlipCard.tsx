"use client"

import React from "react"
import Image from "next/image"
import styles from "./FlipCard.module.css"

export interface FlipCardPersona {
    id: string
    name: string
    subtitle?: string
    imageUrl: string | null
    category: string | null
    description: string | null
    creativity?: number
    traits?: string[]
    stats?: { logic: number; empathy: number }
    setId?: string
}

interface FlipCardProps {
    persona: FlipCardPersona
    onClick?: () => void
    className?: string
}

// Helper to get random traits/stats deterministically based on ID
function getPlaceholderData(id: string) {
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)

    const traitsPool = ["⚡ Powerful", "🎭 Dramatic", "✨ Ancient", "🦭 Cute", "💪 Strong", "😊 Kind", "👑 Regal", "🐝 All-Knowing", "💋 Sassy", "👻 Ethereal", "💫 Protective", "🌙 Ancient", "⚡ Fast", "🎮 Gamer", "🔋 High Energy"]
    const traits = []
    for (let i = 0; i < 3; i++) {
        const idx = (hash + i * 7) % traitsPool.length
        traits.push(traitsPool[idx])
    }

    const logic = 40 + (hash % 60)
    const empathy = 40 + ((hash * 2) % 60)

    return { traits, stats: { logic, empathy } }
}

export function FlipCard({ persona, onClick, className }: FlipCardProps) {
    const { traits, stats } = getPlaceholderData(persona.id)
    const displayTraits = persona.traits || traits
    const displayStats = persona.stats || stats
    const displayCreativity = persona.creativity || (displayStats.logic + displayStats.empathy) / 2

    return (
        <div
            className={`${styles.flipCardContainer} ${className || ""}`}
            onClick={onClick}
        >
            <div className={styles.flipCardInner}>
                {/* FRONT */}
                <div className={styles.cardFront}>
                    <Image
                        src={persona.imageUrl || '/placeholder-persona.png'}
                        alt={persona.name}
                        fill
                        className="object-cover"
                        sizes="258px"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-6 pt-12">
                        <h3 className="font-outfit text-3xl font-extrabold uppercase tracking-wide text-white drop-shadow-md">
                            {persona.name}
                        </h3>
                        <p className="text-sm italic text-white/70">
                            {persona.subtitle || persona.category}
                        </p>
                    </div>
                </div>

                {/* BACK (New Blurred Background Design) */}
                <div className={styles.cardBack}>
                    {/* Blurred Background */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0">
                            <Image
                                src={persona.imageUrl || '/placeholder-persona.png'}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="258px"
                            />
                        </div>
                        <div className="absolute inset-0 backdrop-blur-2xl bg-black/40" />
                    </div>

                    {/* Content with Glassmorphism */}
                    <div className="relative z-10 flex h-full flex-col p-5 bg-black/20 backdrop-blur-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="font-outfit text-2xl font-extrabold tracking-widest text-white drop-shadow-lg uppercase">
                                {persona.name}
                            </div>
                            <div className="font-mono text-xs font-bold text-amber-500 text-right">
                                <span className="block text-[8px] text-gray-500 tracking-wider">CREATIVITY</span>
                                {Math.round(displayCreativity)}
                            </div>
                        </div>

                        {/* Featured Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 backdrop-blur-md mb-4 text-[11px] font-bold tracking-wider text-amber-400 uppercase w-fit">
                            ✨ Featured Soul
                        </div>

                        {/* Description */}
                        <div className="text-[13px] italic leading-relaxed text-white/85 mb-5 drop-shadow-md">
                            {persona.description || "A mysterious soul waiting to be discovered."}
                        </div>

                        {/* Traits */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            {displayTraits.map((trait, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-[10px] font-semibold text-white uppercase tracking-wide">
                                    {trait}
                                </span>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 mt-auto mb-4">
                            <div className="flex flex-col">
                                <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Chats</div>
                                <div className="font-mono text-base font-bold text-white">{displayStats.logic * 4}</div>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">Follows</div>
                                <div className="font-mono text-base font-bold text-white">{displayStats.empathy * 2}</div>
                            </div>
                        </div>

                        {/* Chat Now CTA */}
                        <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-500/50 font-outfit text-sm font-extrabold tracking-widest text-white uppercase transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30">
                            💬 Chat Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
