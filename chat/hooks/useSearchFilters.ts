"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { SortOption, RarityOption, PriceRange } from "@/components/search/SearchFilters"

export interface SearchFilterState {
    tags: string[]
    category: string | null
    priceRange: PriceRange | null
    rarity: RarityOption | null
    sortBy: SortOption
}

const DEFAULT_FILTERS: SearchFilterState = {
    tags: [],
    category: null,
    priceRange: null,
    rarity: null,
    sortBy: "newest",
}

export function useSearchFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse filters from URL
    const filters = useMemo<SearchFilterState>(() => {
        const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
        const category = searchParams.get("category") || null
        const priceRange = (searchParams.get("priceRange") as PriceRange) || null
        const rarity = (searchParams.get("rarity") as RarityOption) || null
        const sortBy = (searchParams.get("sortBy") as SortOption) || "newest"

        return {
            tags,
            category,
            priceRange,
            rarity,
            sortBy,
        }
    }, [searchParams])

    // Update URL with new filters
    const setFilters = useCallback(
        (newFilters: SearchFilterState) => {
            const params = new URLSearchParams(searchParams.toString())

            // Update or remove each filter param
            if (newFilters.tags.length > 0) {
                params.set("tags", newFilters.tags.join(","))
            } else {
                params.delete("tags")
            }

            if (newFilters.category) {
                params.set("category", newFilters.category)
            } else {
                params.delete("category")
            }

            if (newFilters.priceRange) {
                params.set("priceRange", newFilters.priceRange)
            } else {
                params.delete("priceRange")
            }

            if (newFilters.rarity) {
                params.set("rarity", newFilters.rarity)
            } else {
                params.delete("rarity")
            }

            if (newFilters.sortBy !== "newest") {
                params.set("sortBy", newFilters.sortBy)
            } else {
                params.delete("sortBy")
            }

            // Preserve search query if it exists
            const query = searchParams.get("q")
            if (query) {
                params.set("q", query)
            }

            router.push(`?${params.toString()}`, { scroll: false })
        },
        [router, searchParams]
    )

    // Reset all filters
    const resetFilters = useCallback(() => {
        const params = new URLSearchParams()
        const query = searchParams.get("q")
        if (query) {
            params.set("q", query)
        }
        router.push(`?${params.toString()}`, { scroll: false })
    }, [router, searchParams])

    // Build API query params from filters
    const getApiParams = useCallback(() => {
        const params: Record<string, string> = {}

        if (filters.tags.length > 0) {
            params.tags = filters.tags.join(",")
        }

        if (filters.category) {
            params.category = filters.category
        }

        if (filters.priceRange) {
            params.priceRange = filters.priceRange
        }

        if (filters.rarity) {
            params.rarity = filters.rarity
        }

        params.sortBy = filters.sortBy

        const query = searchParams.get("q")
        if (query) {
            params.q = query
        }

        return params
    }, [filters, searchParams])

    return {
        filters,
        setFilters,
        resetFilters,
        getApiParams,
        hasActiveFilters:
            filters.tags.length > 0 ||
            filters.category !== null ||
            filters.priceRange !== null ||
            filters.rarity !== null,
    }
}
