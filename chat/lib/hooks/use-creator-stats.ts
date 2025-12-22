"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getWallet, Wallet } from "@/lib/wallet"
import { getListingsBySeller, MarketListingWithPersona } from "@/lib/marketplace"

export interface DailySale {
    date: string
    amount: number
    count: number
}

export interface CreatorStats {
    wallet: Wallet | null
    listings: MarketListingWithPersona[]
    recentSales: DailySale[]
    totalSalesCount: number
    loading: boolean
    error: string | null
}

export function useCreatorStats(userId: string | null) {
    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [listings, setListings] = useState<MarketListingWithPersona[]>([])
    const [recentSales, setRecentSales] = useState<DailySale[]>([])
    const [totalSalesCount, setTotalSalesCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    const fetchStats = useCallback(async () => {
        if (!userId) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Fetch wallet
            const walletData = await getWallet(supabase, userId)
            setWallet(walletData)

            // Fetch listings
            const { data: listingsData, error: listingsError } = await getListingsBySeller(
                supabase,
                userId,
                true // include inactive
            )

            if (listingsError) {
                throw new Error(listingsError)
            }

            setListings(listingsData)

            // Calculate total sales from listings
            const totalSales = listingsData.reduce((sum, listing) => sum + listing.total_sales, 0)
            setTotalSalesCount(totalSales)

            // Generate mock daily sales for the last 7 days
            // In production, this would come from a sales/transactions table
            const dailySales: DailySale[] = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split("T")[0]

                // Distribute total earnings across days (placeholder)
                // Real implementation would query a sales table
                dailySales.push({
                    date: dateStr,
                    amount: Math.floor((walletData?.total_earned || 0) / 7),
                    count: Math.floor(totalSales / 7)
                })
            }
            setRecentSales(dailySales)

        } catch (err) {
            console.error("Error fetching creator stats:", err)
            setError(err instanceof Error ? err.message : "Failed to load stats")
        } finally {
            setLoading(false)
        }
    }, [userId, supabase])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return {
        wallet,
        listings,
        recentSales,
        totalSalesCount,
        loading,
        error,
        refresh: fetchStats
    }
}
