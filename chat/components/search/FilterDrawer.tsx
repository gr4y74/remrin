"use client"

import { useState } from "react"
import { X, SlidersHorizontal } from "lucide-react"
import { SearchFilters, SearchFilterState } from "./SearchFilters"

interface FilterDrawerProps {
    filters: SearchFilterState
    onFiltersChange: (filters: SearchFilterState) => void
    availableTags?: string[]
    availableCategories?: string[]
}

export function FilterDrawer({
    filters,
    onFiltersChange,
    availableTags = [],
    availableCategories = [],
}: FilterDrawerProps) {
    const [isOpen, setIsOpen] = useState(false)

    const activeFilterCount =
        filters.tags.length +
        (filters.category ? 1 : 0) +
        (filters.priceRange ? 1 : 0) +
        (filters.rarity ? 1 : 0)

    return (
        <>
            {/* Filter Button (Mobile) */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm font-medium text-text shadow-md hover:bg-overlay transition-colors md:hidden"
            >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-love text-xs text-white">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-base/80 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-base shadow-2xl transition-transform duration-300 ease-out md:hidden ${isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                {/* Drawer Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-muted bg-base px-4 py-4">
                    <h2 className="text-lg font-semibold text-text">Filters</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-full p-2 hover:bg-overlay transition-colors"
                    >
                        <X className="h-5 w-5 text-subtle" />
                    </button>
                </div>

                {/* Drawer Content */}
                <div className="p-4">
                    <SearchFilters
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        availableTags={availableTags}
                        availableCategories={availableCategories}
                    />
                </div>

                {/* Apply Button */}
                <div className="sticky bottom-0 border-t border-muted bg-base p-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full rounded-lg bg-iris px-4 py-3 font-semibold text-white hover:bg-iris/90 transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    )
}
