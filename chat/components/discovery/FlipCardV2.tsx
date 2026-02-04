"use client"

import React from "react"
import Image from "next/image"
import { IconMessageCircle } from "@tabler/icons-react"
import styles from "./FlipCardV2.module.css"

export interface FlipCardV2Persona {
    id: string
    name: string
    subtitle?: string
    imageUrl: string | null
    category: string | null
    description: string | null
    creativity?: number
    traits?: string[]
    stats?: {
        chats?: number
        followers?: number
    }
}

interface FlipCardV2Props {
    persona: FlipCardV2Persona
    onClick?: () => void
    className?: string
}

// Helper to get random traits/stats deterministically based on ID
function getPlaceholderData(id: string) {
    const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)

    const traitsPool = ["⚡ Ancient", "👻 Ethereal", "🎭 Dramatic", "🦭 Cute", "💪 Strong", "😊 Kind", "👑 Regal"]
    const traits = []
    for (let i = 0; i < 3; i++) {
        const idx = (hash + i * 7) % traitsPool.length
        traits.push(traitsPool[idx])
    }

    const chats = Math.floor(40 + (hash % 960))
    const followers = Math.floor(20 + ((hash * 2) % 480))

    return { traits, stats: { chats, followers } }
}

export function FlipCardV2({ persona, onClick, className }: FlipCardV2Props) {
    const { traits, stats } = getPlaceholderData(persona.id)
    const displayTraits = persona.traits || traits
    const displayStats = persona.stats || stats
    const displayCreativity = persona.creativity || 50

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

                {/* BACK (New Blurred Design) */}
                <div className={styles.cardBack}>
                    {/* Blurred Background */}
                    <div className={styles.blurredBackground}>
                        <div className={styles.blurredBackgroundImage}>
                            <Image
                                src={persona.imageUrl || '/placeholder-persona.png'}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="258px"
                            />
                        </div>
                        <div className={styles.blurredBackgroundOverlay} />
                    </div>

                    {/* Content with Glassmorphism */}
                    <div className={styles.cardBackContent}>
                        {/* Header */}
                        <div className={styles.cardBackHeader}>
                            <div className={styles.brandingText}>REMRIN</div>
                            <div className={styles.creativityScore}>
                                <span className={styles.creativityLabel}>CREATIVITY</span>
                                {Math.round(displayCreativity)}
                            </div>
                        </div>

                        {/* Featured Badge */}
                        <div className={styles.featuredBadge}>
                            ✨ FEATURED SOUL
                        </div>

                        {/* Description */}
                        <div className={styles.description}>
                            {persona.description || "A mysterious soul waiting to be discovered."}
                        </div>

                        {/* Traits */}
                        <div className={styles.traitsContainer}>
                            {displayTraits.map((trait, i) => (
                                <div key={i} className={styles.traitTag}>
                                    {trait}
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className={styles.statsContainer}>
                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Chats</div>
                                <div className={styles.statValue}>{displayStats.chats || 0}</div>
                            </div>
                            <div className={styles.statItem}>
                                <div className={styles.statLabel}>Follows</div>
                                <div className={styles.statValue}>{displayStats.followers || 0}</div>
                            </div>
                        </div>

                        {/* Chat Now CTA */}
                        <button className={styles.chatNowButton}>
                            <IconMessageCircle size={20} />
                            Chat Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
