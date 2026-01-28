"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { IconHash, IconTrendingUp, IconChevronRight } from "@tabler/icons-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TrendingHashtag {
    tag: string
    usage_count: number
    search_count: number
    trending_score: number
}

interface TrendingHashtagsProps {
    limit?: number
    onHashtagClick?: (tag: string) => void
    className?: string
}

export function TrendingHashtags({
    limit = 12,
    onHashtagClick,
    className
}: TrendingHashtagsProps) {
    const [trending, setTrending] = useState<TrendingHashtag[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const supabase = createClient()

                const { data, error } = await supabase
                    .rpc('get_trending_hashtags', { limit_count: limit })

                if (!error && data) {
                    setTrending(data)
                }
            } catch (error) {
                console.error('Error fetching trending hashtags:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTrending()
    }, [limit])

    const handleHashtagClick = (tag: string) => {
        if (onHashtagClick) {
            onHashtagClick(tag)
        }
    }

    if (loading) {
        return (
            <div className={cn("w-full px-4 py-8", className)}>
                <div className="mx-auto w-full max-w-7xl">
                    <div className="mb-6 flex items-center gap-2">
                        <IconTrendingUp size={24} className="text-rp-rose" />
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Trending Hashtags
                        </h2>
                    </div>
                    <div className="flex items-center justify-center py-12">
                        <div className="text-rp-muted">Loading trending hashtags...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (trending.length === 0) {
        return null // Don't show section if no trending hashtags
    }

    return (
        <div className={cn("w-full px-4 py-8", className)}>
            <div className="mx-auto w-full max-w-7xl">
                {/* Section Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IconTrendingUp size={24} className="text-rp-rose" />
                        <h2 className="font-tiempos-headline text-3xl font-semibold text-rp-text">
                            Trending Hashtags
                        </h2>
                    </div>

                    <Link
                        href="/discover?view=hashtags"
                        className="flex items-center gap-1 text-sm font-medium text-rp-iris transition-colors hover:text-rp-rose"
                    >
                        View All
                        <IconChevronRight size={16} />
                    </Link>
                </div>

                {/* Hashtag Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {trending.map((hashtag, index) => (
                        <button
                            key={hashtag.tag}
                            onClick={() => handleHashtagClick(hashtag.tag)}
                            className="group relative overflow-hidden rounded-xl border border-rp-highlight-med bg-rp-surface p-4 text-left transition-all hover:-translate-y-1 hover:border-rp-iris hover:shadow-lg hover:shadow-rp-iris/20"
                        >
                            {/* Trending Badge for Top 3 */}
                            {index < 3 && (
                                <div className="absolute right-2 top-2">
                                    <div className={cn(
                                        "flex size-6 items-center justify-center rounded-full text-xs font-bold text-white",
                                        index === 0 && "bg-gradient-to-br from-yellow-400 to-orange-500",
                                        index === 1 && "bg-gradient-to-br from-gray-300 to-gray-400",
                                        index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700"
                                    )}>
                                        {index + 1}
                                    </div>
                                </div>
                            )}

                            {/* Hashtag Icon */}
                            <div className="mb-2 flex items-center gap-2">
                                <div className="rounded-lg bg-rp-base p-2">
                                    <IconHash size={20} className="text-rp-iris" />
                                </div>
                            </div>

                            {/* Hashtag Name */}
                            <p className="mb-1 truncate text-sm font-semibold text-rp-text">
                                #{hashtag.tag}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-2 text-xs text-rp-muted">
                                <span>{hashtag.usage_count} souls</span>
                                {hashtag.search_count > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>{hashtag.search_count} searches</span>
                                    </>
                                )}
                            </div>

                            {/* Hover Glow */}
                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="absolute inset-0 bg-gradient-to-t from-rp-iris/10 to-transparent" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Help Text */}
                <p className="mt-4 text-center text-xs text-rp-muted">
                    💡 Click a hashtag to discover souls with that tag
                </p>
            </div>
        </div>
    )
}
