
import { SubscriptionTier, checkUserPremium, getUserTier } from '@/lib/check-premium';

export interface AudioTierLimits {
    canUseKokoro: boolean;
    canUseElevenLabs: boolean;
    canCloneVoices: boolean;
    maxClonedVoices: number;
    monthlyGenerationLimit: number;
    maxStorageMB: number;
}

export const AUDIO_TIER_LIMITS: Record<SubscriptionTier, AudioTierLimits> = {
    'wanderer': {
        canUseKokoro: false,
        canUseElevenLabs: false,
        canCloneVoices: false,
        maxClonedVoices: 0,
        monthlyGenerationLimit: 50,
        maxStorageMB: 50
    },
    'soul_weaver': { // Pro
        canUseKokoro: false, // Kokoro is high compute, maybe Architect+?
        canUseElevenLabs: false,
        canCloneVoices: false,
        maxClonedVoices: 0,
        monthlyGenerationLimit: 500,
        maxStorageMB: 500
    },
    'architect': { // Premium
        canUseKokoro: true,
        canUseElevenLabs: true,
        canCloneVoices: true,
        maxClonedVoices: 3,
        monthlyGenerationLimit: 2000,
        maxStorageMB: 2048 // 2GB
    },
    'titan': { // Enterprise
        canUseKokoro: true,
        canUseElevenLabs: true,
        canCloneVoices: true,
        maxClonedVoices: 10,
        monthlyGenerationLimit: 10000,
        maxStorageMB: 10240 // 10GB
    }
};

export class AudioAccessControl {
    /**
     * Check if user has permission for a specific feature
     */
    static async checkFeatureAccess(userId: string, feature: 'kokoro' | 'elevenlabs' | 'cloning'): Promise<boolean> {
        const { tier } = await getUserTier();
        const limits = AUDIO_TIER_LIMITS[tier];

        if (feature === 'kokoro') return limits.canUseKokoro;
        if (feature === 'elevenlabs') return limits.canUseElevenLabs;
        if (feature === 'cloning') return limits.canCloneVoices;

        return false;
    }

    /**
     * Get all limits for the current user
     */
    static async getLimits(userId: string): Promise<AudioTierLimits & { currentTier: SubscriptionTier }> {
        const { tier } = await getUserTier();
        return {
            ...AUDIO_TIER_LIMITS[tier],
            currentTier: tier
        };
    }
}
