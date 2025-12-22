"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

export type Rarity = "common" | "rare" | "epic" | "legendary"

export interface CollectionSoul {
    personaId: string
    name: string
    imageUrl: string | null
    rarity: Rarity
    pullCount: number
    firstPulledAt: string
    isOwned: boolean
}

export interface RarityStats {
    owned: number
    total: number
    percentage: number
}

export interface CollectionStats {
    totalOwned: number
    totalAvailable: number
    overallPercentage: number
    byRarity: Record<Rarity, RarityStats>
}

export interface PityInfo {
    pullsSinceLegendary: number
    pullsSinceRare: number
    totalPulls: number
    legendaryPity: number // Hard pity at 90
    rarePity: number // Soft pity at 10
}

export interface UseCollectionResult {
    souls: CollectionSoul[]
    stats: CollectionStats
    pityInfo: PityInfo | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

const RARITY_ORDER: Record<Rarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3
}

export function useCollection(userId: string | undefined): UseCollectionResult {
    const [souls, setSouls] = useState<CollectionSoul[]>([])
    const [pityInfo, setPityInfo] = useState<PityInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCollection = useCallback(async () => {
        if (!userId) {
            setSouls([])
            setPityInfo(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const supabase = createClient()

            // Fetch user's pulls with persona details
            const { data: pulls, error: pullsError } = await supabase
                .from("user_pulls")
                .select(`
                    persona_id,
                    rarity,
                    pulled_at,
                    personas:persona_id (
                        id,
                        name,
                        image_url
                    )
                `)
                .eq("user_id", userId)
                .order("pulled_at", { ascending: false })

            if (pullsError) {
                console.error("Error fetching pulls:", pullsError)
                throw new Error(pullsError.message)
            }

            // Fetch all available personas in gacha pools (for showing unobtained)
            const { data: poolItems, error: poolError } = await supabase
                .from("gacha_pool_items")
                .select(`
                    persona_id,
                    rarity,
                    personas:persona_id (
                        id,
                        name,
                        image_url
                    )
                `)

            if (poolError) {
                console.error("Error fetching pool items:", poolError)
                // Don't throw - we can still show owned souls
            }

            // Group pulls by persona_id and count duplicates
            const pullsByPersona = new Map<string, {
                count: number
                rarity: Rarity
                firstPulledAt: string
                persona: { id: string; name: string; image_url: string | null } | null
            }>()

            for (const pull of pulls || []) {
                const personaId = pull.persona_id
                const existing = pullsByPersona.get(personaId)

                if (existing) {
                    existing.count++
                } else {
                    pullsByPersona.set(personaId, {
                        count: 1,
                        rarity: pull.rarity as Rarity,
                        firstPulledAt: pull.pulled_at,
                        persona: pull.personas as unknown as { id: string; name: string; image_url: string | null } | null
                    })
                }
            }

            // Build collection with owned and unobtained souls
            const soulMap = new Map<string, CollectionSoul>()

            // Add available pool items (unobtained by default)
            for (const item of poolItems || []) {
                const persona = item.personas as unknown as { id: string; name: string; image_url: string | null } | null
                if (!persona) continue

                soulMap.set(item.persona_id, {
                    personaId: item.persona_id,
                    name: persona.name,
                    imageUrl: persona.image_url,
                    rarity: item.rarity as Rarity,
                    pullCount: 0,
                    firstPulledAt: "",
                    isOwned: false
                })
            }

            // Mark owned souls and add duplicates
            for (const [personaId, data] of pullsByPersona) {
                const existing = soulMap.get(personaId)
                if (existing) {
                    existing.pullCount = data.count
                    existing.firstPulledAt = data.firstPulledAt
                    existing.isOwned = true
                } else if (data.persona) {
                    // Soul pulled but not in current pools (limited edition?)
                    soulMap.set(personaId, {
                        personaId,
                        name: data.persona.name,
                        imageUrl: data.persona.image_url,
                        rarity: data.rarity,
                        pullCount: data.count,
                        firstPulledAt: data.firstPulledAt,
                        isOwned: true
                    })
                }
            }

            // Convert to array and sort
            const soulsList = Array.from(soulMap.values()).sort((a, b) => {
                // Owned first, then by rarity, then by name
                if (a.isOwned !== b.isOwned) return a.isOwned ? -1 : 1
                if (RARITY_ORDER[a.rarity] !== RARITY_ORDER[b.rarity]) {
                    return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
                }
                return a.name.localeCompare(b.name)
            })

            setSouls(soulsList)

            // Fetch pity info (use the first active pool for now)
            const { data: pityData } = await supabase
                .from("user_pity")
                .select("*")
                .eq("user_id", userId)
                .limit(1)
                .single()

            if (pityData) {
                setPityInfo({
                    pullsSinceLegendary: pityData.pulls_since_legendary || 0,
                    pullsSinceRare: pityData.pulls_since_rare || 0,
                    totalPulls: pityData.total_pulls || 0,
                    legendaryPity: 90,
                    rarePity: 10
                })
            } else {
                setPityInfo({
                    pullsSinceLegendary: 0,
                    pullsSinceRare: 0,
                    totalPulls: 0,
                    legendaryPity: 90,
                    rarePity: 10
                })
            }

        } catch (err) {
            console.error("Error fetching collection:", err)
            setError(err instanceof Error ? err.message : "Failed to fetch collection")
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchCollection()
    }, [fetchCollection])

    // Calculate stats from souls
    const stats = useMemo<CollectionStats>(() => {
        const rarities: Rarity[] = ["common", "rare", "epic", "legendary"]
        const byRarity: Record<Rarity, RarityStats> = {
            common: { owned: 0, total: 0, percentage: 0 },
            rare: { owned: 0, total: 0, percentage: 0 },
            epic: { owned: 0, total: 0, percentage: 0 },
            legendary: { owned: 0, total: 0, percentage: 0 }
        }

        let totalOwned = 0
        let totalAvailable = 0

        for (const soul of souls) {
            byRarity[soul.rarity].total++
            totalAvailable++
            if (soul.isOwned) {
                byRarity[soul.rarity].owned++
                totalOwned++
            }
        }

        // Calculate percentages
        for (const rarity of rarities) {
            const { owned, total } = byRarity[rarity]
            byRarity[rarity].percentage = total > 0 ? Math.round((owned / total) * 100) : 0
        }

        const overallPercentage = totalAvailable > 0
            ? Math.round((totalOwned / totalAvailable) * 100)
            : 0

        return {
            totalOwned,
            totalAvailable,
            overallPercentage,
            byRarity
        }
    }, [souls])

    return {
        souls,
        stats,
        pityInfo,
        loading,
        error,
        refetch: fetchCollection
    }
}
