"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { IconSearch, IconX } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchFilters } from "@/components/search/SearchFilters"
import { FilterDrawer } from "@/components/search/FilterDrawer"
import { useSearchFilters } from "@/hooks/useSearchFilters"
import { CharacterCard } from "@/components/discovery/CharacterCard"

// Types
interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    category: string | null
    tags: string[] | null
    price: number | null
    is_featured: boolean
    created_at: string
    persona_stats?: {
        followers_count: number
        total_chats: number
        trending_score: number
    }
}

interface SearchResponse {
    personas: Persona[]
    total: number
    limit: number
    offset: number
}

export function SearchClient() {
    return (
        <Suspense fallback={<div className="p-8"><Skeleton className="h-12 w-full" /></div>}>
            <SearchContent />
        </Suspense>
    )
}

function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { filters, setFilters, getApiParams } = useSearchFilters()

    // State
    const [query, setQuery] = useState(searchParams.get("q") || "")
    const [results, setResults] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    // Fetch available tags and categories
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Fetch unique tags and categories from the database
                const response = await fetch("/api/personas/metadata")
                if (response.ok) {
                    const data = await response.json()
                    setAvailableTags(data.tags || [])
                    setAvailableCategories(data.categories || [])
                }
            } catch (error) {
                console.error("Failed to fetch metadata:", error)
            }
        }
        fetchMetadata()
    }, [])

    // Search Effect
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true)

            try {
                const params = getApiParams()
                const queryString = new URLSearchParams(params).toString()
                const response = await fetch(`/api/personas/search?${queryString}`)

                if (response.ok) {
                    const data: SearchResponse = await response.json()
                    setResults(data.personas)
                    setTotal(data.total)
                } else {
                    console.error("Search failed:", response.statusText)
                    setResults([])
                    setTotal(0)
                }
            } catch (error) {
                console.error("Search error:", error)
                setResults([])
                setTotal(0)
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [filters, getApiParams])

    // Update URL on query change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
            params.set("q", query)
        } else {
            params.delete("q")
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }, [query, router, searchParams])

    return (
        <div className="flex flex-1 flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden w-80 shrink-0 border-r border-highlight-med bg-surface p-6 lg:block">
                <SearchFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    availableTags={availableTags}
                    availableCategories={availableCategories}
                />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                {/* Sticky Header - Optimized for Mobile */}
                <header className="sticky top-0 z-30 border-b border-highlight-med bg-base/95 backdrop-blur-xl lg:static lg:border-b-0 lg:bg-transparent lg:p-6">
                    <div className="flex items-center gap-3 p-4 lg:p-0">
                        {/* Mobile Filter Trigger */}
                        <div className="lg:hidden">
                            <FilterDrawer
                                filters={filters}
                                onFiltersChange={setFilters}
                                availableTags={availableTags}
                                availableCategories={availableCategories}
                            />
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1">
                            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search all souls..."
                                className="h-10 w-full rounded-xl border-muted bg-overlay pl-10 text-text placeholder:text-subtle focus:border-iris focus:ring-iris lg:h-12"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-text"
                                >
                                    <IconX size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Count */}
                    {!loading && (
                        <div className="px-4 pb-2 pt-1 text-sm text-subtle lg:px-0">
                            {total} {total === 1 ? "soul" : "souls"} found
                        </div>
                    )}
                </header>

                {/* Results Grid */}
                <div className="p-4 lg:p-6">
                    {loading ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
                                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                            {results.map((persona, index) => (
                                <CharacterCard
                                    key={persona.id}
                                    id={persona.id}
                                    name={persona.name}
                                    imageUrl={persona.image_url}
                                    category={persona.category}
                                    totalChats={persona.persona_stats?.total_chats || 0}
                                    animationIndex={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-overlay">
                                <IconSearch size={32} className="text-subtle" />
                            </div>
                            <h3 className="mb-1 text-lg font-medium text-text">No souls found</h3>
                            <p className="text-sm text-subtle">Try adjusting your filters or search terms</p>
                            <button
                                onClick={() => {
                                    setQuery("")
                                    setFilters({
                                        tags: [],
                                        category: null,
                                        priceRange: null,
                                        rarity: null,
                                        sortBy: "newest",
                                    })
                                }}
                                className="mt-4 text-iris hover:text-iris/80 transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
