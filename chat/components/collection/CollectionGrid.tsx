"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IconSearch, IconSortAscending, IconSortDescending } from "@tabler/icons-react"
import { CollectionCard } from "./CollectionCard"
import { CollectionSoul, Rarity } from "@/hooks/use-collection"

interface CollectionGridProps {
    souls: CollectionSoul[]
    loading?: boolean
    className?: string
}

type SortOption = "newest" | "name" | "rarity" | "duplicates"
type FilterTab = "all" | Rarity

const FILTER_TABS: { value: FilterTab; label: string; color: string }[] = [
    { value: "all", label: "All", color: "bg-white/10" },
    { value: "legendary", label: "Legendary", color: "bg-amber-500/20" },
    { value: "epic", label: "Epic", color: "bg-purple-500/20" },
    { value: "rare", label: "Rare", color: "bg-blue-500/20" },
    { value: "common", label: "Common", color: "bg-gray-500/20" }
]

const RARITY_ORDER: Record<Rarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3
}

export function CollectionGrid({
    souls,
    loading = false,
    className
}: CollectionGridProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
    const [sortBy, setSortBy] = useState<SortOption>("rarity")
    const [sortAsc, setSortAsc] = useState(false)

    // Filter and sort souls
    const filteredSouls = useMemo(() => {
        let result = [...souls]

        // Apply rarity filter
        if (activeFilter !== "all") {
            result = result.filter(soul => soul.rarity === activeFilter)
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase()
            result = result.filter(soul =>
                soul.isOwned && soul.name.toLowerCase().includes(search)
            )
        }

        // Apply sorting
        result.sort((a, b) => {
            // Always show owned before unowned
            if (a.isOwned !== b.isOwned) return a.isOwned ? -1 : 1

            let comparison = 0
            switch (sortBy) {
                case "newest":
                    comparison = new Date(b.firstPulledAt || 0).getTime() -
                        new Date(a.firstPulledAt || 0).getTime()
                    break
                case "name":
                    comparison = a.name.localeCompare(b.name)
                    break
                case "rarity":
                    comparison = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
                    break
                case "duplicates":
                    comparison = b.pullCount - a.pullCount
                    break
            }

            return sortAsc ? -comparison : comparison
        })

        return result
    }, [souls, activeFilter, searchTerm, sortBy, sortAsc])

    const ownedCount = filteredSouls.filter(s => s.isOwned).length
    const totalCount = filteredSouls.length

    const handleSortToggle = () => {
        setSortAsc(!sortAsc)
    }

    const handleSortChange = (option: SortOption) => {
        if (sortBy === option) {
            setSortAsc(!sortAsc)
        } else {
            setSortBy(option)
            setSortAsc(false)
        }
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Search and Sort Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative flex-1 sm:max-w-xs">
                    <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search souls..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10"
                    />
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    {(["rarity", "newest", "name", "duplicates"] as SortOption[]).map((option) => (
                        <Button
                            key={option}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSortChange(option)}
                            className={cn(
                                "h-7 px-2 text-xs capitalize",
                                sortBy === option
                                    ? "bg-white/10 text-white"
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {option}
                            {sortBy === option && (
                                sortAsc
                                    ? <IconSortAscending className="ml-1 size-3" />
                                    : <IconSortDescending className="ml-1 size-3" />
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((tab) => {
                    const count = tab.value === "all"
                        ? souls.filter(s => s.isOwned).length
                        : souls.filter(s => s.rarity === tab.value && s.isOwned).length
                    const total = tab.value === "all"
                        ? souls.length
                        : souls.filter(s => s.rarity === tab.value).length

                    return (
                        <Button
                            key={tab.value}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveFilter(tab.value)}
                            className={cn(
                                "h-8 px-3 text-sm font-medium transition-all",
                                activeFilter === tab.value
                                    ? `${tab.color} text-white ring-1 ring-white/20`
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab.label}
                            <span className={cn(
                                "ml-1.5 text-xs",
                                activeFilter === tab.value ? "text-white/70" : "text-muted-foreground"
                            )}>
                                {count}/{total}
                            </span>
                        </Button>
                    )
                })}
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
                Showing {ownedCount} owned of {totalCount} souls
                {searchTerm && ` matching "${searchTerm}"`}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-[3/4] animate-pulse rounded-xl bg-white/5"
                        />
                    ))}
                </div>
            ) : filteredSouls.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
                    <p className="text-lg font-medium text-white/60">No souls found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {searchTerm
                            ? "Try a different search term"
                            : "Pull from the gacha to add souls to your collection!"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredSouls.map((soul, index) => (
                        <CollectionCard
                            key={soul.personaId}
                            soul={soul}
                            animationIndex={index}
                            showLocked={activeFilter === "all" || activeFilter === soul.rarity}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
