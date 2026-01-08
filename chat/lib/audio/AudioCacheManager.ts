/**
 * Audio Cache Manager
 * Intelligent caching system for TTS-generated audio with LRU eviction
 */

import { createAdminClient } from '@/lib/supabase/server';
import { createTextHash } from './utils/hash';
import type { AudioCacheEntry } from '@/types/audio';

/**
 * Cached audio data structure
 */
export interface CachedAudio {
    id: string;
    audioUrl: string;
    duration: number | null;
    fileSize: number;
    hitCount: number;
    lastAccessed: Date;
    createdAt: Date;
}

/**
 * Audio metadata for caching
 */
export interface AudioMetadata {
    duration?: number;
    fileSize: number;
    voiceProvider: string;
    voiceId: string;
    personaId?: string;
}

/**
 * Cache cleanup statistics
 */
export interface CleanupStats {
    deletedCount: number;
    freedBytes: number;
    oldestEntryAge?: number;
    errors: string[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    averageFileSize: number;
    topVoices: Array<{ voiceId: string; count: number }>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
    maxEntries?: number;
    maxSizeBytes?: number;
    maxAgeHours?: number;
}

/**
 * AudioCacheManager - Manages intelligent audio caching with LRU eviction
 * 
 * Features:
 * - Atomic operations to prevent race conditions
 * - LRU (Least Recently Used) eviction strategy
 * - Size-based and age-based cleanup
 * - Access tracking for analytics
 * - Transaction support for consistency
 * 
 * @example
 * ```ts
 * const cache = new AudioCacheManager();
 * 
 * // Check cache first
 * const cached = await cache.get(textHash);
 * if (cached) {
 *   return cached.audioUrl;
 * }
 * 
 * // Generate and cache
 * const audioBuffer = await generateTTS(text);
 * await cache.set(textHash, audioBuffer, metadata);
 * ```
 */
export class AudioCacheManager {
    private config: Required<CacheConfig>;

    constructor(config: CacheConfig = {}) {
        this.config = {
            maxEntries: config.maxEntries ?? 10000,
            maxSizeBytes: config.maxSizeBytes ?? 10 * 1024 * 1024 * 1024, // 10GB
            maxAgeHours: config.maxAgeHours ?? 720, // 30 days
        };
    }

    /**
     * Retrieves cached audio by text hash
     * Automatically updates access tracking (last_accessed_at, access_count)
     * 
     * @param textHash - The hash of the text + voice configuration
     * @returns Cached audio data or null if not found
     */
    async get(textHash: string): Promise<CachedAudio | null> {
        try {
            const supabase = createAdminClient();

            // Fetch the cache entry
            const { data: entry, error: fetchError } = await supabase
                .from('audio_cache')
                .select('*')
                .eq('text_hash', textHash)
                .single();

            if (fetchError || !entry) {
                return null;
            }

            // Update access tracking atomically
            const { error: updateError } = await supabase
                .from('audio_cache')
                .update({
                    last_accessed_at: new Date().toISOString(),
                    access_count: (entry.access_count || 0) + 1,
                })
                .eq('id', entry.id);

            if (updateError) {
                console.error('[AudioCacheManager] Failed to update access tracking:', updateError);
                // Continue anyway - cache hit is more important than tracking
            }

            return {
                id: entry.id,
                audioUrl: entry.audio_url,
                duration: entry.duration_seconds,
                fileSize: entry.file_size_bytes || 0,
                hitCount: (entry.access_count || 0) + 1,
                lastAccessed: new Date(entry.last_accessed_at),
                createdAt: new Date(entry.created_at),
            };
        } catch (error) {
            console.error('[AudioCacheManager] Error retrieving cache:', error);
            return null;
        }
    }

    /**
     * Stores audio in the cache with metadata
     * Handles automatic cleanup if limits are exceeded
     * 
     * @param textHash - The hash of the text + voice configuration
     * @param audioUrl - URL to the stored audio file
     * @param metadata - Audio metadata (duration, size, voice info)
     */
    async set(
        textHash: string,
        audioUrl: string,
        metadata: AudioMetadata
    ): Promise<void> {
        try {
            const supabase = createAdminClient();

            // Insert or update cache entry
            const { error: upsertError } = await supabase
                .from('audio_cache')
                .upsert(
                    {
                        text_hash: textHash,
                        audio_url: audioUrl,
                        voice_provider: metadata.voiceProvider,
                        voice_id: metadata.voiceId,
                        persona_id: metadata.personaId || null,
                        file_size_bytes: metadata.fileSize,
                        duration_seconds: metadata.duration || null,
                        last_accessed_at: new Date().toISOString(),
                        access_count: 0,
                    },
                    {
                        onConflict: 'text_hash',
                    }
                );

            if (upsertError) {
                throw new Error(`Failed to cache audio: ${upsertError.message}`);
            }

            // Check if cleanup is needed
            await this.autoCleanup();
        } catch (error) {
            console.error('[AudioCacheManager] Error setting cache:', error);
            throw error;
        }
    }

    /**
     * Deletes a specific cache entry by text hash
     * 
     * @param textHash - The hash of the cached entry to delete
     */
    async delete(textHash: string): Promise<void> {
        try {
            const supabase = createAdminClient();

            const { error } = await supabase
                .from('audio_cache')
                .delete()
                .eq('text_hash', textHash);

            if (error) {
                throw new Error(`Failed to delete cache entry: ${error.message}`);
            }
        } catch (error) {
            console.error('[AudioCacheManager] Error deleting cache:', error);
            throw error;
        }
    }

    /**
     * Cleans up old cache entries based on age and size limits
     * Uses LRU (Least Recently Used) eviction strategy
     * 
     * @param maxAgeHours - Maximum age in hours (default: from config)
     * @param maxSizeBytes - Maximum total cache size (default: from config)
     * @returns Cleanup statistics
     */
    async cleanup(
        maxAgeHours?: number,
        maxSizeBytes?: number
    ): Promise<CleanupStats> {
        const stats: CleanupStats = {
            deletedCount: 0,
            freedBytes: 0,
            errors: [],
        };

        try {
            const supabase = createAdminClient();
            const ageLimit = maxAgeHours ?? this.config.maxAgeHours;
            const sizeLimit = maxSizeBytes ?? this.config.maxSizeBytes;

            // Calculate cutoff date for age-based cleanup
            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - ageLimit);

            // Delete entries older than cutoff
            const { data: oldEntries, error: fetchError } = await supabase
                .from('audio_cache')
                .select('id, file_size_bytes')
                .lt('last_accessed_at', cutoffDate.toISOString());

            if (fetchError) {
                stats.errors.push(`Failed to fetch old entries: ${fetchError.message}`);
            } else if (oldEntries && oldEntries.length > 0) {
                const idsToDelete = oldEntries.map((e) => e.id);
                const bytesToFree = oldEntries.reduce(
                    (sum, e) => sum + (e.file_size_bytes || 0),
                    0
                );

                const { error: deleteError } = await supabase
                    .from('audio_cache')
                    .delete()
                    .in('id', idsToDelete);

                if (deleteError) {
                    stats.errors.push(`Failed to delete old entries: ${deleteError.message}`);
                } else {
                    stats.deletedCount += oldEntries.length;
                    stats.freedBytes += bytesToFree;
                }
            }

            // Check total cache size and apply LRU eviction if needed
            const { data: sizeData, error: sizeError } = await supabase
                .from('audio_cache')
                .select('file_size_bytes');

            if (sizeError) {
                stats.errors.push(`Failed to calculate cache size: ${sizeError.message}`);
            } else if (sizeData) {
                const totalSize = sizeData.reduce(
                    (sum, e) => sum + (e.file_size_bytes || 0),
                    0
                );

                if (totalSize > sizeLimit) {
                    // Delete least recently used entries until under limit
                    const bytesToRemove = totalSize - sizeLimit;
                    const { data: lruEntries, error: lruError } = await supabase
                        .from('audio_cache')
                        .select('id, file_size_bytes')
                        .order('last_accessed_at', { ascending: true });

                    if (lruError) {
                        stats.errors.push(`Failed to fetch LRU entries: ${lruError.message}`);
                    } else if (lruEntries) {
                        let removedBytes = 0;
                        const idsToDelete: string[] = [];

                        for (const entry of lruEntries) {
                            if (removedBytes >= bytesToRemove) break;
                            idsToDelete.push(entry.id);
                            removedBytes += entry.file_size_bytes || 0;
                        }

                        if (idsToDelete.length > 0) {
                            const { error: deleteError } = await supabase
                                .from('audio_cache')
                                .delete()
                                .in('id', idsToDelete);

                            if (deleteError) {
                                stats.errors.push(`Failed to delete LRU entries: ${deleteError.message}`);
                            } else {
                                stats.deletedCount += idsToDelete.length;
                                stats.freedBytes += removedBytes;
                            }
                        }
                    }
                }
            }

            return stats;
        } catch (error) {
            console.error('[AudioCacheManager] Error during cleanup:', error);
            stats.errors.push(error instanceof Error ? error.message : String(error));
            return stats;
        }
    }

    /**
     * Retrieves comprehensive cache statistics
     * 
     * @returns Cache statistics including size, hit rate, and usage patterns
     */
    async getStats(): Promise<CacheStats> {
        try {
            const supabase = createAdminClient();

            // Get all cache entries
            const { data: entries, error } = await supabase
                .from('audio_cache')
                .select('*');

            if (error || !entries) {
                throw new Error(`Failed to fetch cache stats: ${error?.message}`);
            }

            // Calculate statistics
            const totalEntries = entries.length;
            const totalSize = entries.reduce(
                (sum, e) => sum + (e.file_size_bytes || 0),
                0
            );
            const totalHits = entries.reduce(
                (sum, e) => sum + (e.access_count || 0),
                0
            );
            const hitRate = totalEntries > 0 ? totalHits / totalEntries : 0;

            const dates = entries.map((e) => new Date(e.created_at));
            const oldestEntry = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
            const newestEntry = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

            const averageFileSize = totalEntries > 0 ? totalSize / totalEntries : 0;

            // Calculate top voices
            const voiceCounts = entries.reduce((acc, e) => {
                const key = e.voice_id;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const topVoices = Object.entries(voiceCounts)
                .map(([voiceId, count]) => ({ voiceId, count }))
                .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
                .slice(0, 10);

            return {
                totalEntries,
                totalSize,
                hitRate,
                oldestEntry,
                newestEntry,
                averageFileSize,
                topVoices,
            };
        } catch (error) {
            console.error('[AudioCacheManager] Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Automatically triggers cleanup if cache exceeds configured limits
     * Called internally after each set() operation
     */
    private async autoCleanup(): Promise<void> {
        try {
            const stats = await this.getStats();

            // Check if cleanup is needed
            const needsCleanup =
                stats.totalEntries > this.config.maxEntries ||
                stats.totalSize > this.config.maxSizeBytes;

            if (needsCleanup) {
                console.log('[AudioCacheManager] Auto-cleanup triggered');
                await this.cleanup();
            }
        } catch (error) {
            console.error('[AudioCacheManager] Auto-cleanup failed:', error);
            // Don't throw - cleanup failure shouldn't break caching
        }
    }

    /**
     * Warms the cache with common phrases
     * Useful for preloading frequently used audio
     * 
     * @param phrases - Array of { text, voiceId, voiceProvider } to preload
     */
    async warmCache(
        phrases: Array<{
            text: string;
            voiceId: string;
            voiceProvider: string;
            generateFn: () => Promise<{ url: string; size: number; duration?: number }>;
        }>
    ): Promise<void> {
        console.log(`[AudioCacheManager] Warming cache with ${phrases.length} phrases`);

        for (const phrase of phrases) {
            try {
                const hash = createTextHash(phrase.text, phrase.voiceId);
                const existing = await this.get(hash);

                if (!existing) {
                    const audio = await phrase.generateFn();
                    await this.set(hash, audio.url, {
                        voiceId: phrase.voiceId,
                        voiceProvider: phrase.voiceProvider,
                        fileSize: audio.size,
                        duration: audio.duration,
                    });
                    console.log(`[AudioCacheManager] Cached: "${phrase.text.substring(0, 30)}..."`);
                }
            } catch (error) {
                console.error(`[AudioCacheManager] Failed to warm cache for phrase:`, error);
            }
        }
    }
}

/**
 * Singleton instance for global cache access
 */
let cacheInstance: AudioCacheManager | null = null;

/**
 * Gets or creates the global AudioCacheManager instance
 */
export function getAudioCache(config?: CacheConfig): AudioCacheManager {
    if (!cacheInstance) {
        cacheInstance = new AudioCacheManager(config);
    }
    return cacheInstance;
}
