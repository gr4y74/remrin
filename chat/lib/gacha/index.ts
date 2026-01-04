import { SupabaseClient } from "@supabase/supabase-js"
import { deductBalance, getWallet } from "@/lib/wallet"

// ============================================
// TYPES
// ============================================

export interface GachaPool {
    id: string
    name: string
    description: string | null
    banner_image: string | null
    is_active: boolean
    start_date: string | null
    end_date: string | null
    created_at: string
    updated_at: string
}

export interface GachaPoolItem {
    id: string
    pool_id: string
    persona_id: string
    rarity: Rarity
    weight: number
    is_featured: boolean
    created_at: string
    personas?: {
        id: string
        name: string
        description: string
        image_url: string | null
    }
}

export interface UserPull {
    id: string
    user_id: string
    pool_id: string
    persona_id: string
    rarity: Rarity
    pull_number: number
    is_pity: boolean
    aether_spent: number
    pulled_at: string
    personas?: {
        id: string
        name: string
        description: string
        image_url: string | null
    }
}

export interface UserPity {
    user_id: string
    pool_id: string
    pulls_since_legendary: number
    pulls_since_rare: number
    total_pulls: number
    updated_at: string
}

export interface PullResult {
    persona_id: string
    rarity: Rarity
    is_pity: boolean
    is_new: boolean
    personas: {
        id: string
        name: string
        description: string
        image_url: string | null
    }
}

export type Rarity = "common" | "rare" | "epic" | "legendary"

// ============================================
// CONSTANTS
// ============================================

export const PULL_COST_SINGLE = 10
export const PULL_COST_MULTI = 90 // 10-pull discount

// Base rates (out of 10000 for precision)
export const RARITY_RATES: Record<Rarity, number> = {
    common: 8000,     // 80%
    rare: 1500,       // 15%
    epic: 450,        // 4.5%
    legendary: 50     // 0.5%
}

// Pity thresholds
export const SOFT_PITY_RARE = 8      // After 8 pulls without rare, increase rate
export const HARD_PITY_RARE = 10     // Guaranteed rare at 10 pulls
export const SOFT_PITY_LEGENDARY = 75 // Boost legendary rate after 75 pulls
export const HARD_PITY_LEGENDARY = 90 // Guaranteed legendary at 90 pulls

// ============================================
// POOL FUNCTIONS
// ============================================

/**
 * Fetch all active gacha pools
 */
export async function getActivePools(
    supabase: SupabaseClient
): Promise<{ data: GachaPool[]; error: string | null }> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from("gacha_pools")
        .select("*")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gt.${now}`)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching gacha pools:", error)
        return { data: [], error: error.message }
    }

    return { data: data as GachaPool[], error: null }
}

/**
 * Get a single pool by ID with featured items
 */
export async function getPoolById(
    supabase: SupabaseClient,
    poolId: string
): Promise<{ data: GachaPool | null; error: string | null }> {
    const { data, error } = await supabase
        .from("gacha_pools")
        .select("*")
        .eq("id", poolId)
        .single()

    if (error) {
        console.error("Error fetching pool:", error)
        return { data: null, error: error.message }
    }

    return { data: data as GachaPool, error: null }
}

/**
 * Get items in a pool with persona details
 */
export async function getPoolItems(
    supabase: SupabaseClient,
    poolId: string
): Promise<{ data: GachaPoolItem[]; error: string | null }> {
    const { data, error } = await supabase
        .from("gacha_pool_items")
        .select(`
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_url
            )
        `)
        .eq("pool_id", poolId)
        .order("rarity", { ascending: false })
        .order("is_featured", { ascending: false })

    if (error) {
        console.error("Error fetching pool items:", error)
        return { data: [], error: error.message }
    }

    return { data: data as GachaPoolItem[], error: null }
}

/**
 * Get featured items for a pool (for banner display)
 */
export async function getFeaturedItems(
    supabase: SupabaseClient,
    poolId: string
): Promise<{ data: GachaPoolItem[]; error: string | null }> {
    const { data, error } = await supabase
        .from("gacha_pool_items")
        .select(`
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_url
            )
        `)
        .eq("pool_id", poolId)
        .eq("is_featured", true)
        .order("rarity", { ascending: false })

    if (error) {
        console.error("Error fetching featured items:", error)
        return { data: [], error: error.message }
    }

    return { data: data as GachaPoolItem[], error: null }
}

// ============================================
// PITY FUNCTIONS
// ============================================

/**
 * Get user's pity counter for a pool
 */
export async function getUserPity(
    supabase: SupabaseClient,
    userId: string,
    poolId: string
): Promise<{ data: UserPity | null; error: string | null }> {
    const { data, error } = await supabase
        .from("user_pity")
        .select("*")
        .eq("user_id", userId)
        .eq("pool_id", poolId)
        .single()

    if (error && error.code !== "PGRST116") {
        console.error("Error fetching pity:", error)
        return { data: null, error: error.message }
    }

    // Return default pity if not found
    if (!data) {
        return {
            data: {
                user_id: userId,
                pool_id: poolId,
                pulls_since_legendary: 0,
                pulls_since_rare: 0,
                total_pulls: 0,
                updated_at: new Date().toISOString()
            },
            error: null
        }
    }

    return { data: data as UserPity, error: null }
}

/**
 * Update pity counters after a pull
 */
async function updatePity(
    supabase: SupabaseClient,
    userId: string,
    poolId: string,
    rarity: Rarity,
    pullCount: number
): Promise<void> {
    // Get current pity
    const { data: currentPity } = await getUserPity(supabase, userId, poolId)

    let pullsSinceLegendary = (currentPity?.pulls_since_legendary || 0) + pullCount
    let pullsSinceRare = (currentPity?.pulls_since_rare || 0) + pullCount
    const totalPulls = (currentPity?.total_pulls || 0) + pullCount

    // Reset counters based on rarity pulled
    if (rarity === "legendary") {
        pullsSinceLegendary = 0
        pullsSinceRare = 0
    } else if (rarity === "epic" || rarity === "rare") {
        pullsSinceRare = 0
    }

    // Upsert pity record
    await supabase
        .from("user_pity")
        .upsert({
            user_id: userId,
            pool_id: poolId,
            pulls_since_legendary: pullsSinceLegendary,
            pulls_since_rare: pullsSinceRare,
            total_pulls: totalPulls
        })
}

// ============================================
// PULL FUNCTIONS
// ============================================

/**
 * Calculate rarity for a pull based on rates and pity
 */
function calculateRarity(pity: UserPity): { rarity: Rarity; isPity: boolean } {
    const roll = Math.random() * 10000

    // Check hard pity first
    if (pity.pulls_since_legendary >= HARD_PITY_LEGENDARY - 1) {
        return { rarity: "legendary", isPity: true }
    }
    if (pity.pulls_since_rare >= HARD_PITY_RARE - 1) {
        return { rarity: "rare", isPity: true }
    }

    // Calculate boosted rates for soft pity
    let legendaryRate = RARITY_RATES.legendary
    let rareRate = RARITY_RATES.rare

    // Soft pity for legendary (boost rate by 6% per pull after 75)
    if (pity.pulls_since_legendary >= SOFT_PITY_LEGENDARY) {
        const extraPulls = pity.pulls_since_legendary - SOFT_PITY_LEGENDARY + 1
        legendaryRate += extraPulls * 600 // +6% per pull
    }

    // Soft pity for rare (boost rate after 8 pulls)
    if (pity.pulls_since_rare >= SOFT_PITY_RARE) {
        const extraPulls = pity.pulls_since_rare - SOFT_PITY_RARE + 1
        rareRate += extraPulls * 500 // +5% per pull
    }

    // Determine rarity based on roll
    let cumulative = 0

    cumulative += legendaryRate
    if (roll < cumulative) {
        return { rarity: "legendary", isPity: false }
    }

    cumulative += RARITY_RATES.epic
    if (roll < cumulative) {
        return { rarity: "epic", isPity: false }
    }

    cumulative += rareRate
    if (roll < cumulative) {
        return { rarity: "rare", isPity: false }
    }

    return { rarity: "common", isPity: false }
}

/**
 * Select a random persona from pool items of a specific rarity
 */
function selectPersonaFromRarity(
    items: GachaPoolItem[],
    rarity: Rarity
): GachaPoolItem | null {
    const itemsOfRarity = items.filter(item => item.rarity === rarity)

    if (itemsOfRarity.length === 0) {
        // Fallback to any item if rarity not found
        return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null
    }

    // Weighted random selection
    const totalWeight = itemsOfRarity.reduce((sum, item) => sum + item.weight, 0)
    let roll = Math.random() * totalWeight

    for (const item of itemsOfRarity) {
        roll -= item.weight
        if (roll <= 0) {
            return item
        }
    }

    return itemsOfRarity[0]
}

/**
 * Perform gacha pulls
 */
export async function performPull(
    supabase: SupabaseClient,
    userId: string,
    poolId: string,
    count: 1 | 10
): Promise<{ data: PullResult[]; error: string | null; aetherSpent: number }> {
    // Calculate cost
    const cost = count === 10 ? PULL_COST_MULTI : PULL_COST_SINGLE * count

    // Check wallet balance
    const wallet = await getWallet(supabase, userId)
    if (!wallet) {
        return { data: [], error: "Wallet not found", aetherSpent: 0 }
    }
    if (wallet.balance_aether < cost) {
        return { data: [], error: "Insufficient Aether balance", aetherSpent: 0 }
    }

    // Verify pool exists and is active
    const { data: pool, error: poolError } = await getPoolById(supabase, poolId)
    if (poolError || !pool) {
        return { data: [], error: "Pool not found or inactive", aetherSpent: 0 }
    }

    // Get pool items
    const { data: items, error: itemsError } = await getPoolItems(supabase, poolId)
    if (itemsError || items.length === 0) {
        return { data: [], error: "No items in pool", aetherSpent: 0 }
    }

    // Get current pity
    const { data: pity } = await getUserPity(supabase, userId, poolId)
    if (!pity) {
        return { data: [], error: "Failed to get pity data", aetherSpent: 0 }
    }

    // Deduct balance
    const deductResult = await deductBalance(supabase, userId, cost)
    if (!deductResult.success) {
        return { data: [], error: deductResult.error || "Failed to deduct balance", aetherSpent: 0 }
    }

    // Perform pulls
    const results: PullResult[] = []
    let currentPity = { ...pity }

    for (let i = 0; i < count; i++) {
        // Calculate rarity for this pull
        const { rarity, isPity } = calculateRarity(currentPity)

        // Select persona
        const selectedItem = selectPersonaFromRarity(items, rarity)
        if (!selectedItem || !selectedItem.personas) {
            continue
        }

        // Update local pity tracking for next pull
        currentPity.pulls_since_legendary++
        currentPity.pulls_since_rare++
        currentPity.total_pulls++

        if (rarity === "legendary") {
            currentPity.pulls_since_legendary = 0
            currentPity.pulls_since_rare = 0
        } else if (rarity === "epic" || rarity === "rare") {
            currentPity.pulls_since_rare = 0
        }

        // Record pull
        const pullCost = count === 10 ? 9 : 10 // Discounted per-pull cost for 10-pull
        await supabase.from("user_pulls").insert({
            user_id: userId,
            pool_id: poolId,
            persona_id: selectedItem.persona_id,
            rarity,
            pull_number: i + 1,
            is_pity: isPity,
            aether_spent: pullCost
        })

        results.push({
            persona_id: selectedItem.persona_id,
            rarity,
            is_pity: isPity,
            is_new: true, // Could be enhanced to check if user already has this persona
            personas: selectedItem.personas
        })

        // Update pity counters in DB
        await updatePity(supabase, userId, poolId, rarity, 1)

        // Grant ownership (Follow)
        await supabase.from("character_follows").upsert({
            user_id: userId,
            persona_id: selectedItem.persona_id,
            followed_at: new Date().toISOString()
        })
    }

    return { data: results, error: null, aetherSpent: cost }
}

// ============================================
// HISTORY FUNCTIONS
// ============================================

/**
 * Get user's pull history
 */
export async function getPullHistory(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ data: UserPull[]; error: string | null }> {
    const { data, error } = await supabase
        .from("user_pulls")
        .select(`
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_url
            )
        `)
        .eq("user_id", userId)
        .order("pulled_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error("Error fetching pull history:", error)
        return { data: [], error: error.message }
    }

    return { data: data as UserPull[], error: null }
}

/**
 * Get pull history for a specific pool
 */
export async function getPoolPullHistory(
    supabase: SupabaseClient,
    userId: string,
    poolId: string,
    limit: number = 50
): Promise<{ data: UserPull[]; error: string | null }> {
    const { data, error } = await supabase
        .from("user_pulls")
        .select(`
            *,
            personas:persona_id (
                id,
                name,
                description,
                image_url
            )
        `)
        .eq("user_id", userId)
        .eq("pool_id", poolId)
        .order("pulled_at", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("Error fetching pool pull history:", error)
        return { data: [], error: error.message }
    }

    return { data: data as UserPull[], error: null }
}

/**
 * Get pull statistics for a user
 */
export async function getPullStats(
    supabase: SupabaseClient,
    userId: string
): Promise<{
    data: {
        totalPulls: number
        totalSpent: number
        byRarity: Record<Rarity, number>
    } | null
    error: string | null
}> {
    const { data, error } = await supabase
        .from("user_pulls")
        .select("rarity, aether_spent")
        .eq("user_id", userId)

    if (error) {
        console.error("Error fetching pull stats:", error)
        return { data: null, error: error.message }
    }

    const stats = {
        totalPulls: data.length,
        totalSpent: data.reduce((sum, pull) => sum + (pull.aether_spent || 0), 0),
        byRarity: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        } as Record<Rarity, number>
    }

    for (const pull of data) {
        if (pull.rarity in stats.byRarity) {
            stats.byRarity[pull.rarity as Rarity]++
        }
    }

    return { data: stats, error: null }
}
