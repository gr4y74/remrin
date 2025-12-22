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
        <div className="min-h-screen bg-[#0d1117] p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="size-6 text-purple-400" />
                            Creator Dashboard
                        </h1>
                        <p className="text-zinc-400">
                            Manage your listings and track your earnings
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={refresh}
                            className="border-white/10 bg-transparent text-white hover:bg-white/5"
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                        >
                            <Plus className="mr-2 size-4" />
                            Create Listing
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Total Earnings */}
                    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-purple-500/20 p-2">
                                <Wallet className="size-5 text-purple-400" />
                            </div>
                            <span className="text-sm text-zinc-400">Total Earnings</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold text-white">
                                {(wallet?.total_earned || 0).toLocaleString()}
                            </span>
                            <span className="ml-2 text-sm text-purple-400">Aether</span>
                        </div>
                    </div>

                    {/* Total Sales */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-500/20 p-2">
                                <ShoppingBag className="size-5 text-green-400" />
                            </div>
                            <span className="text-sm text-zinc-400">Total Sales</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold text-white">
                                {totalSalesCount}
                            </span>
                            <span className="ml-2 text-sm text-zinc-500">souls sold</span>
                        </div>
                    </div>

                    {/* Active Listings */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500/20 p-2">
                                <TrendingUp className="size-5 text-blue-400" />
                            </div>
                            <span className="text-sm text-zinc-400">Active Listings</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold text-white">
                                {activeListings.length}
                            </span>
                            <span className="ml-2 text-sm text-zinc-500">
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
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <h3 className="mb-4 text-sm font-medium text-zinc-400">
                                Recent Sales
                            </h3>
                            {totalSalesCount === 0 ? (
                                <div className="py-8 text-center text-zinc-500">
                                    <ShoppingBag className="mx-auto mb-2 size-8 text-zinc-600" />
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
                                                className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                                            >
                                                <span className="text-sm text-white">
                                                    {listing.personas?.name}
                                                </span>
                                                <span className="text-sm text-purple-400">
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
                    <h2 className="mb-4 text-lg font-semibold text-white">
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
        <div className="min-h-screen bg-[#0d1117] p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 bg-zinc-800" />
                        <Skeleton className="mt-2 h-4 w-64 bg-zinc-800" />
                    </div>
                    <Skeleton className="h-10 w-32 bg-zinc-800" />
                </div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800" />
                    ))}
                </div>

                {/* Chart & activity skeleton */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Skeleton className="h-48 rounded-xl bg-zinc-800 lg:col-span-1" />
                    <Skeleton className="h-48 rounded-xl bg-zinc-800 lg:col-span-2" />
                </div>

                {/* Table skeleton */}
                <Skeleton className="h-64 rounded-xl bg-zinc-800" />
            </div>
        </div>
    )
}
