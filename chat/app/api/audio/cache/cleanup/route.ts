/**
 * Audio Cache Cleanup API Route
 * 
 * DELETE /api/audio/cache/cleanup
 * Admin-only endpoint for cleaning up old cached audio files
 * 
 * Features:
 * - Admin authentication required
 * - Configurable age threshold
 * - Optional hit count filter
 * - Storage file deletion
 * - Database cleanup
 * - Statistics reporting
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
    cacheCleanupSchema,
    AudioAPIError,
    type CacheCleanupResponse,
} from '@/types/audio';

/**
 * DELETE: Clean up old cache entries
 * 
 * Query Parameters:
 * - olderThanDays: number (default: 30, min: 1, max: 365)
 * - minHitCount: number (default: 0, min: 0)
 * 
 * Only deletes entries that are:
 * - Older than specified days AND
 * - Have hit count <= minHitCount
 * 
 * Response:
 * - success: boolean
 * - deletedCount: number
 * - freedBytes: number
 * - error?: string
 */
export async function DELETE(request: NextRequest) {
    const startTime = Date.now();

    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[Cache Cleanup] Authentication failed:', authError);
            return NextResponse.json(
                { success: false, deletedCount: 0, freedBytes: 0, error: 'Unauthorized' } as CacheCleanupResponse,
                { status: 401 }
            );
        }

        // Verify admin status
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            console.error(`[Cache Cleanup] Permission denied for user ${user.id}`);
            return NextResponse.json(
                { success: false, deletedCount: 0, freedBytes: 0, error: 'Admin access required' } as CacheCleanupResponse,
                { status: 403 }
            );
        }

        // Parse and validate query parameters
        const { searchParams } = new URL(request.url);
        const validationResult = cacheCleanupSchema.safeParse({
            olderThanDays: searchParams.get('olderThanDays')
                ? parseInt(searchParams.get('olderThanDays')!, 10)
                : 30,
            minHitCount: searchParams.get('minHitCount')
                ? parseInt(searchParams.get('minHitCount')!, 10)
                : 0,
        });

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    deletedCount: 0,
                    freedBytes: 0,
                    error: 'Invalid parameters',
                } as CacheCleanupResponse,
                { status: 400 }
            );
        }

        const { olderThanDays, minHitCount } = validationResult.data;

        console.log(`[Cache Cleanup] Starting cleanup - older than ${olderThanDays} days, max ${minHitCount} hits`);

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffISO = cutoffDate.toISOString();

        console.log(`[Cache Cleanup] Cutoff date: ${cutoffISO}`);

        // Find cache entries to delete
        const { data: entriesToDelete, error: fetchError } = await supabase
            .from('audio_cache')
            .select('id, audio_path, file_size, created_at, hit_count')
            .lte('created_at', cutoffISO)
            .lte('hit_count', minHitCount);

        if (fetchError) {
            console.error('[Cache Cleanup] Failed to fetch entries:', fetchError);
            throw new AudioAPIError('Failed to fetch cache entries', 500, 'FETCH_FAILED');
        }

        if (!entriesToDelete || entriesToDelete.length === 0) {
            console.log('[Cache Cleanup] No entries found to delete');
            return NextResponse.json(
                {
                    success: true,
                    deletedCount: 0,
                    freedBytes: 0,
                } as CacheCleanupResponse,
                { status: 200 }
            );
        }

        console.log(`[Cache Cleanup] Found ${entriesToDelete.length} entries to delete`);

        // Calculate total size
        const totalBytes = entriesToDelete.reduce((sum, entry) => sum + (entry.file_size || 0), 0);

        // Delete storage files
        const filePaths = entriesToDelete
            .map(entry => entry.audio_path)
            .filter(Boolean);

        let storageDeleteCount = 0;
        let storageDeleteErrors = 0;

        if (filePaths.length > 0) {
            console.log(`[Cache Cleanup] Deleting ${filePaths.length} storage files`);

            // Delete in batches of 100 (Supabase limit)
            const batchSize = 100;
            for (let i = 0; i < filePaths.length; i += batchSize) {
                const batch = filePaths.slice(i, i + batchSize);

                const { data: deleteData, error: deleteError } = await supabase.storage
                    .from('audio_cache')
                    .remove(batch);

                if (deleteError) {
                    console.error('[Cache Cleanup] Storage delete batch failed:', deleteError);
                    storageDeleteErrors += batch.length;
                } else {
                    storageDeleteCount += batch.length;
                    console.log(`[Cache Cleanup] Deleted storage batch: ${batch.length} files`);
                }
            }
        }

        console.log(`[Cache Cleanup] Storage deletion: ${storageDeleteCount} succeeded, ${storageDeleteErrors} failed`);

        // Delete database entries
        const entryIds = entriesToDelete.map(entry => entry.id);

        const { error: dbDeleteError } = await supabase
            .from('audio_cache')
            .delete()
            .in('id', entryIds);

        if (dbDeleteError) {
            console.error('[Cache Cleanup] Database delete failed:', dbDeleteError);
            throw new AudioAPIError('Failed to delete cache entries from database', 500, 'DB_DELETE_FAILED');
        }

        const duration = Date.now() - startTime;
        const freedMB = (totalBytes / 1024 / 1024).toFixed(2);

        console.log(`[Cache Cleanup] Completed in ${duration}ms`);
        console.log(`[Cache Cleanup] Deleted ${entriesToDelete.length} entries, freed ${freedMB}MB`);

        return NextResponse.json(
            {
                success: true,
                deletedCount: entriesToDelete.length,
                freedBytes: totalBytes,
            } as CacheCleanupResponse,
            { status: 200 }
        );

    } catch (error) {
        console.error('[Cache Cleanup] Unexpected error:', error);

        if (error instanceof AudioAPIError) {
            return NextResponse.json(
                {
                    success: false,
                    deletedCount: 0,
                    freedBytes: 0,
                    error: error.message,
                } as CacheCleanupResponse,
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            {
                success: false,
                deletedCount: 0,
                freedBytes: 0,
                error: 'Internal server error',
            } as CacheCleanupResponse,
            { status: 500 }
        );
    }
}

/**
 * Recommended Cleanup Schedule:
 * 
 * Set up a cron job to run this endpoint periodically:
 * 
 * 1. Daily cleanup (low-usage entries):
 *    DELETE /api/audio/cache/cleanup?olderThanDays=7&minHitCount=2
 *    - Removes entries older than 7 days with 2 or fewer hits
 * 
 * 2. Weekly cleanup (medium-usage entries):
 *    DELETE /api/audio/cache/cleanup?olderThanDays=30&minHitCount=10
 *    - Removes entries older than 30 days with 10 or fewer hits
 * 
 * 3. Monthly cleanup (all old entries):
 *    DELETE /api/audio/cache/cleanup?olderThanDays=90&minHitCount=50
 *    - Removes entries older than 90 days with 50 or fewer hits
 * 
 * Example with Vercel Cron Jobs (vercel.json):
 * 
 * {
 *   "crons": [
 *     {
 *       "path": "/api/audio/cache/cleanup?olderThanDays=7&minHitCount=2",
 *       "schedule": "0 2 * * *"
 *     }
 *   ]
 * }
 */
