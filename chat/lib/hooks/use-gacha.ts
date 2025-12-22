"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface GachaPool {
    id: string
    name: string
    description: string | null
    banner_image: string | null
    is_active: boolean
    start_date: string | null
    end_date: string | null
}

export interface GachaPoolItem {
    id: string
    pool_id: string
    persona_id: string
    rarity: "common" | "rare" | "epic" | "legendary"
    weight: number
    is_featured: boolean
    persona?: {
        id: string
        name: string
        image_url: string | null
        description: string | null
    }
}

export interface PullResult {
    id: string
    user_id: string
    pool_id: string
    persona_id: string
    rarity: "common" | "rare" | "epic" | "legendary"
    pull_number: number
    is_pity: boolean
    aether_spent: number
    pulled_at: string
    is_new: boolean
    persona: {
        id: string
        name: string
        image_url: string | null
        description: string | null
    }
}

export interface PityStatus {
    pulls_since_legendary: number
    pulls_since_rare: number
    total_pulls: number
}

export interface PullHistoryFilters {
    rarity?: "common" | "rare" | "epic" | "legendary"
    poolId?: string
    limit?: number
    offset?: number
}

// Aether cost per pull
export const SINGLE_PULL_COST = 10
export const TEN_PULL_COST = 100

// Rarity colors
export const RARITY_COLORS = {
    common: {
        primary: "rgb(59, 130, 246)", // blue-500
        glow: "rgba(59, 130, 246, 0.6)"
    },
    rare: {
        primary: "rgb(168, 85, 247)", // purple-500
        glow: "rgba(168, 85, 247, 0.6)"
    },
    epic: {
        primary: "rgb(236, 72, 153)", // pink-500
        glow: "rgba(236, 72, 153, 0.6)"
    },
    legendary: {
        primary: "rgb(245, 158, 11)", // amber-500
        glow: "rgba(245, 158, 11, 0.8)"
    }
} as const

export function useGacha(userId: string | null) {
    const [pools, setPools] = useState<GachaPool[]>([])
    const [poolItems, setPoolItems] = useState<Record<string, GachaPoolItem[]>>({})
    const [pullHistory, setPullHistory] = useState<PullResult[]>([])
    const [pityStatus, setPityStatus] = useState<Record<string, PityStatus>>({})
    const [loading, setLoading] = useState(false)
    const [pulling, setPulling] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // Fetch all active pools
    const fetchPools = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from("gacha_pools")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })

            if (fetchError) throw new Error(fetchError.message)
            setPools(data || [])
            return data || []
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch pools"
            setError(message)
            return []
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // Fetch items for a specific pool
    const fetchPoolItems = useCallback(async (poolId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from("gacha_pool_items")
                .select(`
                    *,
                    persona:personas(id, name, image_url, description)
                `)
                .eq("pool_id", poolId)

            if (fetchError) throw new Error(fetchError.message)

            const items = (data || []).map(item => ({
                ...item,
                persona: item.persona
            })) as GachaPoolItem[]

            setPoolItems(prev => ({ ...prev, [poolId]: items }))
            return items
        } catch (err) {
            console.error("Error fetching pool items:", err)
            return []
        }
    }, [supabase])

    // Perform a pull (1 or 10)
    const performPull = useCallback(async (poolId: string, count: 1 | 10): Promise<PullResult[] | null> => {
        if (!userId) {
            setError("You must be logged in to pull")
            return null
        }

        setPulling(true)
        setError(null)

        try {
            const response = await fetch("/api/gacha/pull", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ poolId, count })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Pull failed")
            }

            // Update pity status
            if (result.pity) {
                setPityStatus(prev => ({
                    ...prev,
                    [poolId]: result.pity
                }))
            }

            return result.pulls as PullResult[]
        } catch (err) {
            const message = err instanceof Error ? err.message : "Pull failed"
            setError(message)
            return null
        } finally {
            setPulling(false)
        }
    }, [userId])

    // Fetch pull history
    const fetchHistory = useCallback(async (filters: PullHistoryFilters = {}) => {
        if (!userId) return []

        setLoading(true)
        try {
            let query = supabase
                .from("user_pulls")
                .select(`
                    *,
                    persona:personas(id, name, image_url, description)
                `)
                .eq("user_id", userId)
                .order("pulled_at", { ascending: false })

            if (filters.rarity) {
                query = query.eq("rarity", filters.rarity)
            }
            if (filters.poolId) {
                query = query.eq("pool_id", filters.poolId)
            }
            if (filters.limit) {
                query = query.limit(filters.limit)
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw new Error(fetchError.message)

            const history = (data || []).map(pull => ({
                ...pull,
                is_new: false, // Would need to track in DB
                persona: pull.persona
            })) as PullResult[]

            setPullHistory(history)
            return history
        } catch (err) {
            console.error("Error fetching history:", err)
            return []
        } finally {
            setLoading(false)
        }
    }, [userId, supabase])

    // Get pity status for a pool
    const getPityStatus = useCallback(async (poolId: string): Promise<PityStatus | null> => {
        if (!userId) return null

        try {
            const { data, error: fetchError } = await supabase
                .from("user_pity")
                .select("*")
                .eq("user_id", userId)
                .eq("pool_id", poolId)
                .single()

            if (fetchError && fetchError.code !== "PGRST116") {
                throw new Error(fetchError.message)
            }

            const status: PityStatus = data || {
                pulls_since_legendary: 0,
                pulls_since_rare: 0,
                total_pulls: 0
            }

            setPityStatus(prev => ({ ...prev, [poolId]: status }))
            return status
        } catch (err) {
            console.error("Error fetching pity status:", err)
            return null
        }
    }, [userId, supabase])

    return {
        pools,
        poolItems,
        pullHistory,
        pityStatus,
        loading,
        pulling,
        error,
        fetchPools,
        fetchPoolItems,
        performPull,
        fetchHistory,
        getPityStatus
    }
}
