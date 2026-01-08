/**
 * Cache Statistics API Route
 * GET /api/audio/cache/stats
 * 
 * Returns comprehensive cache statistics for monitoring and analytics
 * Admin only endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAudioCache } from '@/lib/audio/AudioCacheManager';
import { cookies } from 'next/headers';

/**
 * GET /api/audio/cache/stats
 * 
 * Returns cache statistics including:
 * - Total entries and size
 * - Hit rate and access patterns
 * - Oldest/newest entries
 * - Top voices by usage
 * 
 * @requires Authentication
 * @requires Admin role
 * 
 * @returns {Object} Cache statistics
 * @returns {number} totalEntries - Total number of cached audio files
 * @returns {number} totalSize - Total size in bytes
 * @returns {number} hitRate - Average access count per entry
 * @returns {string|null} oldestEntry - ISO timestamp of oldest entry
 * @returns {string|null} newestEntry - ISO timestamp of newest entry
 * @returns {number} averageFileSize - Average file size in bytes
 * @returns {Array} topVoices - Top 10 voices by usage
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/audio/cache/stats');
 * const stats = await response.json();
 * console.log(`Cache size: ${stats.totalSize} bytes`);
 * ```
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify admin role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('membership')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile || profile.membership !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Get cache statistics
        const cache = getAudioCache();
        const stats = await cache.getStats();

        // Format response
        return NextResponse.json({
            success: true,
            stats: {
                totalEntries: stats.totalEntries,
                totalSize: stats.totalSize,
                totalSizeFormatted: formatBytes(stats.totalSize),
                hitRate: stats.hitRate.toFixed(2),
                oldestEntry: stats.oldestEntry?.toISOString() || null,
                newestEntry: stats.newestEntry?.toISOString() || null,
                averageFileSize: Math.round(stats.averageFileSize),
                averageFileSizeFormatted: formatBytes(stats.averageFileSize),
                topVoices: stats.topVoices,
            },
        });
    } catch (error) {
        console.error('[API] Error fetching cache stats:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Helper function to format bytes into human-readable format
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
