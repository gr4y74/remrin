/**
 * Audio Tier Check Middleware
 * 
 * Middleware for audio API routes that enforces tier-based access control.
 * Checks user tier before TTS generation and enforces quotas.
 * 
 * Features:
 * - User authentication verification
 * - Tier-based provider access
 * - Quota enforcement with grace period
 * - Violation logging
 * - 402 Payment Required for quota exceeded
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTierManager, QuotaStatus, AudioTier, TIER_DEFINITIONS } from '@/lib/audio/TierManager';
import { VoiceProvider } from '@/types/audio';

// ============================================================================
// Types
// ============================================================================

export interface AudioTierContext {
    userId: string;
    tier: AudioTier;
    quotaStatus: QuotaStatus;
    providers: VoiceProvider[];
    canProceed: boolean;
    violationReason?: string;
}

export interface MiddlewareResult {
    allowed: boolean;
    context?: AudioTierContext;
    response?: NextResponse;
}

// ============================================================================
// Violation Logging
// ============================================================================

async function logQuotaViolation(
    userId: string,
    tier: AudioTier,
    quotaStatus: QuotaStatus,
    requestedChars: number,
    provider: VoiceProvider
): Promise<void> {
    console.warn(`[AudioTierCheck] QUOTA VIOLATION | User: ${userId} | Tier: ${tier} | Used: ${quotaStatus.used}/${quotaStatus.limit} | Requested: ${requestedChars} | Provider: ${provider}`);

    // Log to database for analytics (fire and forget)
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        await supabase.from('audit_logs').insert({
            event_type: 'audio_quota_exceeded',
            user_id: userId,
            metadata: {
                tier,
                used: quotaStatus.used,
                limit: quotaStatus.limit,
                requested_chars: requestedChars,
                provider,
                in_grace_period: quotaStatus.inGracePeriod,
            },
        });
    } catch {
        // Ignore audit log errors
    }
}

async function logProviderViolation(
    userId: string,
    tier: AudioTier,
    requestedProvider: VoiceProvider,
    allowedProviders: VoiceProvider[]
): Promise<void> {
    console.warn(`[AudioTierCheck] PROVIDER ACCESS DENIED | User: ${userId} | Tier: ${tier} | Requested: ${requestedProvider} | Allowed: ${allowedProviders.join(', ')}`);

    // Log to database for analytics (fire and forget)
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        await supabase.from('audit_logs').insert({
            event_type: 'audio_provider_denied',
            user_id: userId,
            metadata: {
                tier,
                requested_provider: requestedProvider,
                allowed_providers: allowedProviders,
            },
        });
    } catch {
        // Ignore audit log errors
    }
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Check audio tier and quota for a request
 * @param request - Next.js request object
 * @param requestedChars - Number of characters to be generated
 * @param requestedProvider - Requested voice provider
 * @returns Middleware result with context or error response
 */
export async function checkAudioTier(
    request: NextRequest,
    requestedChars: number = 0,
    requestedProvider: VoiceProvider = 'edge'
): Promise<MiddlewareResult> {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            allowed: false,
            response: NextResponse.json(
                {
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                },
                { status: 401 }
            ),
        };
    }

    const tierManager = getTierManager();

    // 2. Get user's quota status
    const quotaStatus = await tierManager.getQuotaStatus(user.id);
    const availableProviders = await tierManager.getAvailableProviders(user.id);

    // 3. Build context
    const context: AudioTierContext = {
        userId: user.id,
        tier: quotaStatus.tier,
        quotaStatus,
        providers: availableProviders,
        canProceed: true,
    };

    // 4. Check provider access
    if (!availableProviders.includes(requestedProvider)) {
        await logProviderViolation(user.id, quotaStatus.tier, requestedProvider, availableProviders);

        context.canProceed = false;
        context.violationReason = `Provider '${requestedProvider}' requires Premium tier or higher`;

        return {
            allowed: false,
            context,
            response: NextResponse.json(
                {
                    error: `Provider '${requestedProvider}' requires Premium tier or higher`,
                    code: 'PROVIDER_REQUIRES_UPGRADE',
                    tier: quotaStatus.tier,
                    requiredTier: 'premium',
                    upgradeUrl: '/pricing',
                },
                { status: 403 }
            ),
        };
    }

    // 5. Check quota (skip for VIP/unlimited)
    if (quotaStatus.limit !== -1 && requestedChars > 0) {
        const hasQuota = await tierManager.checkQuota(user.id, requestedChars);

        if (!hasQuota) {
            await logQuotaViolation(user.id, quotaStatus.tier, quotaStatus, requestedChars, requestedProvider);

            context.canProceed = false;
            context.violationReason = 'Daily quota exceeded';

            // Return 402 Payment Required
            return {
                allowed: false,
                context,
                response: NextResponse.json(
                    {
                        error: 'Daily audio quota exceeded',
                        code: 'QUOTA_EXCEEDED',
                        tier: quotaStatus.tier,
                        used: quotaStatus.used,
                        limit: quotaStatus.limit,
                        resetDate: quotaStatus.resetDate.toISOString(),
                        upgradeUrl: '/pricing',
                        message: quotaStatus.inGracePeriod
                            ? 'You are in your grace period. Upgrade for more characters.'
                            : 'You have reached your daily limit. Upgrade for more characters.',
                    },
                    { status: 402 }
                ),
            };
        }

        // Warn if approaching limit (>80%)
        if (quotaStatus.percentUsed >= 80) {
            console.log(`[AudioTierCheck] User ${user.id} approaching quota limit: ${quotaStatus.percentUsed}%`);
        }
    }

    // All checks passed
    return {
        allowed: true,
        context,
    };
}

/**
 * Middleware wrapper for audio API routes
 * Use as a function to wrap your route handler
 */
export function withAudioTierCheck(
    handler: (
        request: NextRequest,
        context: AudioTierContext
    ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
    return async (request: NextRequest) => {
        // Parse request body to get chars and provider
        let requestedChars = 0;
        let requestedProvider: VoiceProvider = 'edge';

        try {
            const body = await request.clone().json();
            requestedChars = body.text?.length || 0;
            requestedProvider = body.provider || 'edge';
        } catch {
            // Body parsing failed, continue with defaults
        }

        const result = await checkAudioTier(request, requestedChars, requestedProvider);

        if (!result.allowed && result.response) {
            return result.response;
        }

        if (!result.context) {
            return NextResponse.json(
                { error: 'Internal error during tier check' },
                { status: 500 }
            );
        }

        return handler(request, result.context);
    };
}

/**
 * Quick tier check for API routes (without full middleware wrapper)
 * Returns context or throws
 */
export async function requireAudioTier(
    request: NextRequest,
    requestedChars: number = 0,
    requestedProvider: VoiceProvider = 'edge'
): Promise<AudioTierContext> {
    const result = await checkAudioTier(request, requestedChars, requestedProvider);

    if (!result.allowed) {
        throw {
            status: result.response?.status || 403,
            message: result.context?.violationReason || 'Access denied',
            response: result.response,
        };
    }

    return result.context!;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get tier info for display (no auth check)
 */
export function getTierInfo(tier: AudioTier) {
    return TIER_DEFINITIONS[tier];
}

/**
 * Get upgrade message based on tier
 */
export function getUpgradeMessage(tier: AudioTier): string {
    switch (tier) {
        case 'free':
            return 'Upgrade to Premium for 100,000 characters/day and access to Kokoro & ElevenLabs voices!';
        case 'premium':
            return 'Upgrade to VIP for unlimited audio generation!';
        case 'vip':
            return 'You have unlimited access!';
        default:
            return 'Upgrade for more features!';
    }
}

export default {
    checkAudioTier,
    withAudioTierCheck,
    requireAudioTier,
    getTierInfo,
    getUpgradeMessage,
};
