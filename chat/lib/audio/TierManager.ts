/**
 * TierManager
 * 
 * Centralized tier management for audio access control.
 * Manages user tier permissions, provider access, and quotas.
 * 
 * Features:
 * - Tier-based provider access control
 * - Daily character quota management
 * - Grace period handling
 * - Quota reset scheduling
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { SubscriptionTier, getUserTier } from '@/lib/check-premium';
import { VoiceProvider } from '@/types/audio';

// ============================================================================
// Types
// ============================================================================

export type AudioTier = 'free' | 'premium' | 'vip';

export interface TierDefinition {
    /** Display name */
    name: string;
    /** Allowed providers */
    providers: VoiceProvider[];
    /** Daily character limit (-1 = unlimited) */
    dailyCharLimit: number;
    /** Grace period characters after limit reached */
    graceCharacters: number;
    /** Description */
    description: string;
}

export interface QuotaStatus {
    /** User's tier */
    tier: AudioTier;
    /** Characters used today */
    used: number;
    /** Daily limit */
    limit: number;
    /** Remaining characters */
    remaining: number;
    /** Whether limit is exceeded */
    exceeded: boolean;
    /** Whether in grace period */
    inGracePeriod: boolean;
    /** Grace characters remaining */
    graceRemaining: number;
    /** When quota resets (UTC) */
    resetDate: Date;
    /** Percentage used (0-100) */
    percentUsed: number;
}

export interface ProviderAccess {
    /** Provider name */
    provider: VoiceProvider;
    /** Whether accessible */
    accessible: boolean;
    /** Reason if not accessible */
    reason?: string;
}

// ============================================================================
// Tier Definitions
// ============================================================================

export const TIER_DEFINITIONS: Record<AudioTier, TierDefinition> = {
    free: {
        name: 'Free',
        providers: ['edge'],
        dailyCharLimit: 10000,
        graceCharacters: 500,
        description: 'Edge TTS only, 10k characters/day',
    },
    premium: {
        name: 'Premium',
        providers: ['edge', 'kokoro', 'elevenlabs'],
        dailyCharLimit: 100000,
        graceCharacters: 5000,
        description: 'All providers, 100k characters/day',
    },
    vip: {
        name: 'VIP',
        providers: ['edge', 'kokoro', 'elevenlabs'],
        dailyCharLimit: -1, // Unlimited
        graceCharacters: 0,
        description: 'Unlimited access to all providers',
    },
};

// Map subscription tiers to audio tiers
const SUBSCRIPTION_TO_AUDIO_TIER: Record<SubscriptionTier, AudioTier> = {
    wanderer: 'free',
    soul_weaver: 'premium',
    architect: 'premium',
    titan: 'vip',
};

// ============================================================================
// TierManager Class
// ============================================================================

export class TierManager {
    private static instance: TierManager | null = null;

    private constructor() { }

    /**
     * Get singleton instance
     */
    static getInstance(): TierManager {
        if (!TierManager.instance) {
            TierManager.instance = new TierManager();
        }
        return TierManager.instance;
    }

    /**
     * Get audio tier from subscription tier
     */
    getAudioTier(subscriptionTier: SubscriptionTier): AudioTier {
        return SUBSCRIPTION_TO_AUDIO_TIER[subscriptionTier] || 'free';
    }

    /**
     * Get tier definition
     */
    getTierDefinition(tier: AudioTier): TierDefinition {
        return TIER_DEFINITIONS[tier];
    }

    /**
     * Check if user can use a specific provider
     * @param userId - User ID
     * @param provider - Voice provider
     * @returns Whether user can use the provider
     */
    async canUseProvider(userId: string, provider: VoiceProvider): Promise<boolean> {
        const { tier: subscriptionTier } = await getUserTier();
        const audioTier = this.getAudioTier(subscriptionTier);
        const tierDef = TIER_DEFINITIONS[audioTier];

        return tierDef.providers.includes(provider);
    }

    /**
     * Get available providers for a user
     * @param userId - User ID
     * @returns List of accessible providers
     */
    async getAvailableProviders(userId: string): Promise<VoiceProvider[]> {
        const { tier: subscriptionTier } = await getUserTier();
        const audioTier = this.getAudioTier(subscriptionTier);
        const tierDef = TIER_DEFINITIONS[audioTier];

        return tierDef.providers;
    }

    /**
     * Get detailed provider access for a user
     * @param userId - User ID
     * @returns List of all providers with access status
     */
    async getProviderAccess(userId: string): Promise<ProviderAccess[]> {
        const { tier: subscriptionTier } = await getUserTier();
        const audioTier = this.getAudioTier(subscriptionTier);
        const tierDef = TIER_DEFINITIONS[audioTier];

        const allProviders: VoiceProvider[] = ['edge', 'kokoro', 'elevenlabs'];

        return allProviders.map(provider => ({
            provider,
            accessible: tierDef.providers.includes(provider),
            reason: tierDef.providers.includes(provider)
                ? undefined
                : `Requires ${this.getMinimumTierForProvider(provider).name} tier or higher`,
        }));
    }

    /**
     * Get minimum tier required for a provider
     */
    private getMinimumTierForProvider(provider: VoiceProvider): TierDefinition {
        if (provider === 'edge') return TIER_DEFINITIONS.free;
        return TIER_DEFINITIONS.premium;
    }

    /**
     * Get remaining quota for a user
     * @param userId - User ID
     * @returns Remaining character quota
     */
    async getRemainingQuota(userId: string): Promise<number> {
        const status = await this.getQuotaStatus(userId);
        return status.remaining;
    }

    /**
     * Check if user has enough quota for a generation
     * @param userId - User ID
     * @param charCount - Characters to generate
     * @returns Whether user has enough quota
     */
    async checkQuota(userId: string, charCount: number): Promise<boolean> {
        const status = await this.getQuotaStatus(userId);

        // VIP tier has unlimited
        if (status.limit === -1) return true;

        // Check if within limit or grace period
        const totalAllowed = status.limit + (status.inGracePeriod ? status.graceRemaining : (TIER_DEFINITIONS[status.tier].graceCharacters));
        const willUse = status.used + charCount;

        return willUse <= totalAllowed;
    }

    /**
     * Get full quota status for a user
     * @param userId - User ID
     * @returns Complete quota status
     */
    async getQuotaStatus(userId: string): Promise<QuotaStatus> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Get user's tier
        const { tier: subscriptionTier } = await getUserTier();
        const audioTier = this.getAudioTier(subscriptionTier);
        const tierDef = TIER_DEFINITIONS[audioTier];

        // Get today's usage
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const { data: usageData, error } = await supabase
            .from('audio_generations')
            .select('chars_count')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString());

        if (error) {
            console.error('[TierManager] Failed to get usage:', error);
        }

        const used = usageData?.reduce((sum, row) => sum + (row.chars_count || 0), 0) || 0;
        const limit = tierDef.dailyCharLimit;

        // Calculate status
        const exceeded = limit !== -1 && used >= limit;
        const inGracePeriod = exceeded && used < (limit + tierDef.graceCharacters);
        const graceRemaining = inGracePeriod
            ? (limit + tierDef.graceCharacters) - used
            : tierDef.graceCharacters;

        const remaining = limit === -1
            ? Infinity
            : Math.max(0, limit - used);

        const percentUsed = limit === -1
            ? 0
            : Math.min(100, Math.round((used / limit) * 100));

        return {
            tier: audioTier,
            used,
            limit,
            remaining,
            exceeded,
            inGracePeriod,
            graceRemaining: exceeded ? graceRemaining : tierDef.graceCharacters,
            resetDate: tomorrow,
            percentUsed,
        };
    }

    /**
     * Track audio generation usage
     * @param userId - User ID
     * @param charCount - Characters generated
     * @param provider - Provider used
     * @param voiceId - Voice ID used
     */
    async trackUsage(
        userId: string,
        charCount: number,
        provider: VoiceProvider,
        voiceId: string
    ): Promise<void> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.from('audio_generations').insert({
            user_id: userId,
            provider,
            voice_id: voiceId,
            chars_count: charCount,
        });

        if (error) {
            console.error('[TierManager] Failed to track usage:', error);
        } else {
            console.log(`[TierManager] Tracked usage: ${charCount} chars for user ${userId}`);
        }
    }

    /**
     * Reset daily quotas (called by cron job)
     * This is a no-op as quotas are calculated dynamically based on date
     */
    async resetDailyQuotas(): Promise<{ success: boolean; message: string }> {
        // Quotas are automatically reset because we filter by date
        // This method exists for explicit cron job calls if needed
        console.log('[TierManager] Daily quotas reset (dynamic calculation)');
        return {
            success: true,
            message: 'Quotas are calculated dynamically based on UTC date',
        };
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get TierManager singleton instance
 */
export function getTierManager(): TierManager {
    return TierManager.getInstance();
}

/**
 * Quick check if user can use provider
 */
export async function canUseProvider(userId: string, provider: VoiceProvider): Promise<boolean> {
    return getTierManager().canUseProvider(userId, provider);
}

/**
 * Quick check if user has quota
 */
export async function checkQuota(userId: string, charCount: number): Promise<boolean> {
    return getTierManager().checkQuota(userId, charCount);
}

/**
 * Get available providers for user
 */
export async function getAvailableProviders(userId: string): Promise<VoiceProvider[]> {
    return getTierManager().getAvailableProviders(userId);
}

/**
 * Get remaining quota for user
 */
export async function getRemainingQuota(userId: string): Promise<number> {
    return getTierManager().getRemainingQuota(userId);
}

/**
 * Get full quota status
 */
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
    return getTierManager().getQuotaStatus(userId);
}

export default TierManager;
