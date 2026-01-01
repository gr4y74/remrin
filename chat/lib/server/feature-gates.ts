import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type SubscriptionTier = 'wanderer' | 'soul_weaver' | 'architect' | 'titan';

export interface FeatureGate {
    enabled: boolean;
    limit?: number;
    value?: any;
}

export interface TierInfo {
    tier: SubscriptionTier;
    tierIndex: number;
    tierName: string;
}

// Tier hierarchy for comparisons
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
    wanderer: 0,
    soul_weaver: 1,
    architect: 2,
    titan: 3
};

const TIER_NAMES: Record<SubscriptionTier, string> = {
    wanderer: 'Wanderer',
    soul_weaver: 'Soul Weaver',
    architect: 'Architect',
    titan: 'Titan'
};

// Cache for feature definitions (refresh every 5 minutes)
let featureCache: Map<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load feature definitions from database with caching
 */
async function loadFeatureDefinitions(supabase?: SupabaseClient): Promise<Map<string, any>> {
    const now = Date.now();
    if (featureCache && now - cacheTimestamp < CACHE_TTL) {
        return featureCache;
    }

    const client = supabase || createClient(cookies());
    const { data: features } = await client
        .from('tier_features')
        .select('*');

    featureCache = new Map(features?.map(f => [f.feature_key, f]) || []);
    cacheTimestamp = now;

    return featureCache;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(userId: string, supabase?: SupabaseClient): Promise<TierInfo> {
    const client = supabase || createClient(cookies());
    const { data: wallet } = await client
        .from('wallets')
        .select('tier')
        .eq('user_id', userId)
        .single();

    const tier: SubscriptionTier = wallet?.tier || 'wanderer';

    return {
        tier,
        tierIndex: TIER_HIERARCHY[tier],
        tierName: TIER_NAMES[tier]
    };
}

/**
 * Check if a feature is available for a user
 */
export async function checkFeature(
    userId: string,
    featureKey: string,
    supabase?: SupabaseClient
): Promise<FeatureGate> {
    const tierInfo = await getUserTier(userId, supabase);
    const features = await loadFeatureDefinitions(supabase);
    const feature = features.get(featureKey);

    if (!feature) {
        console.warn(`Feature not found: ${featureKey}`);
        return { enabled: false };
    }

    // Check if enabled for this tier
    const enabled = feature[`${tierInfo.tier}_enabled`];
    const limit = feature[`${tierInfo.tier}_limit`];
    const value = feature[`${tierInfo.tier}_value`];

    return { enabled, limit, value };
}

/**
 * Check multiple features at once
 */
export async function checkFeatures(
    userId: string,
    featureKeys: string[],
    supabase?: SupabaseClient
): Promise<Record<string, FeatureGate>> {
    const tierInfo = await getUserTier(userId, supabase);
    const features = await loadFeatureDefinitions(supabase);

    const result: Record<string, FeatureGate> = {};

    for (const key of featureKeys) {
        const feature = features.get(key);
        if (!feature) {
            result[key] = { enabled: false };
            continue;
        }

        result[key] = {
            enabled: feature[`${tierInfo.tier}_enabled`],
            limit: feature[`${tierInfo.tier}_limit`],
            value: feature[`${tierInfo.tier}_value`]
        };
    }

    return result;
}

/**
 * Get all available LLM providers for a user's tier
 */
export async function getAvailableLLMProviders(userId: string, supabase?: SupabaseClient) {
    const tierInfo = await getUserTier(userId, supabase);
    const client = supabase || createClient(cookies());

    const { data: providers } = await client
        .from('llm_providers')
        .select('*')
        .eq('is_active', true)
        .lte('min_tier_index', tierInfo.tierIndex)
        .order('min_tier_index', { ascending: true });

    return providers || [];
}

/**
 * Get user's current LLM provider preference
 */
export async function getUserLLMProvider(userId: string, supabase?: SupabaseClient) {
    const client = supabase || createClient(cookies());

    const { data: wallet } = await client
        .from('wallets')
        .select('preferred_llm_provider, llm_settings')
        .eq('user_id', userId)
        .single();

    const providerKey = wallet?.preferred_llm_provider || 'deepseek';

    // Get provider details
    const { data: provider } = await client
        .from('llm_providers')
        .select('*')
        .eq('provider_key', providerKey)
        .eq('is_active', true)
        .single();

    return {
        provider,
        settings: wallet?.llm_settings || {}
    };
}

/**
 * Update user's LLM provider preference
 */
export async function setUserLLMProvider(
    userId: string,
    providerKey: string,
    settings?: any,
    supabase?: SupabaseClient
) {
    const client = supabase || createClient(cookies());

    // Verify user has access to this provider
    const tierInfo = await getUserTier(userId, client);
    const { data: provider } = await client
        .from('llm_providers')
        .select('min_tier_index')
        .eq('provider_key', providerKey)
        .eq('is_active', true)
        .single();

    if (!provider || provider.min_tier_index > tierInfo.tierIndex) {
        throw new Error('Provider not available for your tier');
    }

    // Update preference
    const updates: any = { preferred_llm_provider: providerKey };
    if (settings) {
        updates.llm_settings = settings;
    }

    const { error } = await client
        .from('wallets')
        .update(updates)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Check if user has reached a usage limit
 */
export async function checkUsageLimit(
    userId: string,
    featureKey: string,
    currentUsage: number,
    supabase?: SupabaseClient
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const gate = await checkFeature(userId, featureKey, supabase);

    if (!gate.enabled) {
        return { allowed: false, limit: 0, remaining: 0 };
    }

    const limit = gate.limit || 999999;
    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage < limit;

    return { allowed, limit, remaining };
}

/**
 * Get all features for a tier (for admin UI)
 */
export async function getAllFeatures(supabase?: SupabaseClient) {
    const features = await loadFeatureDefinitions(supabase);
    return Array.from(features.values());
}

/**
 * Get all LLM providers (for admin UI)
 */
export async function getAllLLMProviders(supabase?: SupabaseClient) {
    const client = supabase || createClient(cookies());
    const { data: providers } = await client
        .from('llm_providers')
        .select('*')
        .order('min_tier_index', { ascending: true });

    return providers || [];
}

/**
 * Invalidate feature cache (call after admin updates)
 */
export function invalidateFeatureCache() {
    featureCache = null;
    cacheTimestamp = 0;
}

/**
 * Manually update a user's tier (admin function)
 */
export async function updateUserTier(
    userId: string,
    newTier: SubscriptionTier,
    reason: string = 'admin_manual',
    adminUserId?: string,
    supabase?: SupabaseClient
) {
    const client = supabase || createClient(cookies());

    const { error } = await client.rpc('update_user_tier', {
        p_user_id: userId,
        p_new_tier: newTier,
        p_reason: reason,
        p_subscription_id: null,
        p_changed_by: adminUserId || null
    });

    if (error) throw error;
}

/**
 * Sync all user tiers with Stripe subscriptions
 */
export async function syncAllUserTiers(supabase?: SupabaseClient) {
    const client = supabase || createClient(cookies());

    const { data, error } = await client.rpc('sync_all_user_tiers');

    if (error) throw error;

    return {
        total: data?.length || 0,
        updated: data?.filter((r: any) => r.old_tier !== r.new_tier) || [],
        unchanged: data?.filter((r: any) => r.old_tier === r.new_tier) || []
    };
}

/**
 * Get tier change history for a user
 */
export async function getTierHistory(userId: string, limit: number = 10, supabase?: SupabaseClient) {
    const client = supabase || createClient(cookies());

    const { data, error } = await client
        .from('tier_change_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return data || [];
}
