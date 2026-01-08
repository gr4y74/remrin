import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { AudioAccessControl, AUDIO_TIER_LIMITS } from '@/lib/audio/access/AccessControl';
import { getUserTier } from '@/lib/check-premium';

export class AudioUsageService {

    /**
     * Check if user can generate audio (Quota check)
     */
    static async checkQuota(userId: string): Promise<boolean> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Get limits for user
        const { tier } = await getUserTier();
        const limit = AUDIO_TIER_LIMITS[tier].monthlyGenerationLimit;

        if (limit === -1) return true; // Unlimited

        // Get current usage via RPC
        const { data: currentUsage, error } = await supabase.rpc('get_monthly_audio_usage', {
            user_uuid: userId
        });

        if (error) {
            console.error('[AudioUsage] Failed to check quota:', error);
            return false; // Fail safe
        }

        const usage = currentUsage as number;
        console.log(`[AudioUsage] User ${userId} (${tier}): ${usage}/${limit}`);

        return usage < limit;
    }

    /**
     * Track a successful generation
     */
    static async trackGeneration(
        userId: string,
        provider: string,
        voiceId: string,
        charsCount: number,
        duration?: number
    ): Promise<void> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.from('audio_generations').insert({
            user_id: userId,
            provider,
            voice_id: voiceId,
            chars_count: charsCount,
            duration_seconds: duration
        });

        if (error) {
            console.error('[AudioUsage] Failed to track generation:', error);
        }
    }
}
