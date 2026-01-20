"use client"

import { useState } from "react"
import { X } from "lucide-react"

export type SortOption = "newest" | "popular" | "price_low" | "price_high"
export type RarityOption = "common" | "uncommon" | "rare" | "legendary" | "mythic"
export type PriceRange = "free" | "1-100" | "100-500" | "500+"

export interface SearchFilterState {
    tags: string[]
    category: string | null
    priceRange: PriceRange | null
    rarity: RarityOption | null
    sortBy: SortOption
}

interface SearchFiltersProps {
    filters: SearchFilterState
    onFiltersChange: (filters: SearchFilterState) => void
    availableTags?: string[]
    availableCategories?: string[]
}

const RARITY_OPTIONS: { value: RarityOption; label: string; color: string }[] = [
    { value: "common", label: "Common", color: "bg-gray-500" },
    { value: "uncommon", label: "Uncommon", color: "bg-green-500" },
    { value: "rare", label: "Rare", color: "bg-blue-500" },
    { value: "legendary", label: "Legendary", color: "bg-purple-500" },
    { value: "mythic", label: "Mythic", color: "bg-rose-500" },
]

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
    { value: "free", label: "Free" },
    { value: "1-100", label: "1-100✧" },
    { value: "100-500", label: "100-500✧" },
    { value: "500+", label: "500+✧" },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Popular" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
]

export function SearchFilters({
    filters,
    onFiltersChange,
    availableTags = [],
    availableCategories = [],
}: SearchFiltersProps) {
    const [tagInput, setTagInput] = useState("")

    const handleTagToggle = (tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter((t) => t !== tag)
            : [...filters.tags, tag]
        onFiltersChange({ ...filters, tags: newTags })
    }

    const handleCategoryChange = (category: string) => {
        onFiltersChange({
            ...filters,
            category: category === filters.category ? null : category,
        })
    }

    const handlePriceRangeChange = (range: PriceRange) => {
        onFiltersChange({
            ...filters,
            priceRange: range === filters.priceRange ? null : range,
        })
    }

    const handleRarityChange = (rarity: RarityOption) => {
        onFiltersChange({
            ...filters,
            rarity: rarity === filters.rarity ? null : rarity,
        })
    }

    const handleSortChange = (sort: SortOption) => {
        onFiltersChange({ ...filters, sortBy: sort })
    }

    const clearAllFilters = () => {
        onFiltersChange({
            tags: [],
            category: null,
            priceRange: null,
            rarity: null,
            sortBy: "newest",
        })
    }

    const hasActiveFilters =
        filters.tags.length > 0 ||
        filters.category ||
        filters.priceRange ||
        filters.rarity

    return (
        <div className="space-y-6 rounded-lg border border-base bg-surface p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-love hover:text-gold transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Sort By */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-subtle">Sort By</label>
                <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="w-full rounded-md border border-muted bg-base px-3 py-2 text-sm text-text focus:border-iris focus:outline-none focus:ring-1 focus:ring-iris"
                >
                    {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Category */}
            {availableCategories.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-subtle">Category</label>
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.map((category) => (
                            <button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${filters.category === category
                                        ? "bg-iris text-base"
                                        : "bg-overlay text-text hover:bg-highlightMed"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            {availableTags.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-subtle">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.slice(0, 20).map((tag) => (
                            <button
                                key={tag}
                                onClick={() => handleTagToggle(tag)}
                                className={`group flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${filters.tags.includes(tag)
                                        ? "bg-foam text-base"
                                        : "bg-overlay text-text hover:bg-highlightMed"
                                    }`}
                            >
                                {tag}
                                {filters.tags.includes(tag) && (
                                    <X className="h-3 w-3 opacity-70" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-subtle">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                    {PRICE_RANGES.map((range) => (
                        <button
                            key={range.value}
                            onClick={() => handlePriceRangeChange(range.value)}
                            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${filters.priceRange === range.value
                                    ? "bg-gold text-base"
                                    : "bg-overlay text-text hover:bg-highlightMed"
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rarity */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-subtle">Rarity</label>
                <div className="space-y-2">
                    {RARITY_OPTIONS.map((rarity) => (
                        <button
                            key={rarity.value}
                            onClick={() => handleRarityChange(rarity.value)}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${filters.rarity === rarity.value
                                    ? "bg-highlightHigh text-text ring-2 ring-iris"
                                    : "bg-overlay text-text hover:bg-highlightMed"
                                }`}
                        >
                            <div className={`h-3 w-3 rounded-full ${rarity.color}`} />
                            {rarity.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
