"use client"

import { FlipCard } from "@/components/discovery/FlipCard"
import { FlipCardV2 } from "@/components/discovery/FlipCardV2"

// Sample personas for testing
const samplePersonas = [
    {
        id: "1",
        name: "Mystara",
        subtitle: "Ancient Guardian",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop",
        category: "Fantasy",
        description: "A mysterious soul waiting to be discovered. Ancient wisdom flows through her veins.",
        creativity: 85,
        traits: ["✨ Ancient", "👻 Ethereal", "🎭 Dramatic"],
        stats: {
            logic: 75,
            empathy: 90,
            chats: 342,
            followers: 156
        }
    },
    {
        id: "2",
        name: "Zephyr",
        subtitle: "Wind Dancer",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
        category: "Adventure",
        description: "Free-spirited and wild, Zephyr brings the winds of change wherever they go.",
        creativity: 72,
        traits: ["⚡ Fast", "💫 Protective", "🌙 Mysterious"],
        stats: {
            logic: 65,
            empathy: 80,
            chats: 289,
            followers: 98
        }
    },
    {
        id: "3",
        name: "Luna",
        subtitle: "Night Keeper",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
        category: "Mystical",
        description: "Guardian of dreams and keeper of night secrets. Luna guides lost souls through darkness.",
        creativity: 91,
        traits: ["🌙 Ancient", "💫 Protective", "✨ Wise"],
        stats: {
            logic: 88,
            empathy: 95,
            chats: 512,
            followers: 234
        }
    }
]

export default function CardBackTestPage() {
    return (
        <div className="min-h-screen bg-rp-base py-12">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="mb-12 text-center">
                    <h1 className="font-tiempos-headline text-4xl font-bold text-rp-text mb-4">
                        Card Back Design Comparison
                    </h1>
                    <p className="text-rp-muted text-lg max-w-3xl mx-auto">
                        Compare the old card back design (with rectangular image) vs the new blurred background design.
                        <br />
                        <span className="text-rp-iris font-semibold">Hover over cards to flip them.</span>
                    </p>
                </div>

                {/* Comparison Grid */}
                <div className="space-y-16">
                    {samplePersonas.map((persona, index) => (
                        <div key={persona.id} className="space-y-6">
                            {/* Section Title */}
                            <div className="text-center">
                                <h2 className="font-outfit text-2xl font-bold text-white">
                                    Character {index + 1}: {persona.name}
                                </h2>
                            </div>

                            {/* Side-by-Side Comparison */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start justify-items-center">
                                {/* Old Design */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-semibold text-white">Current Design</span>
                                    </div>
                                    <FlipCard
                                        persona={{
                                            id: persona.id,
                                            name: persona.name,
                                            subtitle: persona.subtitle,
                                            imageUrl: persona.imageUrl,
                                            category: persona.category,
                                            description: persona.description,
                                            creativity: persona.creativity,
                                            traits: persona.traits,
                                            stats: {
                                                logic: persona.stats.logic,
                                                empathy: persona.stats.empathy
                                            }
                                        }}
                                    />
                                    <div className="text-center max-w-xs">
                                        <p className="text-sm text-rp-muted italic">
                                            Includes rectangular image box that crops portrait images poorly
                                        </p>
                                    </div>
                                </div>

                                {/* New Design */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-500">
                                        <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                                        <span className="text-sm font-semibold text-white">New Design</span>
                                    </div>
                                    <FlipCardV2
                                        persona={{
                                            id: persona.id,
                                            name: persona.name,
                                            subtitle: persona.subtitle,
                                            imageUrl: persona.imageUrl,
                                            category: persona.category,
                                            description: persona.description,
                                            creativity: persona.creativity,
                                            traits: persona.traits,
                                            stats: {
                                                chats: persona.stats.chats,
                                                followers: persona.stats.followers
                                            }
                                        }}
                                    />
                                    <div className="text-center max-w-xs">
                                        <p className="text-sm text-emerald-400 font-semibold italic">
                                            Blurred background overlay with glassmorphism - better for portraits!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            {index < samplePersonas.length - 1 && (
                                <div className="border-t border-rp-muted/20 mt-8" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Instructions */}
                <div className="mt-16 p-6 rounded-xl bg-rp-surface/50 border border-rp-muted/20 max-w-2xl mx-auto">
                    <h3 className="font-outfit text-lg font-bold text-rp-iris mb-3">
                        📋 Review Instructions
                    </h3>
                    <ul className="space-y-2 text-rp-text text-sm">
                        <li>• Hover over each card to see the back design</li>
                        <li>• Compare how the portrait images look in each design</li>
                        <li>• The new design uses a blurred background instead of a cropped rectangle</li>
                        <li>• Let me know which design you prefer!</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
