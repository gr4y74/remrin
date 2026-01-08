/**
 * Audio Quota API Route
 * 
 * GET endpoint for retrieving user's audio quota status.
 * Used by UI to show quota indicators.
 * 
 * Response: { tier, used, limit, remaining, resetDate, percentUsed, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTierManager, TIER_DEFINITIONS } from '@/lib/audio/TierManager';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required', code: 'AUTH_REQUIRED' },
                { status: 401 }
            );
        }

        const tierManager = getTierManager();

        // Get quota status
        const quotaStatus = await tierManager.getQuotaStatus(user.id);
        const availableProviders = await tierManager.getAvailableProviders(user.id);
        const tierDef = TIER_DEFINITIONS[quotaStatus.tier];

        // Calculate time until reset
        const now = new Date();
        const msUntilReset = quotaStatus.resetDate.getTime() - now.getTime();
        const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
        const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

        return NextResponse.json({
            success: true,
            quota: {
                // Tier info
                tier: quotaStatus.tier,
                tierName: tierDef.name,
                tierDescription: tierDef.description,

                // Usage
                used: quotaStatus.used,
                limit: quotaStatus.limit,
                remaining: quotaStatus.remaining === Infinity ? -1 : quotaStatus.remaining,
                percentUsed: quotaStatus.percentUsed,
                unlimited: quotaStatus.limit === -1,

                // Status
                exceeded: quotaStatus.exceeded,
                inGracePeriod: quotaStatus.inGracePeriod,
                graceRemaining: quotaStatus.graceRemaining,

                // Reset timing
                resetDate: quotaStatus.resetDate.toISOString(),
                resetIn: {
                    hours: hoursUntilReset,
                    minutes: minutesUntilReset,
                    formatted: hoursUntilReset > 0
                        ? `${hoursUntilReset}h ${minutesUntilReset}m`
                        : `${minutesUntilReset}m`,
                },

                // Available providers
                providers: availableProviders,

                // Upgrade info (for non-VIP users)
                canUpgrade: quotaStatus.tier !== 'vip',
                upgradeUrl: quotaStatus.tier !== 'vip' ? '/pricing' : null,
                upgradeMessage: quotaStatus.tier === 'free'
                    ? 'Upgrade to Premium for 100k characters/day'
                    : quotaStatus.tier === 'premium'
                        ? 'Upgrade to VIP for unlimited access'
                        : null,
            },
        });
    } catch (error) {
        console.error('[QuotaAPI] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve quota status',
                code: 'INTERNAL_ERROR',
            },
            { status: 500 }
        );
    }
}

/**
 * HEAD request for quick quota check
 * Returns status code based on quota:
 * - 200: Quota available
 * - 402: Quota exceeded
 * - 401: Not authenticated
 */
export async function HEAD(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return new NextResponse(null, { status: 401 });
        }

        const tierManager = getTierManager();
        const quotaStatus = await tierManager.getQuotaStatus(user.id);

        // Return appropriate status
        if (quotaStatus.exceeded && !quotaStatus.inGracePeriod) {
            return new NextResponse(null, {
                status: 402,
                headers: {
                    'X-Quota-Used': String(quotaStatus.used),
                    'X-Quota-Limit': String(quotaStatus.limit),
                    'X-Quota-Reset': quotaStatus.resetDate.toISOString(),
                },
            });
        }

        return new NextResponse(null, {
            status: 200,
            headers: {
                'X-Quota-Used': String(quotaStatus.used),
                'X-Quota-Limit': String(quotaStatus.limit),
                'X-Quota-Remaining': String(quotaStatus.remaining === Infinity ? -1 : quotaStatus.remaining),
                'X-Quota-Reset': quotaStatus.resetDate.toISOString(),
            },
        });
    } catch {
        return new NextResponse(null, { status: 500 });
    }
}
