/**
 * AudioProvider Interface
 * 
 * Common interface for all TTS providers (Edge TTS, Kokoro, ElevenLabs).
 * Provides a unified API for text-to-speech generation, voice listing,
 * and voice information retrieval.
 */

import { VoiceProvider } from '@/types/audio';

/**
 * Voice gender types
 */
export type VoiceGender = 'male' | 'female' | 'neutral' | 'unknown';

/**
 * Voice quality/style categories
 */
export type VoiceStyle =
    | 'natural'
    | 'expressive'
    | 'newscast'
    | 'customer-service'
    | 'narration'
    | 'chat'
    | 'assistant'
    | 'default';

/**
 * Voice information returned by providers
 */
export interface Voice {
    /** Unique voice identifier */
    id: string;
    /** Display name for the voice */
    name: string;
    /** Provider name */
    provider: VoiceProvider;
    /** Language code (e.g., 'en-US', 'ja-JP') */
    locale: string;
    /** Language display name */
    language: string;
    /** Voice gender */
    gender: VoiceGender;
    /** Voice speaking styles */
    styles: VoiceStyle[];
    /** Whether this voice is a neural/premium voice */
    isNeural: boolean;
    /** Sample audio URL if available */
    sampleUrl?: string;
    /** Additional voice-specific metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Detailed voice information
 */
export interface VoiceInfo extends Voice {
    /** Detailed description */
    description?: string;
    /** Supported SSML features */
    ssmlFeatures: SSMLFeatures;
    /** Voice quality rating (1-5) */
    qualityRating?: number;
    /** Whether pitch adjustment is supported */
    supportsPitchAdjustment: boolean;
    /** Whether rate adjustment is supported */
    supportsRateAdjustment: boolean;
    /** Whether volume adjustment is supported */
    supportsVolumeAdjustment: boolean;
    /** Supported output formats */
    outputFormats: AudioOutputFormat[];
}

/**
 * SSML features supported by a voice
 */
export interface SSMLFeatures {
    /** Supports <emphasis> tag */
    emphasis: boolean;
    /** Supports <prosody> tag */
    prosody: boolean;
    /** Supports <break> tag */
    break: boolean;
    /** Supports <say-as> tag */
    sayAs: boolean;
    /** Supports <phoneme> tag */
    phoneme: boolean;
    /** Supports <mstts:express-as> (Microsoft voices) */
    expressAs: boolean;
}

/**
 * Audio output format options
 */
export type AudioOutputFormat =
    | 'mp3'
    | 'wav'
    | 'ogg'
    | 'webm'
    | 'opus';

/**
 * Speech generation options
 */
export interface GenerationOptions {
    /** Speech rate (0.5 to 2.0, default 1.0) */
    rate?: number;
    /** Speech pitch adjustment (-50% to +50%, default 0) */
    pitch?: number;
    /** Speech volume (0 to 100, default 100) */
    volume?: number;
    /** Voice style to use */
    style?: VoiceStyle;
    /** Style intensity (0 to 2, default 1) */
    styleIntensity?: number;
    /** Output audio format */
    format?: AudioOutputFormat;
    /** Use SSML input (text contains SSML markup) */
    useSSML?: boolean;
    /** Custom SSML wrapper (if useSSML is true) */
    ssmlWrapper?: string;
}

/**
 * Default generation options
 */
export const DEFAULT_GENERATION_OPTIONS: Required<Omit<GenerationOptions, 'ssmlWrapper'>> = {
    rate: 1.0,
    pitch: 0,
    volume: 100,
    style: 'default',
    styleIntensity: 1.0,
    format: 'mp3',
    useSSML: false,
};

/**
 * Speech generation result
 */
export interface GenerationResult {
    /** Audio data */
    audio: ArrayBuffer;
    /** Audio format */
    format: AudioOutputFormat;
    /** Duration in seconds (if available) */
    duration?: number;
    /** File size in bytes */
    size: number;
    /** Voice ID used */
    voiceId: string;
    /** Generation metadata */
    metadata: GenerationMetadata;
}

/**
 * Metadata about the generation process
 */
export interface GenerationMetadata {
    /** Provider used */
    provider: VoiceProvider;
    /** Time taken to generate (ms) */
    generationTimeMs: number;
    /** Characters processed */
    characterCount: number;
    /** Timestamp of generation */
    timestamp: Date;
    /** Request ID for tracking */
    requestId?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window size in milliseconds */
    windowMs: number;
    /** Maximum concurrent requests */
    maxConcurrent: number;
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    maxConcurrent: 5,
};

/**
 * Retry configuration
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial delay between retries (ms) */
    initialDelayMs: number;
    /** Maximum delay between retries (ms) */
    maxDelayMs: number;
    /** Exponential backoff multiplier */
    backoffMultiplier: number;
    /** Jitter factor (0-1) to add randomness */
    jitterFactor: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
};

/**
 * Provider status information
 */
export interface ProviderStatus {
    /** Whether the provider is available */
    available: boolean;
    /** Provider name */
    name: string;
    /** Status message */
    message?: string;
    /** Last health check timestamp */
    lastChecked: Date;
    /** Average response time (ms) */
    avgResponseTimeMs?: number;
    /** Error rate in last hour (0-1) */
    errorRate?: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error for audio provider errors
 */
export class AudioProviderError extends Error {
    constructor(
        message: string,
        public readonly code: AudioErrorCode,
        public readonly provider: VoiceProvider,
        public readonly isRetryable: boolean = false,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'AudioProviderError';
    }
}

/**
 * Error codes for audio provider errors
 */
export type AudioErrorCode =
    | 'NETWORK_ERROR'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_VOICE'
    | 'INVALID_TEXT'
    | 'TEXT_TOO_LONG'
    | 'AUTH_ERROR'
    | 'PROVIDER_UNAVAILABLE'
    | 'GENERATION_FAILED'
    | 'INVALID_OPTIONS'
    | 'TIMEOUT'
    | 'UNKNOWN_ERROR';

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AudioProviderError {
    constructor(
        provider: VoiceProvider,
        public readonly retryAfterMs?: number
    ) {
        super(
            `Rate limit exceeded for ${provider}`,
            'RATE_LIMIT_EXCEEDED',
            provider,
            true
        );
        this.name = 'RateLimitError';
    }
}

/**
 * Voice not found error
 */
export class InvalidVoiceError extends AudioProviderError {
    constructor(
        provider: VoiceProvider,
        public readonly voiceId: string
    ) {
        super(
            `Voice "${voiceId}" not found in ${provider}`,
            'INVALID_VOICE',
            provider,
            false
        );
        this.name = 'InvalidVoiceError';
    }
}

/**
 * Text validation error
 */
export class InvalidTextError extends AudioProviderError {
    constructor(
        provider: VoiceProvider,
        message: string
    ) {
        super(message, 'INVALID_TEXT', provider, false);
        this.name = 'InvalidTextError';
    }
}

/**
 * Timeout error
 */
export class TimeoutError extends AudioProviderError {
    constructor(
        provider: VoiceProvider,
        public readonly timeoutMs: number
    ) {
        super(
            `Request to ${provider} timed out after ${timeoutMs}ms`,
            'TIMEOUT',
            provider,
            true
        );
        this.name = 'TimeoutError';
    }
}

// ============================================================================
// Audio Provider Interface
// ============================================================================

/**
 * Audio Provider Interface
 * 
 * All TTS providers must implement this interface to ensure consistent
 * behavior across different providers (Edge TTS, Kokoro, ElevenLabs).
 */
export interface IAudioProvider {
    /** Provider name */
    readonly name: VoiceProvider;

    /** Whether this provider requires API key */
    readonly requiresApiKey: boolean;

    /** Maximum text length supported */
    readonly maxTextLength: number;

    /**
     * Generate speech from text
     * @param text - The text to convert to speech
     * @param voiceId - The voice ID to use
     * @param options - Generation options
     * @returns Generated audio result
     */
    generateSpeech(
        text: string,
        voiceId: string,
        options?: GenerationOptions
    ): Promise<GenerationResult>;

    /**
     * List all available voices
     * @param locale - Optional locale filter (e.g., 'en', 'en-US')
     * @returns List of available voices
     */
    listVoices(locale?: string): Promise<Voice[]>;

    /**
     * Get detailed information about a voice
     * @param voiceId - The voice ID
     * @returns Detailed voice information
     */
    getVoiceInfo(voiceId: string): Promise<VoiceInfo>;

    /**
     * Check if the provider is available and healthy
     * @returns Provider status
     */
    getStatus(): Promise<ProviderStatus>;

    /**
     * Validate that a voice ID exists
     * @param voiceId - The voice ID to validate
     * @returns True if voice exists
     */
    validateVoice(voiceId: string): Promise<boolean>;

    /**
     * Get a sample/preview audio for a voice
     * @param voiceId - The voice ID
     * @param sampleText - Optional sample text (defaults to provider's sample)
     * @returns Sample audio result
     */
    getVoiceSample?(
        voiceId: string,
        sampleText?: string
    ): Promise<GenerationResult>;

    /**
     * Clone a voice from an audio sample
     * @param name - Name of the new voice
     * @param audioUrl - URL or path to the reference audio file
     * @returns The new voice ID
     */
    cloneVoice?(
        name: string,
        audioUrl: string
    ): Promise<string>;
}

/**
 * Abstract base class for audio providers
 * Provides common functionality and helpers
 */
export abstract class BaseAudioProvider implements IAudioProvider {
    abstract readonly name: VoiceProvider;
    abstract readonly requiresApiKey: boolean;
    abstract readonly maxTextLength: number;

    protected retryConfig: RetryConfig;
    protected rateLimitConfig: RateLimitConfig;

    constructor(
        retryConfig: Partial<RetryConfig> = {},
        rateLimitConfig: Partial<RateLimitConfig> = {}
    ) {
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT, ...rateLimitConfig };
    }

    abstract generateSpeech(
        text: string,
        voiceId: string,
        options?: GenerationOptions
    ): Promise<GenerationResult>;

    abstract listVoices(locale?: string): Promise<Voice[]>;
    abstract getVoiceInfo(voiceId: string): Promise<VoiceInfo>;
    abstract getStatus(): Promise<ProviderStatus>;

    async validateVoice(voiceId: string): Promise<boolean> {
        try {
            await this.getVoiceInfo(voiceId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate text before generation
     */
    protected validateText(text: string): void {
        if (!text || typeof text !== 'string') {
            throw new InvalidTextError(this.name, 'Text is required');
        }

        const trimmedText = text.trim();
        if (trimmedText.length === 0) {
            throw new InvalidTextError(this.name, 'Text cannot be empty');
        }

        if (trimmedText.length > this.maxTextLength) {
            throw new InvalidTextError(
                this.name,
                `Text exceeds maximum length of ${this.maxTextLength} characters`
            );
        }
    }

    /**
     * Calculate delay for retry with exponential backoff
     */
    protected calculateRetryDelay(attempt: number): number {
        const delay = this.retryConfig.initialDelayMs *
            Math.pow(this.retryConfig.backoffMultiplier, attempt);

        const cappedDelay = Math.min(delay, this.retryConfig.maxDelayMs);

        // Add jitter
        const jitter = cappedDelay * this.retryConfig.jitterFactor * Math.random();

        return Math.floor(cappedDelay + jitter);
    }

    /**
     * Execute with retry logic
     */
    protected async withRetry<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Check if error is retryable
                if (error instanceof AudioProviderError && !error.isRetryable) {
                    throw error;
                }

                // Don't retry on last attempt
                if (attempt === this.retryConfig.maxRetries) {
                    break;
                }

                // Calculate and wait for retry delay
                const delay = this.calculateRetryDelay(attempt);
                console.log(
                    `[${this.name}] ${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}), ` +
                    `retrying in ${delay}ms...`,
                    lastError.message
                );

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError || new Error(`${operationName} failed after retries`);
    }

    /**
     * Merge options with defaults
     */
    protected mergeOptions(options?: GenerationOptions): Required<Omit<GenerationOptions, 'ssmlWrapper'>> & Pick<GenerationOptions, 'ssmlWrapper'> {
        return {
            ...DEFAULT_GENERATION_OPTIONS,
            ...options,
        };
    }

    /**
     * Generate a request ID for tracking
     */
    protected generateRequestId(): string {
        return `${this.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Log generation performance metrics
     */
    protected logMetrics(
        operation: string,
        startTime: number,
        textLength: number,
        success: boolean
    ): void {
        const duration = Date.now() - startTime;
        console.log(
            `[${this.name}] ${operation}: ` +
            `${success ? 'success' : 'failed'} | ` +
            `${duration}ms | ` +
            `${textLength} chars`
        );
    }
}
