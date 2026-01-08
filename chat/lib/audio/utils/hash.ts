/**
 * Audio Hashing Utilities
 * Generates deterministic hashes for audio cache keys
 */

import crypto from 'crypto';

/**
 * Voice configuration for hash generation
 */
export interface VoiceConfig {
    voiceId: string;
    provider: string;
    settings?: Record<string, unknown>;
}

/**
 * Creates a deterministic hash for text + voice configuration
 * Used as the primary cache key for audio files
 * 
 * @param text - The text to be converted to speech
 * @param voiceId - The voice identifier
 * @param options - Additional voice settings that affect output
 * @returns MD5 hash string (32 characters)
 * 
 * @example
 * ```ts
 * const hash = createTextHash(
 *   "Hello world",
 *   "en-US-AriaNeural",
 *   { rate: 1.0, pitch: 0 }
 * );
 * // Returns: "a1b2c3d4e5f6..."
 * ```
 */
export function createTextHash(
    text: string,
    voiceId: string,
    options?: Record<string, unknown>
): string {
    // Normalize the input to ensure consistent hashing
    const normalizedText = text.trim().toLowerCase();
    const normalizedVoiceId = voiceId.trim();

    // Sort options keys for consistent ordering
    const sortedOptions = options
        ? Object.keys(options)
            .sort()
            .reduce((acc, key) => {
                acc[key] = options[key];
                return acc;
            }, {} as Record<string, unknown>)
        : {};

    // Create a deterministic string representation
    const hashInput = JSON.stringify({
        text: normalizedText,
        voiceId: normalizedVoiceId,
        options: sortedOptions,
    });

    // Generate MD5 hash (fast and sufficient for cache keys)
    return crypto
        .createHash('md5')
        .update(hashInput)
        .digest('hex');
}

/**
 * Creates a SHA-256 hash for more secure scenarios
 * Use this for sensitive data or when collision resistance is critical
 * 
 * @param text - The text to be converted to speech
 * @param voiceId - The voice identifier
 * @param options - Additional voice settings
 * @returns SHA-256 hash string (64 characters)
 */
export function createSecureTextHash(
    text: string,
    voiceId: string,
    options?: Record<string, unknown>
): string {
    const normalizedText = text.trim().toLowerCase();
    const normalizedVoiceId = voiceId.trim();

    const sortedOptions = options
        ? Object.keys(options)
            .sort()
            .reduce((acc, key) => {
                acc[key] = options[key];
                return acc;
            }, {} as Record<string, unknown>)
        : {};

    const hashInput = JSON.stringify({
        text: normalizedText,
        voiceId: normalizedVoiceId,
        options: sortedOptions,
    });

    return crypto
        .createHash('sha256')
        .update(hashInput)
        .digest('hex');
}

/**
 * Creates a hash from a complete voice configuration object
 * Useful when you have a structured config object
 * 
 * @param text - The text to be converted to speech
 * @param config - Voice configuration object
 * @returns MD5 hash string
 */
export function createVoiceConfigHash(
    text: string,
    config: VoiceConfig
): string {
    return createTextHash(text, config.voiceId, {
        provider: config.provider,
        ...config.settings,
    });
}

/**
 * Validates that a hash matches the expected format
 * 
 * @param hash - The hash string to validate
 * @param type - Hash type: 'md5' (32 chars) or 'sha256' (64 chars)
 * @returns true if valid, false otherwise
 */
export function isValidHash(hash: string, type: 'md5' | 'sha256' = 'md5'): boolean {
    const expectedLength = type === 'md5' ? 32 : 64;
    const hexPattern = /^[a-f0-9]+$/i;

    return hash.length === expectedLength && hexPattern.test(hash);
}

/**
 * Creates a short hash for display purposes (first 8 characters)
 * Useful for logging and debugging
 * 
 * @param text - The text to hash
 * @param voiceId - The voice identifier
 * @param options - Additional voice settings
 * @returns Short hash string (8 characters)
 */
export function createShortHash(
    text: string,
    voiceId: string,
    options?: Record<string, unknown>
): string {
    return createTextHash(text, voiceId, options).substring(0, 8);
}
