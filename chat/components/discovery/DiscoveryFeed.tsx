"use client"

import { useState, useCallback } from "react"
import { CategoryTabs } from "./CategoryTabs"
import { TrendingCarousel } from "./TrendingCarousel"
import { CharacterCard } from "./CharacterCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchX, Compass } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LottieLoader } from "@/components/ui/lottie-loader"

interface Category {
    id: string
    name: string
    slug: string
    icon: string | null
    color: string | null
}

interface PersonaWithStats {
    id: string
    name: string
    image_url: string | null
    category: string | null
    description: string | null
    is_featured: boolean | null
    persona_stats: {
        total_chats: number
        trending_score: number
    } | null
}

interface TrendingPersona {
    id: string
    name: string
    imageUrl: string | null
    description: string | null
    totalChats: number
    isFeatured: boolean
}

interface DiscoveryFeedProps {
    initialPersonas: PersonaWithStats[]
    trendingPersonas: TrendingPersona[]
    categories: Category[]
    categoryColors: Record<string, string>
    initialHasMore: boolean
}

const PAGE_SIZE = 12

export function DiscoveryFeed({
    initialPersonas,
    trendingPersonas,
    categories,
    categoryColors,
    initialHasMore
}: DiscoveryFeedProps) {
    const [personas, setPersonas] = useState<PersonaWithStats[]>(initialPersonas)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [offset, setOffset] = useState(PAGE_SIZE)
    const supabase = createClient()

    const fetchPersonas = useCallback(async (category: string | null, reset = false) => {
        if (reset) {
            setLoading(true)
            setOffset(PAGE_SIZE)
        } else {
            setLoadingMore(true)
        }

        try {
            const currentOffset = reset ? 0 : offset

            let query = supabase
                .from("personas")
                .select(`
          id,
          name,
          image_url,
          category,
          description,
          is_featured,
          persona_stats(total_chats, trending_score)
        `)
                .eq("status", "approved")
                .eq("visibility", "PUBLIC")
                .order("created_at", { ascending: false })
                .range(currentOffset, currentOffset + PAGE_SIZE - 1)

            if (category) {
                query = query.eq("category", category)
            }

            const { data, error } = await query

            if (error) throw error

            const typedData = data as unknown as PersonaWithStats[]

            if (reset) {
                setPersonas(typedData)
            } else {
                setPersonas((prev) => [...prev, ...typedData])
            }

            setHasMore(typedData.length === PAGE_SIZE)
            if (!reset) {
                setOffset((prev) => prev + PAGE_SIZE)
            }
        } catch (error) {
            console.error("Error fetching personas:", error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [offset, supabase])

    const handleCategoryChange = (category: string | null) => {
        setSelectedCategory(category)
        fetchPersonas(category, true)
    }

    const handleLoadMore = () => {
        fetchPersonas(selectedCategory, false)
    }

    return (
        <div className="bg-rp-base min-h-screen">
            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Trending Section */}
                {trendingPersonas.length > 0 && (
                    <section className="mb-10">
                        <TrendingCarousel personas={trendingPersonas} />
                    </section>
                )}

                {/* Explore Souls Section */}
                <section className="mb-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Compass className="size-5 text-rp-iris" />
                        <h2 className="text-2xl font-bold text-rp-iris">Explore Souls</h2>
                    </div>
                    <CategoryTabs
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={handleCategoryChange}
                    />
                </section>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="border-rp-muted/20 bg-rp-surface animate-fade-in overflow-hidden rounded-2xl border"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <Skeleton className="bg-rp-muted/30 animate-shimmer aspect-[3/4] w-full" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Character Grid */}
                {!loading && (
                    <>
                        {personas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <SearchX className="text-rp-muted mb-4 size-16" />
                                <h3 className="text-rp-text mb-2 text-xl font-semibold">
                                    No characters found
                                </h3>
                                <p className="text-rp-subtle">
                                    Try selecting a different category or check back later.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {personas.map((persona, index) => (
                                    <CharacterCard
                                        key={persona.id}
                                        id={persona.id}
                                        name={persona.name}
                                        imageUrl={persona.image_url}
                                        category={persona.category}
                                        categoryColor={persona.category ? categoryColors[persona.category] : null}
                                        totalChats={persona.persona_stats?.total_chats ?? 0}
                                        animationIndex={index}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Load More Button */}
                        {hasMore && personas.length > 0 && (
                            <div className="mt-8 flex justify-center">
                                <Button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    variant="outline"
                                    className="border-rp-muted bg-rp-surface text-rp-text hover:bg-rp-overlay min-w-40 rounded-full"
                                >
                                    {loadingMore ? (
                                        <>
                                            <LottieLoader size={16} className="mr-2" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
