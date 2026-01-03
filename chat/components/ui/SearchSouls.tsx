"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { IconSearch, IconX, IconHash } from "@tabler/icons-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SearchResult {
    id: string
    name: string
    image_url: string | null
    description: string | null
    config?: {
        hashtags?: string[]
    }
    match_type?: 'name' | 'description' | 'hashtag'
    relevance_score?: number
}

interface HashtagSuggestion {
    tag: string
    usage_count: number
}

interface SearchSoulsProps {
    onResultClick: (personaId: string) => void
    className?: string
}

export function SearchSouls({ onResultClick, className }: SearchSoulsProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    const isHashtagSearch = query.trim().startsWith("#")
    const searchTerm = isHashtagSearch ? query.slice(1).toLowerCase() : query

    // Fetch hashtag suggestions when typing #
    useEffect(() => {
        if (!isHashtagSearch || searchTerm.length === 0) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const timer = setTimeout(async () => {
            try {
                const supabase = createClient()

                // Get hashtag suggestions from analytics
                const { data, error } = await supabase
                    .rpc('get_hashtag_suggestions', {
                        partial: searchTerm,
                        limit_count: 8
                    })

                if (!error && data) {
                    setSuggestions(data)
                    setShowSuggestions(data.length > 0)
                }
            } catch (error) {
                console.error("Hashtag suggestion error:", error)
            }
        }, 200)

        return () => clearTimeout(timer)
    }, [isHashtagSearch, searchTerm])

    // Debounced search for personas
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            setIsOpen(false)
            return
        }

        const timer = setTimeout(async () => {
            setIsLoading(true)
            try {
                const supabase = createClient()

                let queryBuilder = supabase
                    .from("personas")
                    .select("id, name, image_url, description, config")
                    .eq("visibility", "PUBLIC")

                if (isHashtagSearch && searchTerm.length > 0) {
                    // Hashtag search - query JSONB array
                    queryBuilder = queryBuilder.contains('config', {
                        hashtags: [searchTerm]
                    })

                    // Track hashtag search
                    supabase.rpc('increment_hashtag_search', {
                        tag_name: searchTerm
                    }).then(() => { })  // Fire and forget
                } else {
                    // Text search - name or description
                    queryBuilder = queryBuilder.or(
                        `name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`
                    )
                }

                const { data, error } = await queryBuilder
                    .limit(12)

                if (!error && data) {
                    // Add match type and relevance score
                    const scored = data.map(persona => {
                        let match_type: 'name' | 'description' | 'hashtag' = 'description'
                        let relevance_score = 1

                        if (isHashtagSearch) {
                            match_type = 'hashtag'
                            relevance_score = 2
                        } else if (persona.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                            match_type = 'name'
                            relevance_score = 3
                        } else if (persona.config?.hashtags?.some(tag =>
                            tag.toLowerCase().includes(searchTerm.toLowerCase())
                        )) {
                            match_type = 'hashtag'
                            relevance_score = 2
                        }

                        return { ...persona, match_type, relevance_score }
                    })

                    // Sort by relevance
                    scored.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
                    setResults(scored)
                    setIsOpen(scored.length > 0)
                }
            } catch (error) {
                console.error("Search error:", error)
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, isHashtagSearch, searchTerm])

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setShowSuggestions(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleResultClick = (personaId: string, hashtag?: string) => {
        // Track hashtag click if applicable
        if (hashtag && isHashtagSearch) {
            const supabase = createClient()
            supabase.rpc('increment_hashtag_click', {
                tag_name: hashtag
            }).then(() => { })  // Fire and forget
        }

        setQuery("")
        setResults([])
        setIsOpen(false)
        setShowSuggestions(false)
        onResultClick(personaId)
    }

    const handleSuggestionClick = (tag: string) => {
        setQuery(`#${tag}`)
        setShowSuggestions(false)
    }

    const handleClear = () => {
        setQuery("")
        setResults([])
        setIsOpen(false)
        setShowSuggestions(false)
    }

    return (
        <div ref={searchRef} className={cn("relative w-full", className)}>
            {/* Search Input */}
            <div className="relative">
                <IconSearch
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted"
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search souls by name or #hashtag..."
                    className="w-full rounded-lg border border-rp-highlight-med bg-rp-surface px-10 py-2.5 text-sm text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-muted hover:text-rp-text"
                    >
                        <IconX size={18} />
                    </button>
                )}
            </div>

            {/* Hashtag Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-rp-highlight-med bg-rp-surface shadow-xl">
                    <div className="p-2">
                        <p className="px-2 py-1 text-xs font-medium text-rp-muted">Suggested hashtags</p>
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.tag}
                                onClick={() => handleSuggestionClick(suggestion.tag)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-rp-base"
                            >
                                <IconHash size={16} className="text-rp-iris" />
                                <span className="flex-1 text-sm text-rp-text">
                                    {suggestion.tag}
                                </span>
                                <span className="text-xs text-rp-muted">
                                    {suggestion.usage_count} souls
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Dropdown */}
            {isOpen && !showSuggestions && (
                <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-rp-highlight-med bg-rp-surface shadow-xl">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-rp-muted">
                            Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(
                                        result.id,
                                        isHashtagSearch ? searchTerm : undefined
                                    )}
                                    className="flex w-full items-center gap-3 border-b border-rp-highlight-low p-3 text-left transition-colors hover:bg-rp-base last:border-b-0"
                                >
                                    {/* Avatar */}
                                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
                                        {result.image_url ? (
                                            <Image
                                                src={result.image_url}
                                                alt={result.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center bg-gradient-to-br from-rp-iris/50 to-rp-rose/50">
                                                <span className="text-xs font-bold text-rp-text">
                                                    {result.name.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm font-medium text-rp-text">
                                            {result.name}
                                            {result.match_type === 'hashtag' && (
                                                <span className="ml-2 text-xs text-rp-iris">
                                                    #{isHashtagSearch ? searchTerm : 'match'}
                                                </span>
                                            )}
                                        </p>
                                        {result.description && (
                                            <p className="truncate text-xs text-rp-muted">
                                                {result.description}
                                            </p>
                                        )}
                                        {/* Show hashtags */}
                                        {result.config?.hashtags && result.config.hashtags.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {result.config.hashtags.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full bg-rp-base px-2 py-0.5 text-xs text-rp-muted"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-rp-muted">
                            {isHashtagSearch
                                ? `No souls found with #${searchTerm}`
                                : "No souls found matching your search"
                            }
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
