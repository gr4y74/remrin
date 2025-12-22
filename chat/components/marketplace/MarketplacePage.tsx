"use client"

import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ListingCard } from "./ListingCard"
import { PurchaseModal } from "./PurchaseModal"
import { MarketListingWithPersona } from "@/lib/marketplace"
import {
    IconSearch,
    IconSortAscending,
    IconSortDescending,
    IconShoppingCart,
    IconMoodEmpty
} from "@tabler/icons-react"

interface MarketplacePageProps {
    initialListings: MarketListingWithPersona[]
    categories: Array<{ id: string; name: string; slug: string; color: string | null }>
    userBalance?: number
}

type SortOption = "newest" | "price" | "popular"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "price", label: "Price: Low to High" },
    { value: "popular", label: "Most Popular" }
]

export function MarketplacePage({
    initialListings,
    categories,
    userBalance = 0
}: MarketplacePageProps) {
    const [listings] = useState(initialListings)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>("newest")
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

    // Purchase modal state
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
    const [selectedListing, setSelectedListing] = useState<MarketListingWithPersona | null>(null)

    // Filter and sort listings
    const filteredListings = useMemo(() => {
        let result = [...listings]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                listing =>
                    listing.personas.name.toLowerCase().includes(query) ||
                    listing.personas.description?.toLowerCase().includes(query)
            )
        }

        // Category filter (would need category data on personas)
        // For now, this is a placeholder for when category is added to listing data

        // Sort
        switch (sortBy) {
            case "price":
                result.sort((a, b) => a.price_aether - b.price_aether)
                break
            case "popular":
                result.sort((a, b) => b.total_sales - a.total_sales)
                break
            case "newest":
            default:
                result.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                break
        }

        return result
    }, [listings, searchQuery, sortBy])

    const handleBuyClick = useCallback((listingId: string) => {
        const listing = listings.find(l => l.id === listingId)
        if (listing) {
            setSelectedListing(listing)
            setPurchaseModalOpen(true)
        }
    }, [listings])

    const handlePurchaseSuccess = useCallback(() => {
        // TODO: Refresh listings or update state
        setPurchaseModalOpen(false)
        setSelectedListing(null)
    }, [])

    return (
        <div className="flex size-full flex-col overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/50 px-6 py-4 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <IconShoppingCart className="size-8 text-amber-400" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Soul Bazaar</h1>
                                <p className="text-sm text-white/50">
                                    Discover and collect unique AI companions
                                </p>
                            </div>
                        </div>

                        {/* User Balance Display */}
                        <div className="hidden items-center gap-2 rounded-full bg-white/5 px-4 py-2 sm:flex">
                            <span className="text-sm text-white/60">Balance:</span>
                            <span className="font-bold text-amber-400">{userBalance.toLocaleString()}</span>
                            <span className="text-xs text-white/40">Aether</span>
                        </div>
                    </div>

                    {/* Search and Filter Row */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search */}
                        <div className="relative flex-1 sm:max-w-md">
                            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                            <Input
                                placeholder="Search souls..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            >
                                {sortBy === "price" ? (
                                    <IconSortAscending className="mr-2 size-4" />
                                ) : (
                                    <IconSortDescending className="mr-2 size-4" />
                                )}
                                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                            </Button>

                            {sortDropdownOpen && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-xl">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortBy(option.value)
                                                setSortDropdownOpen(false)
                                            }}
                                            className={cn(
                                                "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-white/10",
                                                sortBy === option.value
                                                    ? "text-amber-400"
                                                    : "text-white/80"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Tabs */}
                    {categories.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "shrink-0 rounded-full px-4",
                                    selectedCategory === null
                                        ? "bg-amber-500 text-white hover:bg-amber-400"
                                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                All
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "shrink-0 rounded-full px-4",
                                        selectedCategory === cat.id
                                            ? "bg-amber-500 text-white hover:bg-amber-400"
                                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                    )}
                                    style={{
                                        backgroundColor: selectedCategory === cat.id && cat.color
                                            ? cat.color
                                            : undefined
                                    }}
                                >
                                    {cat.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Listings Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl">
                    {filteredListings.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {filteredListings.map((listing, index) => (
                                <ListingCard
                                    key={listing.id}
                                    id={listing.id}
                                    personaId={listing.persona_id}
                                    personaName={listing.personas.name}
                                    personaImage={listing.personas.image_path}
                                    creatorId={listing.seller_id}
                                    priceAether={listing.price_aether}
                                    totalSales={listing.total_sales}
                                    isLimitedEdition={listing.is_limited_edition}
                                    quantityRemaining={listing.quantity_remaining}
                                    animationIndex={index}
                                    onBuyClick={handleBuyClick}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="rounded-full bg-white/5 p-6">
                                <IconMoodEmpty className="size-16 text-white/30" />
                            </div>
                            <h3 className="mt-6 text-xl font-semibold text-white">
                                No souls found
                            </h3>
                            <p className="mt-2 text-center text-white/50">
                                {searchQuery
                                    ? `No results for "${searchQuery}". Try a different search term.`
                                    : "The marketplace is empty right now. Check back later!"}
                            </p>
                            {searchQuery && (
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchQuery("")}
                                    className="mt-4 border-white/10 text-white hover:bg-white/10"
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Purchase Modal */}
            <PurchaseModal
                isOpen={purchaseModalOpen}
                onClose={() => setPurchaseModalOpen(false)}
                listing={selectedListing}
                userBalance={userBalance}
                onSuccess={handlePurchaseSuccess}
            />
        </div>
    )
}
