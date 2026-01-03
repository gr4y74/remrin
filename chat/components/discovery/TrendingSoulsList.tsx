"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { IconTrendingUp, IconMessageCircle, IconHeart } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface TrendingPersona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    message_count: number
    follower_count: number
}

interface TrendingSoulsListProps {
    onPersonaClick: (personaId: string) => void
    className?: string
}

export function TrendingSoulsList({ onPersonaClick, className }: TrendingSoulsListProps) {
    const [trending, setTrending] = useState<TrendingPersona[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const supabase = createClient()

                const { data, error } = await supabase
                    .from("personas")
                    .select("id, name, description, image_url, message_count, follower_count")
                    .eq("visibility", "PUBLIC")
                    .order("message_count", { ascending: false })
                    .limit(8)

                if (!error && data) {
                    // Add random counts for demo if needed
                    const withCounts = data.map(p => ({
                        ...p,
                        message_count: p.message_count || Math.floor(Math.random() * 50000),
                        follower_count: p.follower_count || Math.floor(Math.random() * 10000)
                    }))
                    setTrending(withCounts)
                }
            } catch (error) {
                console.error("Error fetching trending personas:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchTrending()
    }, [])

    if (loading) {
        return (
            <div className={cn("w-full px-4 py-8", className)}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Trending Souls
                        </h2>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-rp-muted">Loading trending souls...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (trending.length === 0) {
        return (
            <div className={cn("w-full px-4 py-8", className)}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Trending Souls
                        </h2>
                    </div>
                    <div className="rounded-lg border border-rp-highlight-med bg-rp-surface p-8 text-center">
                        <p className="text-rp-muted">No trending souls yet - be the first to chat!</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("w-full px-4 py-8", className)}>
            <div className="mx-auto max-w-7xl">
                {/* Section Header */}
                <div className="mb-6">
                    <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                        Trending Souls
                    </h2>
                </div>

                {/* Trending List */}
                <div className="overflow-hidden rounded-lg border border-rp-highlight-med bg-rp-surface shadow-lg">
                    {trending.map((persona, index) => (
                        <div
                            key={persona.id}
                            className={cn(
                                "group flex items-center gap-4 border-b border-rp-highlight-low p-4 transition-colors hover:bg-rp-base last:border-b-0",
                                "cursor-pointer"
                            )}
                            onClick={() => onPersonaClick(persona.id)}
                        >
                            {/* Rank Badge */}
                            <div className="flex size-8 flex-shrink-0 items-center justify-center">
                                {index < 3 ? (
                                    <IconTrendingUp
                                        size={20}
                                        className={cn(
                                            index === 0 && "text-amber-400",
                                            index === 1 && "text-gray-400",
                                            index === 2 && "text-orange-400"
                                        )}
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-rp-muted">#{index + 1}</span>
                                )}
                            </div>

                            {/* Avatar */}
                            <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-rp-highlight-med transition-all group-hover:ring-rp-iris">
                                {persona.image_url ? (
                                    <Image
                                        src={persona.image_url}
                                        alt={persona.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-rp-iris/50 to-rp-rose/50">
                                        <span className="text-sm font-bold text-rp-text">
                                            {persona.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 overflow-hidden">
                                <h3 className="truncate font-medium text-rp-text transition-colors group-hover:text-rp-iris">
                                    {persona.name}
                                </h3>
                                {persona.description && (
                                    <p className="truncate text-sm text-rp-muted">
                                        {persona.description}
                                    </p>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="hidden items-center gap-4 text-sm text-rp-muted sm:flex">
                                <div className="flex items-center gap-1">
                                    <IconMessageCircle size={16} />
                                    <span>{(persona.message_count || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <IconHeart size={16} />
                                    <span>{(persona.follower_count || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* View Button */}
                            <button
                                className="flex-shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onPersonaClick(persona.id)
                                }}
                            >
                                View
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
