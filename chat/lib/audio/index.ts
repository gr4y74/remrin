/**
 * Audio System - Main Export Index
 * Centralized exports for audio caching and management
 */

// Core Audio Service
export { AudioService, createAudioService, getAudioService } from './AudioService';
export type {
    AudioGenerationRequest,
    AudioGenerationResponse,
    CacheStats,
    CacheCleanupOptions,
    CacheCleanupResult,
} from './AudioService';

// Core cache manager
export { AudioCacheManager, getAudioCache } from './AudioCacheManager';

// Hash utilities
export {
    createTextHash,
    createSecureTextHash,
    createVoiceConfigHash,
    createShortHash,
    isValidHash,
} from './utils/hash';

// Audio sync manager (existing)
export { AudioSyncManager } from './AudioSyncManager';

// Tier management
export {
    TierManager,
    getTierManager,
    canUseProvider,
    checkQuota,
    getAvailableProviders,
    getRemainingQuota,
    getQuotaStatus,
    TIER_DEFINITIONS,
} from './TierManager';
export type { AudioTier, TierDefinition, QuotaStatus, ProviderAccess } from './TierManager';

// Providers
export * from './providers';

// Types (re-export from types/audio.ts for convenience)
export type {
    CachedAudio,
    AudioMetadata,
    VoiceProvider,
    AudioCacheEntry,
    PersonaAudioSettings,
} from '@/types/audio';
