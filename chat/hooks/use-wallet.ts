"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Wallet, getWallet, ensureWallet } from "@/lib/wallet"

interface UseWalletResult {
    wallet: Wallet | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useWallet(userId: string | undefined): UseWalletResult {
    const [wallet, setWallet] = useState<Wallet | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchWallet = useCallback(async () => {
        if (!userId) {
            setWallet(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const supabase = createClient()
            let walletData = await getWallet(supabase, userId)

            // Create wallet if it doesn't exist
            if (!walletData) {
                walletData = await ensureWallet(supabase, userId)
            }

            setWallet(walletData)
        } catch (err) {
            console.error("Error fetching wallet:", err)
            setError(err instanceof Error ? err.message : "Failed to fetch wallet")
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchWallet()
    }, [fetchWallet])

    return {
        wallet,
        loading,
        error,
        refetch: fetchWallet
    }
}
