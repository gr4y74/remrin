/**
 * AudioService
 * 
 * Main service for text-to-speech generation with intelligent caching.
 * Routes requests to appropriate providers (Edge TTS, Kokoro, ElevenLabs)
 * and manages audio caching for optimal performance.
 * 
 * Features:
 * - Multi-provider support
 * - Database + storage caching
 * - Text hashing for cache keys
 * - Performance metrics
 * - LRU cache eviction
 */

import { createHash } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    IAudioProvider,
    GenerationOptions,
    GenerationResult,
    Voice,
    VoiceInfo,
    ProviderStatus,
    AudioProviderError,
} from './providers/AudioProvider.interface';
import { EdgeTTSProvider, getEdgeTTSProvider } from './providers/EdgeTTSProvider';
import { KokoroProvider, getKokoroProvider } from './providers/KokoroProvider';
import { ElevenLabsProvider, getElevenLabsProvider } from './providers/ElevenLabsProvider';
import { VoiceProvider, AudioCacheEntry } from '@/types/audio';
import { AudioAccessControl as AccessControl } from './access/AccessControl';
import { AudioUsageService } from './quota/AudioUsageService';
import { getTierManager, TIER_DEFINITIONS } from './TierManager';

// ============================================================================
// Types
// ============================================================================

/**
 * Audio generation request options
 */
export interface AudioGenerationRequest {
    /** Text to convert to speech */
    text: string;
    /** Persona ID for context and persona-specific voice */
    personaId: string;
    /** Voice provider to use (defaults to persona's provider) */
    provider?: VoiceProvider;
    /** Voice ID (defaults to persona's voice) */
    voiceId?: string;
    /** Generation options */
    options?: GenerationOptions;
    /** Skip cache lookup (force regeneration) */
    skipCache?: boolean;
    /** Skip caching the result */
    noStore?: boolean;
}

/**
 * Audio generation response
 */
export interface AudioGenerationResponse {
    /** Audio data (ArrayBuffer) */
    audio: ArrayBuffer;
    /** Audio URL if stored */
    audioUrl?: string;
    /** Whether result was from cache */
    cached: boolean;
    /** Audio duration in seconds */
    duration?: number;
    /** Generation metadata */
    metadata: {
        provider: VoiceProvider;
        voiceId: string;
        textHash: string;
        generationTimeMs: number;
        characterCount: number;
    };
}

/**
 * Cache statistics
 */
export interface CacheStats {
    totalEntries: number;
    totalSizeBytes: number;
    oldestEntryDate: Date | null;
    hitRate: number;
    topVoices: Array<{ voiceId: string; count: number }>;
}

/**
 * Cache cleanup options
 */
export interface CacheCleanupOptions {
    /** Delete entries older than this many days */
    olderThanDays?: number;
    /** Delete entries with fewer hits than this */
    minHitCount?: number;
    /** Maximum cache size to maintain (bytes) */
    maxSizeBytes?: number;
    /** Maximum number of entries */
    maxEntries?: number;
    /** Dry run - don't actually delete */
    dryRun?: boolean;
}

/**
 * Cache cleanup result
 */
export interface CacheCleanupResult {
    deletedCount: number;
    freedBytes: number;
    remainingCount: number;
    remainingBytes: number;
}

/**
 * Persona audio settings (from database)
 */
interface PersonaVoiceSettings {
    voice_provider: VoiceProvider | null;
    voice_id: string | null;
    voice_settings: Record<string, unknown> | null;
}

// ============================================================================
// AudioService
// ============================================================================

/**
 * Main Audio Service
 */
export class AudioService {
    private providers: Map<VoiceProvider, IAudioProvider> = new Map();
    private supabase: SupabaseClient;
    private cacheHits = 0;
    private cacheMisses = 0;

    // Audio storage bucket name
    private readonly audioCacheBucket = 'audio_cache';

    constructor(supabaseClient?: SupabaseClient) {
        // Initialize Supabase client
        if (supabaseClient) {
            this.supabase = supabaseClient;
        } else {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration missing');
            }

            this.supabase = createClient(supabaseUrl, supabaseKey);
        }

        // Register default providers
        this.registerProvider('edge', getEdgeTTSProvider());
        this.registerProvider('kokoro', getKokoroProvider());
        this.registerProvider('elevenlabs', getElevenLabsProvider());

        console.log('[AudioService] Initialized with providers:', Array.from(this.providers.keys()));
    }

    /**
     * Register a TTS provider
     */
    registerProvider(name: VoiceProvider, provider: IAudioProvider): void {
        this.providers.set(name, provider);
        console.log(`[AudioService] Registered provider: ${name}`);
    }

    /**
     * Get a registered provider
     */
    getProvider(name: VoiceProvider): IAudioProvider | undefined {
        return this.providers.get(name);
    }

    /**
     * Generate speech with caching and fallback logic
     */
    async generateSpeech(request: AudioGenerationRequest & { userId: string }): Promise<AudioGenerationResponse> {
        const startTime = Date.now();
        const tierManager = getTierManager();

        console.log(`[AudioService] Generate speech request | User: ${request.userId} | Persona: ${request.personaId} | Text length: ${request.text.length}`);

        // 1. Check Daily Quota using TierManager
        const hasQuota = await tierManager.checkQuota(request.userId, request.text.length);
        if (!hasQuota) {
            // Get quota status for detailed error
            const quotaStatus = await tierManager.getQuotaStatus(request.userId);

            throw new AudioProviderError(
                quotaStatus.inGracePeriod
                    ? 'Daily quota exceeded, but you are in grace period. Consider upgrading.'
                    : 'Daily audio quota exceeded. Please upgrade your plan or wait for reset.',
                'RATE_LIMIT_EXCEEDED',
                'edge',
                false
            );
        }

        // Get persona voice settings
        const personaSettings = await this.getPersonaVoiceSettings(request.personaId);

        // Determine provider and voice
        let provider = request.provider || personaSettings?.voice_provider || 'edge';
        const voiceId = request.voiceId || personaSettings?.voice_id || 'en-US-AriaNeural';

        // 2. Check Provider Access using TierManager
        const canUseProvider = await tierManager.canUseProvider(request.userId, provider);
        if (!canUseProvider) {
            // Check if we should fallback or throw
            const availableProviders = await tierManager.getAvailableProviders(request.userId);

            if (availableProviders.length > 0) {
                // Fallback to best available provider
                const fallbackProvider = availableProviders.includes('kokoro') ? 'kokoro' : 'edge';
                console.warn(`[AudioService] Provider ${provider} not available for user, falling back to ${fallbackProvider}`);
                provider = fallbackProvider;
            } else {
                throw new AudioProviderError(
                    `Provider '${provider}' requires Premium tier or higher.`,
                    'AUTH_ERROR',
                    provider,
                    false
                );
            }
        }

        // Merge options with persona settings
        const options: GenerationOptions = {
            ...personaSettings?.voice_settings,
            ...request.options,
        };

        // Create cache key
        const textHash = this.createTextHash(request.text, voiceId, options);

        // Check cache first (unless skipCache is true)
        if (!request.skipCache) {
            const cached = await this.getCachedAudio(textHash);
            if (cached) {
                this.cacheHits++;
                console.log(`[AudioService] Cache HIT | Hash: ${textHash.substring(0, 8)}...`);

                // Update access stats
                await this.updateCacheAccessStats(textHash);

                return {
                    audio: cached.audio,
                    audioUrl: cached.audioUrl,
                    cached: true,
                    duration: cached.duration,
                    metadata: {
                        provider,
                        voiceId,
                        textHash,
                        generationTimeMs: Date.now() - startTime,
                        characterCount: request.text.length,
                    },
                };
            }
        }

        this.cacheMisses++;
        console.log(`[AudioService] Cache MISS | Hash: ${textHash.substring(0, 8)}... | Generating with ${provider}`);

        // Get provider instance
        const audioProvider = this.providers.get(provider);
        if (!audioProvider) {
            throw new AudioProviderError(
                `Provider "${provider}" not available`,
                'PROVIDER_UNAVAILABLE',
                provider,
                false
            );
        }

        // Generate speech with fallback logic
        let result: GenerationResult;
        let actualProvider = provider;
        let actualVoiceId = voiceId;

        try {
            // Try primary provider
            result = await audioProvider.generateSpeech(request.text, voiceId, options);
        } catch (error) {
            console.error(`[AudioService] ${provider} generation failed:`, error);

            // If Kokoro fails, fallback to Edge TTS
            if (provider === 'kokoro') {
                console.warn('[AudioService] Kokoro generation failed, falling back to Edge TTS...');

                const edgeProvider = this.providers.get('edge');
                if (!edgeProvider) {
                    throw new AudioProviderError(
                        'Fallback provider (Edge TTS) not available',
                        'PROVIDER_UNAVAILABLE',
                        'edge',
                        false
                    );
                }

                // Use Edge TTS with a compatible voice
                const fallbackVoiceId = this.getFallbackVoice(voiceId);
                actualProvider = 'edge';
                actualVoiceId = fallbackVoiceId;

                console.log(`[AudioService] Fallback: Edge TTS | Voice: ${fallbackVoiceId}`);

                // Retry with Edge TTS
                try {
                    result = await edgeProvider.generateSpeech(request.text, fallbackVoiceId, options);

                    // Log successful fallback
                    console.log('[AudioService] ✓ Fallback to Edge TTS successful');
                } catch (fallbackError) {
                    console.error('[AudioService] Edge TTS fallback also failed:', fallbackError);
                    throw fallbackError;
                }
            } else {
                // For other providers, just rethrow
                throw error;
            }
        }

        // 3. Track Usage using TierManager (only if not cached)
        await tierManager.trackUsage(
            request.userId,
            request.text.length,
            actualProvider,
            actualVoiceId
        );

        // Cache result (unless noStore is true)
        let audioUrl: string | undefined;
        if (!request.noStore) {
            audioUrl = await this.cacheAudio(textHash, result.audio, {
                provider: actualProvider,
                voiceId: actualVoiceId,
                options,
                personaId: request.personaId,
                duration: result.duration,
            });
        }

        return {
            audio: result.audio,
            audioUrl,
            cached: false,
            duration: result.duration,
            metadata: {
                provider: actualProvider,
                voiceId: actualVoiceId,
                textHash,
                generationTimeMs: Date.now() - startTime,
                characterCount: request.text.length,
            },
        };
    }

    /**
     * Get a fallback voice for Edge TTS based on the original voice
     */
    private getFallbackVoice(originalVoiceId: string): string {
        // Map Kokoro voices to Edge TTS equivalents
        const voiceMap: Record<string, string> = {
            'af': 'en-US-JennyNeural',           // Female US
            'af_sarah': 'en-US-SaraNeural',      // Female US
            'am_michael': 'en-US-GuyNeural',     // Male US
            'am_adam': 'en-US-EricNeural',       // Male US
            'bf_emma': 'en-GB-LibbyNeural',      // Female UK
            'bm_george': 'en-GB-ThomasNeural',   // Male UK
        };

        return voiceMap[originalVoiceId] || 'en-US-AriaNeural';
    }


    /**
     * Create a hash for cache lookup
     */
    createTextHash(
        text: string,
        voiceId: string,
        options?: GenerationOptions
    ): string {
        const normalizedText = text.trim().toLowerCase();
        const optionsStr = options ? JSON.stringify(options) : '';
        const hashInput = `${normalizedText}|${voiceId}|${optionsStr}`;

        return createHash('sha256').update(hashInput).digest('hex');
    }

    /**
     * Get cached audio by hash
     */
    async getCachedAudio(textHash: string): Promise<{
        audio: ArrayBuffer;
        audioUrl: string;
        duration?: number;
    } | null> {
        try {
            // Query database for cache entry
            const { data: cacheEntry, error } = await this.supabase
                .from('audio_cache')
                .select('*')
                .eq('text_hash', textHash)
                .single();

            if (error || !cacheEntry) {
                return null;
            }

            // Fetch audio from storage
            const { data: audioData, error: downloadError } = await this.supabase
                .storage
                .from(this.audioCacheBucket)
                .download(cacheEntry.audio_path);

            if (downloadError || !audioData) {
                console.warn(`[AudioService] Failed to download cached audio: ${downloadError?.message}`);
                // Clean up orphaned cache entry
                await this.supabase.from('audio_cache').delete().eq('text_hash', textHash);
                return null;
            }

            const audioBuffer = await audioData.arrayBuffer();

            return {
                audio: audioBuffer,
                audioUrl: cacheEntry.audio_url,
                duration: cacheEntry.duration_seconds,
            };
        } catch (error) {
            console.error('[AudioService] Cache lookup error:', error);
            return null;
        }
    }

    /**
     * Cache generated audio
     */
    async cacheAudio(
        textHash: string,
        audioBuffer: ArrayBuffer,
        metadata: {
            provider: VoiceProvider;
            voiceId: string;
            options?: GenerationOptions;
            personaId?: string;
            duration?: number;
        }
    ): Promise<string> {
        const fileName = `${textHash}.mp3`;
        const filePath = `cache/${metadata.provider}/${fileName}`;

        try {
            // Upload to storage
            const { error: uploadError } = await this.supabase
                .storage
                .from(this.audioCacheBucket)
                .upload(filePath, audioBuffer, {
                    contentType: 'audio/mpeg',
                    upsert: true,
                });

            if (uploadError) {
                console.error('[AudioService] Failed to upload audio:', uploadError);
                throw uploadError;
            }

            // Get public URL
            const { data: urlData } = this.supabase
                .storage
                .from(this.audioCacheBucket)
                .getPublicUrl(filePath);

            const audioUrl = urlData.publicUrl;

            // Save cache entry to database
            const cacheEntry = {
                text_hash: textHash,
                voice_provider: metadata.provider,
                voice_id: metadata.voiceId,
                voice_settings: metadata.options || {},
                audio_url: audioUrl,
                audio_path: filePath,
                file_size: audioBuffer.byteLength,
                duration_seconds: metadata.duration,
                hit_count: 0,
                persona_id: metadata.personaId,
            };

            const { error: insertError } = await this.supabase
                .from('audio_cache')
                .upsert(cacheEntry, { onConflict: 'text_hash' });

            if (insertError) {
                console.error('[AudioService] Failed to save cache entry:', insertError);
                // Still return URL even if DB insert fails
            }

            console.log(`[AudioService] Cached audio | Hash: ${textHash.substring(0, 8)}... | Size: ${audioBuffer.byteLength} bytes`);

            return audioUrl;
        } catch (error) {
            console.error('[AudioService] Cache save error:', error);
            throw error;
        }
    }

    /**
     * Update cache access statistics
     */
    private async updateCacheAccessStats(textHash: string): Promise<void> {
        try {
            await this.supabase.rpc('increment_audio_cache_hits', {
                cache_hash: textHash,
            });
        } catch (error) {
            // Non-critical, just log
            console.warn('[AudioService] Failed to update cache stats:', error);
        }
    }

    /**
     * Get persona voice settings
     */
    private async getPersonaVoiceSettings(personaId: string): Promise<PersonaVoiceSettings | null> {
        try {
            const { data, error } = await this.supabase
                .from('personas')
                .select('voice_provider, voice_id, voice_settings')
                .eq('id', personaId)
                .single();

            if (error) {
                console.warn(`[AudioService] Failed to get persona settings: ${error.message}`);
                return null;
            }

            return data;
        } catch (error) {
            console.error('[AudioService] Error fetching persona settings:', error);
            return null;
        }
    }

    /**
     * Clear cache entries based on criteria
     */
    async clearCache(options: CacheCleanupOptions = {}): Promise<CacheCleanupResult> {
        const {
            olderThanDays = 30,
            minHitCount = 0,
            maxSizeBytes,
            maxEntries,
            dryRun = false,
        } = options;

        console.log(`[AudioService] Starting cache cleanup | DryRun: ${dryRun} | OlderThan: ${olderThanDays} days`);

        let query = this.supabase
            .from('audio_cache')
            .select('id, text_hash, audio_path, file_size, hit_count, created_at');

        // Apply filters
        if (olderThanDays > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            query = query.lt('created_at', cutoffDate.toISOString());
        }

        if (minHitCount > 0) {
            query = query.lt('hit_count', minHitCount);
        }

        const { data: entries, error } = await query;

        if (error) {
            throw new Error(`Failed to query cache entries: ${error.message}`);
        }

        let deletedCount = 0;
        let freedBytes = 0;

        if (entries && !dryRun) {
            for (const entry of entries) {
                try {
                    // Delete from storage
                    await this.supabase
                        .storage
                        .from(this.audioCacheBucket)
                        .remove([entry.audio_path]);

                    // Delete from database
                    await this.supabase
                        .from('audio_cache')
                        .delete()
                        .eq('id', entry.id);

                    deletedCount++;
                    freedBytes += entry.file_size || 0;
                } catch (err) {
                    console.warn(`[AudioService] Failed to delete cache entry: ${entry.id}`, err);
                }
            }
        } else if (entries) {
            // Dry run - just count
            deletedCount = entries.length;
            freedBytes = entries.reduce((sum, e) => sum + (e.file_size || 0), 0);
        }

        // Get remaining stats
        const { count: remainingCount } = await this.supabase
            .from('audio_cache')
            .select('*', { count: 'exact', head: true });

        const { data: sizeData } = await this.supabase
            .from('audio_cache')
            .select('file_size');

        const remainingBytes = sizeData?.reduce((sum, e) => sum + (e.file_size || 0), 0) || 0;

        console.log(`[AudioService] Cache cleanup complete | Deleted: ${deletedCount} | Freed: ${freedBytes} bytes`);

        return {
            deletedCount,
            freedBytes,
            remainingCount: remainingCount || 0,
            remainingBytes,
        };
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<CacheStats> {
        // Total entries and size
        const { data: aggregates } = await this.supabase
            .from('audio_cache')
            .select('file_size, created_at, voice_id')
            .order('created_at', { ascending: true });

        const totalEntries = aggregates?.length || 0;
        const totalSizeBytes = aggregates?.reduce((sum, e) => sum + (e.file_size || 0), 0) || 0;
        const oldestEntryDate = aggregates?.[0]?.created_at
            ? new Date(aggregates[0].created_at)
            : null;

        // Voice usage stats
        const voiceCount: Record<string, number> = {};
        for (const entry of aggregates || []) {
            voiceCount[entry.voice_id] = (voiceCount[entry.voice_id] || 0) + 1;
        }

        const topVoices = Object.entries(voiceCount)
            .map(([voiceId, count]) => ({ voiceId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate hit rate
        const totalRequests = this.cacheHits + this.cacheMisses;
        const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;

        return {
            totalEntries,
            totalSizeBytes,
            oldestEntryDate,
            hitRate,
            topVoices,
        };
    }

    /**
     * List voices from a provider
     */
    async listVoices(provider: VoiceProvider = 'edge', locale?: string): Promise<Voice[]> {
        const audioProvider = this.providers.get(provider);
        if (!audioProvider) {
            throw new AudioProviderError(
                `Provider "${provider}" not available`,
                'PROVIDER_UNAVAILABLE',
                provider,
                false
            );
        }

        return audioProvider.listVoices(locale);
    }

    /**
     * Get voice info
     */
    async getVoiceInfo(provider: VoiceProvider, voiceId: string): Promise<VoiceInfo> {
        const audioProvider = this.providers.get(provider);
        if (!audioProvider) {
            throw new AudioProviderError(
                `Provider "${provider}" not available`,
                'PROVIDER_UNAVAILABLE',
                provider,
                false
            );
        }

        return audioProvider.getVoiceInfo(voiceId);
    }

    /**
     * Get provider status
     */
    async getProviderStatus(provider: VoiceProvider): Promise<ProviderStatus> {
        const audioProvider = this.providers.get(provider);
        if (!audioProvider) {
            return {
                available: false,
                name: provider,
                message: 'Provider not registered',
                lastChecked: new Date(),
            };
        }

        return audioProvider.getStatus();
    }

    /**
     * Get all provider statuses
     */
    async getAllProviderStatuses(): Promise<Map<VoiceProvider, ProviderStatus>> {
        const statuses = new Map<VoiceProvider, ProviderStatus>();

        for (const [name, provider] of this.providers) {
            statuses.set(name, await provider.getStatus());
        }

        return statuses;
    }
}

// ============================================================================
// Factory & Singleton
// ============================================================================

let defaultAudioService: AudioService | null = null;

/**
 * Create a new AudioService instance
 */
export function createAudioService(supabaseClient?: SupabaseClient): AudioService {
    return new AudioService(supabaseClient);
}

/**
 * Get the default AudioService singleton
 */
export function getAudioService(): AudioService {
    if (!defaultAudioService) {
        defaultAudioService = new AudioService();
    }
    return defaultAudioService;
}

export default AudioService;
