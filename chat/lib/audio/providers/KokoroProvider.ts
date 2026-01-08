/**
 * KokoroProvider
 * 
 * Production-ready integration for Kokoro-82M high-quality local TTS model.
 * Connects to a local inference server (e.g., FastAPI/Python) running on port 8880.
 * 
 * Features:
 * - Extremely high quality neural voices
 * - Low latency (if running locally)
 * - Cost effective (free inference)
 * - Timeout handling (30s max)
 * - Request queuing to prevent server overload
 * - Retry logic with exponential backoff
 * - Comprehensive error handling and logging
 */

import {
    BaseAudioProvider,
    Voice,
    VoiceInfo,
    VoiceGender,
    VoiceStyle,
    GenerationOptions,
    GenerationResult,
    ProviderStatus,
    AudioProviderError,
    TimeoutError,
    InvalidVoiceError,
    RetryConfig,
    RateLimitConfig,
} from './AudioProvider.interface';

// ============================================================================
// Constants
// ============================================================================

/** Default local inference URL */
const KOKORO_API_URL = process.env.KOKORO_API_URL || 'http://localhost:8880/v1';

/** Maximum text length supported by Kokoro */
const MAX_TEXT_LENGTH = 2000;

/** Request timeout in milliseconds (30 seconds) */
const REQUEST_TIMEOUT = 30000;

/** Maximum concurrent requests to prevent server overload */
const MAX_CONCURRENT_REQUESTS = 3;

/** Maximum queue size before rejecting new requests */
const MAX_QUEUE_SIZE = 10;

// ============================================================================
// Types
// ============================================================================

interface QueuedRequest {
    resolve: (value: ArrayBuffer) => void;
    reject: (reason: Error) => void;
    text: string;
    voiceId: string;
    options: Required<Omit<GenerationOptions, 'ssmlWrapper'>> & Pick<GenerationOptions, 'ssmlWrapper'>;
    requestId: string;
}

interface KokoroHealthResponse {
    status: 'healthy' | 'degraded' | 'down';
    uptime?: number;
    queueSize?: number;
}

// ============================================================================
// Kokoro Provider
// ============================================================================

export class KokoroProvider extends BaseAudioProvider {
    readonly name = 'kokoro' as const;
    readonly requiresApiKey = false;
    readonly maxTextLength = MAX_TEXT_LENGTH;

    private requestQueue: QueuedRequest[] = [];
    private activeRequests = 0;
    private isProcessingQueue = false;

    constructor(
        retryConfig?: Partial<RetryConfig>,
        rateLimitConfig?: Partial<RateLimitConfig>
    ) {
        super(retryConfig, rateLimitConfig);
        console.log(`[Kokoro] Provider initialized | API URL: ${KOKORO_API_URL}`);
    }

    /**
     * Generate speech from text using Kokoro
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        options?: GenerationOptions
    ): Promise<GenerationResult> {
        const startTime = Date.now();
        const requestId = this.generateRequestId();

        console.log(`[Kokoro] Starting generation | Request: ${requestId} | Voice: ${voiceId} | Length: ${text.length} chars`);

        // Validate input
        this.validateText(text);

        // Merge options with defaults
        const opts = this.mergeOptions(options);

        // Validate voice exists
        const voiceExists = await this.validateVoice(voiceId);
        if (!voiceExists) {
            throw new InvalidVoiceError('kokoro', voiceId);
        }

        try {
            // Generate with retry logic
            const audioBuffer = await this.withRetry(
                () => this.queueGeneration(text, voiceId, opts, requestId),
                'generateSpeech'
            );

            this.logMetrics('generateSpeech', startTime, text.length, true);

            return {
                audio: audioBuffer,
                format: opts.format,
                size: audioBuffer.byteLength,
                voiceId,
                metadata: {
                    provider: 'kokoro',
                    generationTimeMs: Date.now() - startTime,
                    characterCount: text.length,
                    timestamp: new Date(),
                    requestId,
                },
            };
        } catch (error) {
            this.logMetrics('generateSpeech', startTime, text.length, false);

            // Map error to appropriate type
            if (error instanceof AudioProviderError) {
                throw error;
            }

            throw new AudioProviderError(
                `Kokoro generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'GENERATION_FAILED',
                'kokoro',
                true // Retryable
            );
        }
    }

    /**
     * Queue a generation request to prevent server overload
     */
    private async queueGeneration(
        text: string,
        voiceId: string,
        options: Required<Omit<GenerationOptions, 'ssmlWrapper'>> & Pick<GenerationOptions, 'ssmlWrapper'>,
        requestId: string
    ): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            // Check queue size
            if (this.requestQueue.length >= MAX_QUEUE_SIZE) {
                reject(new AudioProviderError(
                    `Request queue full (${MAX_QUEUE_SIZE} requests pending)`,
                    'RATE_LIMIT_EXCEEDED',
                    'kokoro',
                    true
                ));
                return;
            }

            // Add to queue
            this.requestQueue.push({
                resolve,
                reject,
                text,
                voiceId,
                options,
                requestId,
            });

            console.log(`[Kokoro] Request queued | Queue size: ${this.requestQueue.length} | Active: ${this.activeRequests}/${MAX_CONCURRENT_REQUESTS}`);

            // Start processing queue
            this.processQueue();
        });
    }

    /**
     * Process queued requests with concurrency control
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0 && this.activeRequests < MAX_CONCURRENT_REQUESTS) {
            const request = this.requestQueue.shift();
            if (!request) break;

            this.activeRequests++;

            // Process request asynchronously
            this.performGeneration(request)
                .then(request.resolve)
                .catch(request.reject)
                .finally(() => {
                    this.activeRequests--;
                    this.processQueue(); // Process next in queue
                });
        }

        this.isProcessingQueue = false;
    }

    /**
     * Perform the actual TTS generation with timeout
     */
    private async performGeneration(request: QueuedRequest): Promise<ArrayBuffer> {
        const { text, voiceId, options, requestId } = request;

        console.log(`[Kokoro] Processing request | ID: ${requestId} | Queue: ${this.requestQueue.length}`);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(`${KOKORO_API_URL}/audio/speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                },
                body: JSON.stringify({
                    input: text,
                    voice: voiceId,
                    speed: options.rate,
                    response_format: options.format,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new AudioProviderError(
                    `Kokoro API error: ${response.status} ${response.statusText} - ${errorText}`,
                    response.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'GENERATION_FAILED',
                    'kokoro',
                    response.status >= 500 || response.status === 429
                );
            }

            const audioBuffer = await response.arrayBuffer();

            console.log(`[Kokoro] Generation complete | ID: ${requestId} | Size: ${audioBuffer.byteLength} bytes`);

            return audioBuffer;

        } catch (error) {
            clearTimeout(timeoutId);

            // Handle timeout
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError('kokoro', REQUEST_TIMEOUT);
            }

            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new AudioProviderError(
                    'Cannot connect to Kokoro server - Is it running?',
                    'NETWORK_ERROR',
                    'kokoro',
                    true
                );
            }

            throw error;
        }
    }

    /**
     * List available Kokoro voices
     */
    async listVoices(locale?: string): Promise<Voice[]> {
        // Known Kokoro-82M voices
        // In production, this could be fetched from the API endpoint
        const voices: Voice[] = [
            { id: 'af', name: 'Bella', locale: 'en-US', language: 'English (US)', gender: 'female', styles: ['natural'], isNeural: true, provider: 'kokoro' },
            { id: 'af_sarah', name: 'Sarah', locale: 'en-US', language: 'English (US)', gender: 'female', styles: ['natural'], isNeural: true, provider: 'kokoro' },
            { id: 'am_michael', name: 'Michael', locale: 'en-US', language: 'English (US)', gender: 'male', styles: ['natural'], isNeural: true, provider: 'kokoro' },
            { id: 'am_adam', name: 'Adam', locale: 'en-US', language: 'English (US)', gender: 'male', styles: ['natural'], isNeural: true, provider: 'kokoro' },
            { id: 'bf_emma', name: 'Emma', locale: 'en-GB', language: 'English (UK)', gender: 'female', styles: ['natural'], isNeural: true, provider: 'kokoro' },
            { id: 'bm_george', name: 'George', locale: 'en-GB', language: 'English (UK)', gender: 'male', styles: ['natural'], isNeural: true, provider: 'kokoro' },
        ];

        return locale
            ? voices.filter(v => v.locale.toLowerCase().startsWith(locale.toLowerCase()))
            : voices;
    }

    /**
     * Get detailed voice information
     */
    async getVoiceInfo(voiceId: string): Promise<VoiceInfo> {
        const voices = await this.listVoices();
        const voice = voices.find(v => v.id === voiceId);

        if (!voice) {
            throw new InvalidVoiceError('kokoro', voiceId);
        }

        return {
            ...voice,
            ssmlFeatures: {
                emphasis: false,
                prosody: false,
                break: false,
                sayAs: false,
                phoneme: false,
                expressAs: false,
            },
            supportsPitchAdjustment: false,
            supportsRateAdjustment: true,
            supportsVolumeAdjustment: false,
            outputFormats: ['mp3', 'wav', 'opus'],
        };
    }

    /**
     * Get provider status with health check
     */
    async getStatus(): Promise<ProviderStatus> {
        try {
            const startTime = Date.now();

            const response = await fetch(`${KOKORO_API_URL}/health`, {
                signal: AbortSignal.timeout(5000), // 5s timeout for health check
            });

            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                return {
                    available: false,
                    name: 'Kokoro-82M',
                    message: `Server error: ${response.status} ${response.statusText}`,
                    lastChecked: new Date(),
                };
            }

            // Try to parse health response
            let healthData: KokoroHealthResponse | null = null;
            try {
                healthData = await response.json();
            } catch {
                // Ignore JSON parse errors
            }

            return {
                available: true,
                name: 'Kokoro-82M',
                message: `Operational | Queue: ${this.requestQueue.length}/${MAX_QUEUE_SIZE} | Active: ${this.activeRequests}/${MAX_CONCURRENT_REQUESTS}`,
                lastChecked: new Date(),
                avgResponseTimeMs: responseTime,
                errorRate: 0,
            };

        } catch (error) {
            const message = error instanceof Error && error.name === 'TimeoutError'
                ? 'Health check timeout - Server may be overloaded'
                : 'Connection refused - Is the Kokoro server running?';

            return {
                available: false,
                name: 'Kokoro-82M',
                message,
                lastChecked: new Date(),
            };
        }
    }

    /**
     * Get current queue status
     */
    getQueueStatus() {
        return {
            queueSize: this.requestQueue.length,
            activeRequests: this.activeRequests,
            maxConcurrent: MAX_CONCURRENT_REQUESTS,
            maxQueueSize: MAX_QUEUE_SIZE,
        };
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createKokoroProvider(
    retryConfig?: Partial<RetryConfig>,
    rateLimitConfig?: Partial<RateLimitConfig>
): KokoroProvider {
    return new KokoroProvider(retryConfig, rateLimitConfig);
}

let defaultProvider: KokoroProvider | null = null;

export function getKokoroProvider(): KokoroProvider {
    if (!defaultProvider) {
        defaultProvider = new KokoroProvider();
    }
    return defaultProvider;
}

export default KokoroProvider;
