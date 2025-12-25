"use client"

import { useState } from "react"
import { useCreatorStats } from "@/lib/hooks/use-creator-stats"
import { EarningsChart } from "./EarningsChart"
import { ListingManager } from "./ListingManager"
import { CreateListingModal } from "./CreateListingModal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Wallet,
    TrendingUp,
    ShoppingBag,
    Plus,
    RefreshCw,
    Sparkles
} from "lucide-react"

interface CreatorDashboardProps {
    userId: string
}

export function CreatorDashboard({ userId }: CreatorDashboardProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const { wallet, listings, recentSales, totalSalesCount, loading, refresh } =
        useCreatorStats(userId)

    if (loading) {
        return <DashboardSkeleton />
    }

    const activeListings = listings.filter((l) => l.is_active)

    return (
        <div className="bg-rp-base min-h-screen p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-rp-text flex items-center gap-2 text-2xl font-bold">
                            <Sparkles className="text-rp-iris size-6" />
                            Creator Dashboard
                        </h1>
                        <p className="text-rp-subtle">
                            Manage your listings and track your earnings
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={refresh}
                            className="border-rp-muted/20 text-rp-text hover:bg-rp-surface bg-transparent"
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="from-rp-iris to-rp-rose text-rp-base hover:from-rp-iris/80 hover:to-rp-rose/80 bg-gradient-to-r"
                        >
                            <Plus className="mr-2 size-4" />
                            Create Listing
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Total Earnings */}
                    <div className="border-rp-iris/20 from-rp-iris/20 to-rp-rose/20 rounded-xl border bg-gradient-to-br p-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-rp-iris/20 rounded-lg p-2">
                                <Wallet className="text-rp-iris size-5" />
                            </div>
                            <span className="text-rp-subtle text-sm">Total Earnings</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-rp-text text-3xl font-bold">
                                {(wallet?.total_earned || 0).toLocaleString()}
                            </span>
                            <span className="text-rp-iris ml-2 text-sm">Aether</span>
                        </div>
                    </div>

                    {/* Total Sales */}
                    <div className="border-rp-muted/20 bg-rp-surface rounded-xl border p-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-rp-foam/20 rounded-lg p-2">
                                <ShoppingBag className="text-rp-foam size-5" />
                            </div>
                            <span className="text-rp-subtle text-sm">Total Sales</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-rp-text text-3xl font-bold">
                                {totalSalesCount}
                            </span>
                            <span className="text-rp-muted ml-2 text-sm">souls sold</span>
                        </div>
                    </div>

                    {/* Active Listings */}
                    <div className="border-rp-muted/20 bg-rp-surface rounded-xl border p-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-rp-pine/20 rounded-lg p-2">
                                <TrendingUp className="text-rp-pine size-5" />
                            </div>
                            <span className="text-rp-subtle text-sm">Active Listings</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-rp-text text-3xl font-bold">
                                {activeListings.length}
                            </span>
                            <span className="text-rp-muted ml-2 text-sm">
                                of {listings.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chart & Listings Row */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Earnings Chart */}
                    <div className="lg:col-span-1">
                        <EarningsChart data={recentSales} />
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="border-rp-muted/20 bg-rp-surface rounded-xl border p-4">
                            <h3 className="text-rp-muted mb-4 text-sm font-medium">
                                Recent Sales
                            </h3>
                            {totalSalesCount === 0 ? (
                                <div className="text-rp-muted py-8 text-center">
                                    <ShoppingBag className="text-rp-muted/50 mx-auto mb-2 size-8" />
                                    <p>No sales yet. Your first sale is coming!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {listings
                                        .filter((l) => l.total_sales > 0)
                                        .slice(0, 5)
                                        .map((listing) => (
                                            <div
                                                key={listing.id}
                                                className="bg-rp-overlay flex items-center justify-between rounded-lg p-3"
                                            >
                                                <span className="text-rp-text text-sm">
                                                    {listing.personas?.name}
                                                </span>
                                                <span className="text-rp-iris text-sm">
                                                    {listing.total_sales} sold
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Listings Table */}
                <div>
                    <h2 className="text-rp-text mb-4 text-lg font-semibold">
                        Your Listings
                    </h2>
                    <ListingManager
                        listings={listings}
                        userId={userId}
                        onRefresh={refresh}
                    />
                </div>
            </div>

            {/* Create Listing Modal */}
            <CreateListingModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                userId={userId}
                onSuccess={refresh}
            />
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="bg-rp-base min-h-screen p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="bg-rp-surface h-8 w-48" />
                        <Skeleton className="bg-rp-surface mt-2 h-4 w-64" />
                    </div>
                    <Skeleton className="bg-rp-surface h-10 w-32" />
                </div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="bg-rp-surface h-32 rounded-xl" />
                    ))}
                </div>

                {/* Chart & activity skeleton */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Skeleton className="bg-rp-surface h-48 rounded-xl lg:col-span-1" />
                    <Skeleton className="bg-rp-surface h-48 rounded-xl lg:col-span-2" />
                </div>

                {/* Table skeleton */}
                <Skeleton className="bg-rp-surface h-64 rounded-xl" />
            </div>
        </div>
    )
}
