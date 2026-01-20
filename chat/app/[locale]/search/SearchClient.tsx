"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { IconSearch, IconFilter, IconX } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ResponsiveGrid } from "@/components/ui/responsive-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
// import { FilterSidebar } from "./FilterSidebar" // We'll implement this inline for now or separate file
import Image from "next/image"

// Types
interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    is_featured: boolean
    config?: {
        hashtags?: string[]
    }
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

    // State
    const [query, setQuery] = useState(searchParams.get("q") || "")
    const [results, setResults] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

    // Filters (Mocking basic filters for now as per "unchanged" desktop req - assuming standard filters)
    const [filters, setFilters] = useState({
        onlyFeatured: false,
        hasImage: false
    })

    // Search Effect
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true)
            const supabase = createClient()

            let dbQuery = supabase
                .from("personas")
                .select("*")
                .eq("visibility", "PUBLIC")

            if (query) {
                dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            }

            if (filters.onlyFeatured) {
                dbQuery = dbQuery.eq("is_featured", true)
            }

            if (filters.hasImage) {
                dbQuery = dbQuery.not("image_url", "is", null)
            }

            const { data, error } = await dbQuery.limit(50)

            if (!error && data) {
                setResults(data)
            }
            setLoading(false)
        }

        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [query, filters])

    // Update URL on query change (optional, keeps refreshing clean)
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (query) {
            params.set("q", query)
        } else {
            params.delete("q")
        }
        // Replace url without scroll
        router.replace(`/search?${params.toString()}`, { scroll: false })
    }, [query, router, searchParams])

    const FilterContent = () => (
        <div className="space-y-6">
            <div>
                <h3 className="mb-4 text-sm font-medium text-rp-subtle uppercase tracking-wider">Filters</h3>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.onlyFeatured}
                            onChange={(e) => setFilters(prev => ({ ...prev, onlyFeatured: e.target.checked }))}
                            className="rounded border-rp-muted bg-rp-overlay text-rp-iris focus:ring-rp-iris"
                        />
                        <span className="text-rp-text">Featured Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.hasImage}
                            onChange={(e) => setFilters(prev => ({ ...prev, hasImage: e.target.checked }))}
                            className="rounded border-rp-muted bg-rp-overlay text-rp-iris focus:ring-rp-iris"
                        />
                        <span className="text-rp-text">Has Image</span>
                    </label>
                </div>
            </div>

            {/* Tag Cloud Placeholder - common in search sidebars */}
            <div>
                <h3 className="mb-4 text-sm font-medium text-rp-subtle uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {['Anime', 'Realistic', 'Fantasy', 'Sci-Fi'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-rp-overlay rounded-full text-xs text-rp-muted hover:bg-rp-highlight-low cursor-pointer">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-1 flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 shrink-0 border-r border-rp-highlight-med bg-rp-surface p-6 md:block">
                <FilterContent />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
                {/* Sticky Header - Optimized for Mobile */}
                <header className="sticky top-0 z-30 border-b border-rp-highlight-med bg-rp-base/95 backdrop-blur-xl md:static md:border-b-0 md:bg-transparent md:p-6">
                    <div className="flex items-center gap-3 p-4 md:p-0">
                        {/* Mobile Filter Trigger */}
                        <div className="md:hidden">
                            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0 text-rp-muted hover:bg-rp-overlay hover:text-rp-text">
                                        <IconFilter size={20} />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl border-t border-rp-highlight-med bg-rp-surface">
                                    <SheetHeader className="mb-6 text-left">
                                        <SheetTitle className="text-rp-text">Filters</SheetTitle>
                                    </SheetHeader>
                                    <FilterContent />
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1">
                            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search all souls..."
                                className="h-10 w-full rounded-xl border-rp-highlight-med bg-rp-overlay pl-10 text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:ring-rp-iris md:h-12"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-muted hover:text-rp-text"
                                >
                                    <IconX size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Results Grid */}
                <div className="p-4 md:p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex flex-col gap-3 rounded-xl bg-rp-surface p-4">
                                    <Skeleton className="aspect-square w-full rounded-lg" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {results.map((persona) => (
                                <div
                                    key={persona.id}
                                    onClick={() => router.push(`/${searchParams.get('workspace') || 's'}/chat?persona=${persona.id}`)} // Basic fallback routing
                                    className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-transparent bg-rp-surface p-3 transition-all hover:-translate-y-1 hover:border-rp-highlight-med hover:shadow-xl"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-rp-overlay">
                                        {persona.image_url ? (
                                            <Image
                                                src={persona.image_url}
                                                alt={persona.name}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-rp-muted">
                                                <span className="text-2xl font-bold">{persona.name[0]}</span>
                                            </div>
                                        )}
                                        {persona.is_featured && (
                                            <div className="absolute top-2 right-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
                                                FEATURED
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex flex-col gap-1 px-1 pb-1">
                                        <h3 className="font-semibold text-rp-text group-hover:text-rp-iris">{persona.name}</h3>
                                        {persona.description && (
                                            <p className="line-clamp-2 text-xs text-rp-subtle">
                                                {persona.description}
                                            </p>
                                        )}
                                        {/* Hashtags */}
                                        {persona.config?.hashtags && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {persona.config.hashtags.slice(0, 2).map((tag: string) => (
                                                    <span key={tag} className="text-[10px] text-rp-muted">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rp-overlay">
                                <IconSearch size={32} className="text-rp-muted" />
                            </div>
                            <h3 className="mb-1 text-lg font-medium text-rp-text">No souls found</h3>
                            <p className="text-sm text-rp-muted">Try adjusting your filters or search terms</p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setQuery("")
                                    setFilters({ onlyFeatured: false, hasImage: false })
                                }}
                                className="mt-4 text-rp-iris hover:text-rp-iris/80"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
