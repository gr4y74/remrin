import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Tier hierarchy (index 0 = free tier, higher = more premium)
const TIER_LEVELS: Record<string, number> = {
    'wanderer': 0,        // free
    'soul_weaver': 1,     // pro
    'architect': 2,       // premium
    'titan': 3            // enterprise
}

export type SubscriptionTier = 'wanderer' | 'soul_weaver' | 'architect' | 'titan'

/**
 * Check if the current user has premium status (soul_weaver tier or higher)
 */
export async function checkUserPremium(): Promise<boolean> {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Check wallets table for tier (primary source)
    const { data: wallet } = await supabase
        .from('wallets')
        .select('tier')
        .eq('user_id', user.id)
        .single()

    if (wallet?.tier) {
        return TIER_LEVELS[wallet.tier] >= TIER_LEVELS['soul_weaver']
    }

    // Fallback to user_limits table
    const { data: limits } = await supabase
        .from('user_limits')
        .select('tier, is_premium')
        .eq('user_id', user.id)
        .single()

    if (limits?.tier) {
        return TIER_LEVELS[limits.tier] >= TIER_LEVELS['soul_weaver']
    }

    // Legacy fallback to is_premium
    return limits?.is_premium || false
}

/**
 * Get the user's current tier
 */
export async function getUserTier(): Promise<{ tier: SubscriptionTier; userId: string | null }> {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { tier: 'wanderer', userId: null }
    }

    // Check wallets table for tier (primary source)
    const { data: wallet } = await supabase
        .from('wallets')
        .select('tier')
        .eq('user_id', user.id)
        .single()

    if (wallet?.tier) {
        return { tier: wallet.tier as SubscriptionTier, userId: user.id }
    }

    // Fallback to user_limits table
    const { data: limits } = await supabase
        .from('user_limits')
        .select('tier')
        .eq('user_id', user.id)
        .single()

    return {
        tier: (limits?.tier as SubscriptionTier) || 'wanderer',
        userId: user.id
    }
}

/**
 * Check if user has at least the required tier level
 */
export async function requireTier(requiredTier: SubscriptionTier): Promise<{
    hasAccess: boolean
    currentTier: SubscriptionTier
    userId: string | null
}> {
    const { tier, userId } = await getUserTier()
    const hasAccess = TIER_LEVELS[tier] >= TIER_LEVELS[requiredTier]

    return { hasAccess, currentTier: tier, userId }
}
