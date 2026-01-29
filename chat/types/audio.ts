/**
 * Audio System Types
 * Shared types for audio management, TTS generation, and voice settings
 */

import { z } from 'zod';

/**
 * Voice Provider Types
 */
export type VoiceProvider = 'edge' | 'kokoro' | 'elevenlabs' | 'qwen3';


/**
 * Voice Types
 */
export interface Voice {
    id: string;
    name: string;
    gender: 'Male' | 'Female';
    language: string;
    locale: string;
    provider: VoiceProvider;
    previewUrl?: string;
    tags?: string[];
    sampleRate?: number;
    description?: string;
    isNeural?: boolean;
    styles?: string[];
}

export interface VoiceFilter {
    provider?: VoiceProvider;
    language?: string;
    gender?: 'Male' | 'Female';
    search?: string;
}

/**
 * Audio File Validation
 */
export const ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/m4a',
] as const;

export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Database Schema Types
 */
export interface PersonaAudioSettings {
    voice_provider: VoiceProvider | null;
    voice_id: string | null;
    voice_settings: Record<string, unknown> | null;
    welcome_audio_url: string | null;
}

export interface AudioCacheEntry {
    id: string;
    text_hash: string;
    voice_provider: VoiceProvider;
    voice_id: string;
    voice_settings: Record<string, unknown>;
    audio_url: string;
    audio_path: string;
    file_size: number;
    duration_seconds: number | null;
    hit_count: number;
    last_accessed_at: string;
    created_at: string;
}

/**
 * Zod Validation Schemas
 */

// Audio Upload Request
export const audioUploadSchema = z.object({
    personaId: z.string().uuid('Invalid persona ID'),
    file: z.custom<File>((val) => val instanceof File, 'File is required'),
});

export type AudioUploadRequest = z.infer<typeof audioUploadSchema>;

// Audio Upload Response
export const audioUploadResponseSchema = z.object({
    success: z.boolean(),
    audioUrl: z.string().url().optional(),
    error: z.string().optional(),
});

export type AudioUploadResponse = z.infer<typeof audioUploadResponseSchema>;

// Voice Settings Update Request
export const voiceSettingsUpdateSchema = z.object({
    voice_provider: z.enum(['edge', 'kokoro', 'elevenlabs', 'qwen3']).optional(),
    voice_id: z.string().optional(),
    voice_settings: z.record(z.unknown()).optional(),
});

export type VoiceSettingsUpdateRequest = z.infer<typeof voiceSettingsUpdateSchema>;

// TTS Generation Request
export const ttsGenerateSchema = z.object({
    text: z.string().min(1, 'Text is required').max(5000, 'Text too long'),
    personaId: z.string().uuid('Invalid persona ID'),
    voiceId: z.string().optional(),
    provider: z.enum(['edge', 'kokoro', 'elevenlabs', 'qwen3']).optional(),
    settings: z.record(z.unknown()).optional(),
});

export type TTSGenerateRequest = z.infer<typeof ttsGenerateSchema>;

// TTS Generation Response
export const ttsGenerateResponseSchema = z.object({
    success: z.boolean(),
    audioUrl: z.string().url().optional(),
    cached: z.boolean(),
    duration: z.number().optional(),
    error: z.string().optional(),
});

export type TTSGenerateResponse = z.infer<typeof ttsGenerateResponseSchema>;

// Cache Cleanup Request
export const cacheCleanupSchema = z.object({
    olderThanDays: z.number().min(1).max(365).default(30),
    minHitCount: z.number().min(0).default(0),
});

export type CacheCleanupRequest = z.infer<typeof cacheCleanupSchema>;

// Cache Cleanup Response
export const cacheCleanupResponseSchema = z.object({
    success: z.boolean(),
    deletedCount: z.number(),
    freedBytes: z.number(),
    error: z.string().optional(),
});

export type CacheCleanupResponse = z.infer<typeof cacheCleanupResponseSchema>;

/**
 * API Error Types
 */
export class AudioAPIError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'AudioAPIError';
    }
}

/**
 * Utility Types
 */
export interface AudioMetadata {
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
}

export interface StorageUploadResult {
    path: string;
    url: string;
    size: number;
}

/**
 * Cache Management Types
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

export interface CleanupStats {
    deletedCount: number;
    freedBytes: number;
    oldestEntryAge?: number;
    errors: string[];
}

export interface CacheConfig {
    maxEntries?: number;
    maxSizeBytes?: number;
    maxAgeHours?: number;
}

export interface CachedAudio {
    id: string;
    audioUrl: string;
    duration: number | null;
    fileSize: number;
    hitCount: number;
    lastAccessed: Date;
    createdAt: Date;
}

// Cache Stats API Response
export const cacheStatsResponseSchema = z.object({
    success: z.boolean(),
    stats: z.object({
        totalEntries: z.number(),
        totalSize: z.number(),
        totalSizeFormatted: z.string(),
        hitRate: z.string(),
        oldestEntry: z.string().nullable(),
        newestEntry: z.string().nullable(),
        averageFileSize: z.number(),
        averageFileSizeFormatted: z.string(),
        topVoices: z.array(z.object({
            voiceId: z.string(),
            count: z.number(),
        })),
    }),
});

export type CacheStatsResponse = z.infer<typeof cacheStatsResponseSchema>;
