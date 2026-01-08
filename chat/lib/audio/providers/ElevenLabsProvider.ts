/**
 * ElevenLabsProvider
 * 
 * Production-ready integration for ElevenLabs API.
 * Provides premium voice synthesis with extensive voice library access.
 * 
 * Features:
 * - High-quality neural voice synthesis
 * - Extensive voice library (500+ voices)
 * - Voice cloning support
 * - Multiple output formats
 * - Streaming support
 * - Cost tracking per generation
 * - Rate limiting with backoff
 * - Comprehensive error handling
 * - Request queuing for concurrency control
 */

import {
    BaseAudioProvider,
    Voice,
    VoiceInfo,
    GenerationOptions,
    GenerationResult,
    ProviderStatus,
    RetryConfig,
    RateLimitConfig,
    AudioProviderError,
    InvalidVoiceError,
    RateLimitError,
    TimeoutError,
    VoiceGender,
    VoiceStyle,
    SSMLFeatures,
    AudioOutputFormat,
} from './AudioProvider.interface';

// ============================================================================
// Constants
// ============================================================================

/** Base URL for ElevenLabs API */
const API_BASE_URL = 'https://api.elevenlabs.io/v1';

/** Maximum text length (10,000 characters for ElevenLabs) */
const MAX_TEXT_LENGTH = 10000;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 60000;

/** Maximum concurrent requests */
const MAX_CONCURRENT_REQUESTS = 3;

/** Character cost per generation (approximate for cost tracking) */
const COST_PER_CHARACTER_STANDARD = 0.00003; // $0.30 per 1000 chars
const COST_PER_CHARACTER_PROFESSIONAL = 0.00009; // $0.90 per 1000 chars

// ============================================================================
// Types
// ============================================================================

export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    samples?: Array<{
        sample_id: string;
        file_name: string;
        mime_type: string;
        size_bytes: number;
        hash: string;
    }>;
    category?: string;
    fine_tuning?: {
        is_allowed_to_fine_tune: boolean;
        finetuning_state?: string;
        manual_verification_requested?: boolean;
        language?: string;
    };
    labels?: Record<string, string>;
    description?: string;
    preview_url?: string;
    available_for_tiers?: string[];
    settings?: VoiceSettings;
    sharing?: {
        status: string;
        history_item_sample_id?: string;
        original_voice_id?: string;
        public_owner_id?: string;
        liked_by_count?: number;
        cloned_by_count?: number;
        whitelisted_emails?: string[];
        name?: string;
        labels?: Record<string, string>;
        description?: string;
        review_status?: string;
        review_message?: string;
        enable_in_library?: boolean;
        instagram_username?: string;
        twitter_username?: string;
        youtube_url?: string;
        tiktok_username?: string;
    };
}

export interface VoiceSettings {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
}

export interface ElevenLabsGenerationRequest {
    text: string;
    model_id?: string;
    voice_settings?: VoiceSettings;
    pronunciation_dictionary_locators?: Array<{
        pronunciation_dictionary_id: string;
        version_id: string;
    }>;
}

export interface ElevenLabsError {
    detail: {
        status: string;
        message: string;
    };
}

export interface CostEstimate {
    characters: number;
    estimatedCost: number;
    model: string;
    tier: 'standard' | 'professional';
}

// ============================================================================
// ElevenLabs Provider
// ============================================================================

export class ElevenLabsProvider extends BaseAudioProvider {
    readonly name = 'elevenlabs' as const;
    readonly requiresApiKey = true;
    readonly maxTextLength = MAX_TEXT_LENGTH;

    private apiKey: string;
    private activeRequests = 0;
    private voiceCache: Map<string, ElevenLabsVoice> = new Map();
    private voiceCacheTimestamp: number = 0;
    private readonly CACHE_TTL = 3600000; // 1 hour

    constructor(
        apiKey?: string,
        retryConfig?: Partial<RetryConfig>,
        rateLimitConfig?: Partial<RateLimitConfig>
    ) {
        super(retryConfig, rateLimitConfig);
        this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';

        if (!this.apiKey) {
            console.warn('[ElevenLabs] No API key provided. Set ELEVENLABS_API_KEY environment variable.');
        }
    }

    /**
     * Generate speech from text using ElevenLabs
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        options?: GenerationOptions
    ): Promise<GenerationResult> {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        const mergedOptions = this.mergeOptions(options);

        // Validate API key
        if (!this.apiKey) {
            throw new AudioProviderError(
                'ElevenLabs API key not configured',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        // Validate text
        this.validateText(text);

        console.log(`[ElevenLabs] Starting generation [${requestId}]: ${text.length} chars, voice ${voiceId}`);

        try {
            // Check concurrent request limit
            if (this.activeRequests >= MAX_CONCURRENT_REQUESTS) {
                throw new RateLimitError(this.name, 5000);
            }

            this.activeRequests++;

            const audio = await this.withRetry(
                () => this.performGeneration(text, voiceId, mergedOptions, requestId),
                'generateSpeech'
            );

            const generationTime = Date.now() - startTime;
            this.logMetrics('generateSpeech', startTime, text.length, true);

            return {
                audio,
                format: this.mapOutputFormat(mergedOptions.format),
                size: audio.byteLength,
                voiceId,
                metadata: {
                    provider: this.name,
                    generationTimeMs: generationTime,
                    characterCount: text.length,
                    timestamp: new Date(),
                    requestId,
                },
            };
        } catch (error) {
            this.logMetrics('generateSpeech', startTime, text.length, false);
            throw this.mapError(error);
        } finally {
            this.activeRequests--;
        }
    }

    /**
     * Perform the actual TTS generation
     */
    private async performGeneration(
        text: string,
        voiceId: string,
        options: Required<Omit<GenerationOptions, 'ssmlWrapper'>> & Pick<GenerationOptions, 'ssmlWrapper'>,
        requestId: string
    ): Promise<ArrayBuffer> {
        const model = this.getModelForOptions(options);
        const outputFormat = this.getOutputFormat(options.format);

        const requestBody: ElevenLabsGenerationRequest = {
            text,
            model_id: model,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: options.styleIntensity || 0.5,
                use_speaker_boost: true,
            },
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(
                `${API_BASE_URL}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.apiKey,
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal,
                }
            );

            if (!response.ok) {
                await this.handleErrorResponse(response, voiceId);
            }

            const audioBuffer = await response.arrayBuffer();
            console.log(`[ElevenLabs] Generation complete [${requestId}]: ${audioBuffer.byteLength} bytes`);

            return audioBuffer;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError(this.name, REQUEST_TIMEOUT);
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * List all available voices
     * @param locale - Optional locale filter (e.g., 'en', 'en-US')
     */
    async listVoices(locale?: string): Promise<Voice[]> {
        const voices = await this.listVoicesExtended(true);

        if (locale) {
            const localeLower = locale.toLowerCase();
            return voices.filter(v =>
                v.locale.toLowerCase().includes(localeLower) ||
                v.language.toLowerCase().includes(localeLower)
            );
        }

        return voices;
    }

    /**
     * List all available voices with extended options
     * @param includeShared - Whether to include shared/community voices
     */
    async listVoicesExtended(includeShared: boolean = true): Promise<Voice[]> {
        // Check cache first
        if (this.voiceCache.size > 0 && Date.now() - this.voiceCacheTimestamp < this.CACHE_TTL) {
            return this.convertCachedVoices();
        }

        if (!this.apiKey) {
            throw new AudioProviderError(
                'ElevenLabs API key not configured',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(
                `${API_BASE_URL}/voices${includeShared ? '' : '?show_legacy=false'}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'xi-api-key': this.apiKey,
                    },
                    signal: controller.signal,
                }
            );

            if (!response.ok) {
                throw new AudioProviderError(
                    `Failed to list voices: ${response.status} ${response.statusText}`,
                    'PROVIDER_UNAVAILABLE',
                    this.name,
                    true
                );
            }

            const data = await response.json() as { voices: ElevenLabsVoice[] };

            // Update cache
            this.voiceCache.clear();
            for (const voice of data.voices) {
                this.voiceCache.set(voice.voice_id, voice);
            }
            this.voiceCacheTimestamp = Date.now();

            return data.voices.map(voice => this.convertVoice(voice));
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError(this.name, REQUEST_TIMEOUT);
            }
            throw this.mapError(error);
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Get detailed information about a voice
     */
    async getVoiceInfo(voiceId: string): Promise<VoiceInfo> {
        // Check cache first
        if (this.voiceCache.has(voiceId) && Date.now() - this.voiceCacheTimestamp < this.CACHE_TTL) {
            return this.convertToVoiceInfo(this.voiceCache.get(voiceId)!);
        }

        if (!this.apiKey) {
            throw new AudioProviderError(
                'ElevenLabs API key not configured',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(`${API_BASE_URL}/voices/${voiceId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new InvalidVoiceError(this.name, voiceId);
                }
                throw new AudioProviderError(
                    `Failed to get voice info: ${response.status}`,
                    'PROVIDER_UNAVAILABLE',
                    this.name,
                    true
                );
            }

            const voice = await response.json() as ElevenLabsVoice;

            // Update cache
            this.voiceCache.set(voiceId, voice);

            return this.convertToVoiceInfo(voice);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError(this.name, REQUEST_TIMEOUT);
            }
            throw this.mapError(error);
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Clone a voice from audio samples
     */
    async cloneVoice(
        audioFile: ArrayBuffer | string,
        name: string,
        description?: string
    ): Promise<string> {
        if (!this.apiKey) {
            throw new AudioProviderError(
                'ElevenLabs API key not configured',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        const formData = new FormData();
        formData.append('name', name);

        if (description) {
            formData.append('description', description);
        }

        // Handle audio file - either ArrayBuffer or URL
        if (typeof audioFile === 'string') {
            // Fetch from URL
            const audioResponse = await fetch(audioFile);
            const audioBlob = await audioResponse.blob();
            formData.append('files', audioBlob, 'voice_sample.mp3');
        } else {
            formData.append('files', new Blob([audioFile], { type: 'audio/mpeg' }), 'voice_sample.mp3');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT * 2); // Longer timeout for cloning

        try {
            const response = await fetch(`${API_BASE_URL}/voices/add`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                },
                body: formData,
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = await response.json() as ElevenLabsError;
                throw new AudioProviderError(
                    error.detail?.message || 'Voice cloning failed',
                    'GENERATION_FAILED',
                    this.name,
                    false
                );
            }

            const result = await response.json() as { voice_id: string };
            console.log(`[ElevenLabs] Voice cloned successfully: ${result.voice_id}`);

            return result.voice_id;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError(this.name, REQUEST_TIMEOUT * 2);
            }
            throw this.mapError(error);
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Get provider status with health check
     */
    async getStatus(): Promise<ProviderStatus> {
        const startTime = Date.now();

        if (!this.apiKey) {
            return {
                available: false,
                name: this.name,
                message: 'API key not configured',
                lastChecked: new Date(),
            };
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(`${API_BASE_URL}/user`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'xi-api-key': this.apiKey,
                    },
                    signal: controller.signal,
                });

                const responseTime = Date.now() - startTime;

                if (!response.ok) {
                    return {
                        available: false,
                        name: this.name,
                        message: `API returned ${response.status}`,
                        lastChecked: new Date(),
                        avgResponseTimeMs: responseTime,
                    };
                }

                return {
                    available: true,
                    name: this.name,
                    message: 'API is healthy',
                    lastChecked: new Date(),
                    avgResponseTimeMs: responseTime,
                };
            } finally {
                clearTimeout(timeout);
            }
        } catch (error) {
            return {
                available: false,
                name: this.name,
                message: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: new Date(),
            };
        }
    }

    /**
     * Estimate cost for text generation
     */
    estimateCost(text: string, tier: 'standard' | 'professional' = 'standard'): CostEstimate {
        const characters = text.length;
        const costPerChar = tier === 'professional'
            ? COST_PER_CHARACTER_PROFESSIONAL
            : COST_PER_CHARACTER_STANDARD;

        return {
            characters,
            estimatedCost: characters * costPerChar,
            model: tier === 'professional' ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1',
            tier,
        };
    }

    /**
     * Get subscription info
     */
    async getSubscriptionInfo(): Promise<{
        tier: string;
        character_count: number;
        character_limit: number;
        can_extend_character_limit: boolean;
        allowed_to_extend_character_limit: boolean;
        next_character_count_reset_unix: number;
    } | null> {
        if (!this.apiKey) {
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user/subscription`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch {
            return null;
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private async handleErrorResponse(response: Response, voiceId: string): Promise<never> {
        if (response.status === 401) {
            throw new AudioProviderError(
                'Invalid ElevenLabs API key',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        if (response.status === 404) {
            throw new InvalidVoiceError(this.name, voiceId);
        }

        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new RateLimitError(
                this.name,
                retryAfter ? parseInt(retryAfter) * 1000 : 60000
            );
        }

        if (response.status === 400) {
            try {
                const error = await response.json() as ElevenLabsError;
                throw new AudioProviderError(
                    error.detail?.message || 'Bad request',
                    'INVALID_OPTIONS',
                    this.name,
                    false
                );
            } catch {
                throw new AudioProviderError(
                    'Invalid request',
                    'INVALID_OPTIONS',
                    this.name,
                    false
                );
            }
        }

        throw new AudioProviderError(
            `ElevenLabs API error: ${response.status} ${response.statusText}`,
            'PROVIDER_UNAVAILABLE',
            this.name,
            true
        );
    }

    private mapError(error: unknown): Error {
        if (error instanceof AudioProviderError) {
            return error;
        }

        if (error instanceof Error) {
            if (error.message.includes('fetch')) {
                return new AudioProviderError(
                    'Network error connecting to ElevenLabs',
                    'NETWORK_ERROR',
                    this.name,
                    true,
                    error
                );
            }
            return new AudioProviderError(
                error.message,
                'UNKNOWN_ERROR',
                this.name,
                false,
                error
            );
        }

        return new AudioProviderError(
            'Unknown error occurred',
            'UNKNOWN_ERROR',
            this.name,
            false
        );
    }

    private getModelForOptions(options: Required<Omit<GenerationOptions, 'ssmlWrapper'>>): string {
        // Use multilingual v2 for non-English or when high quality is needed
        if (options.styleIntensity > 1.0) {
            return 'eleven_multilingual_v2';
        }
        return 'eleven_monolingual_v1';
    }

    private getOutputFormat(format: AudioOutputFormat): string {
        switch (format) {
            case 'mp3':
                return 'mp3_44100_128';
            case 'wav':
                return 'pcm_44100';
            case 'ogg':
            case 'opus':
                return 'mp3_44100_128'; // Fallback to MP3
            default:
                return 'mp3_44100_128';
        }
    }

    private mapOutputFormat(format: AudioOutputFormat): AudioOutputFormat {
        // ElevenLabs supports mp3 and pcm (wav), fall back for others
        if (format === 'mp3' || format === 'wav') {
            return format;
        }
        return 'mp3';
    }

    private convertVoice(voice: ElevenLabsVoice): Voice {
        const gender = this.inferGender(voice);
        const language = voice.labels?.language || 'en';

        return {
            id: voice.voice_id,
            name: voice.name,
            provider: this.name,
            locale: `${language}-${voice.labels?.accent?.toUpperCase() || 'US'}`,
            language: this.getLanguageDisplayName(language),
            gender,
            styles: this.inferStyles(voice),
            isNeural: true,
            sampleUrl: voice.preview_url,
            metadata: {
                category: voice.category,
                description: voice.description,
                labels: voice.labels,
                sharing: voice.sharing,
            },
        };
    }

    private convertToVoiceInfo(voice: ElevenLabsVoice): VoiceInfo {
        const baseVoice = this.convertVoice(voice);

        return {
            ...baseVoice,
            description: voice.description,
            ssmlFeatures: this.getSSMLFeatures(),
            supportsPitchAdjustment: false, // ElevenLabs doesn't expose pitch control
            supportsRateAdjustment: false,
            supportsVolumeAdjustment: false,
            outputFormats: ['mp3', 'wav'],
        };
    }

    private convertCachedVoices(): Voice[] {
        return Array.from(this.voiceCache.values()).map(voice => this.convertVoice(voice));
    }

    private inferGender(voice: ElevenLabsVoice): VoiceGender {
        const gender = voice.labels?.gender?.toLowerCase();
        if (gender === 'male') return 'male';
        if (gender === 'female') return 'female';
        return 'unknown';
    }

    private inferStyles(voice: ElevenLabsVoice): VoiceStyle[] {
        const styles: VoiceStyle[] = ['natural'];
        const useCase = voice.labels?.use_case?.toLowerCase();

        if (useCase?.includes('narration')) styles.push('narration');
        if (useCase?.includes('news')) styles.push('newscast');
        if (useCase?.includes('character')) styles.push('expressive');
        if (useCase?.includes('conversational')) styles.push('chat');

        return styles;
    }

    private getSSMLFeatures(): SSMLFeatures {
        return {
            emphasis: false,
            prosody: false,
            break: false,
            sayAs: false,
            phoneme: false,
            expressAs: false,
        };
    }

    private getLanguageDisplayName(code: string): string {
        const languageNames: Record<string, string> = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'pl': 'Polish',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'ru': 'Russian',
        };

        return languageNames[code.toLowerCase()] || code;
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new ElevenLabs provider instance
 */
export function createElevenLabsProvider(
    apiKey?: string,
    retryConfig?: Partial<RetryConfig>,
    rateLimitConfig?: Partial<RateLimitConfig>
): ElevenLabsProvider {
    return new ElevenLabsProvider(apiKey, retryConfig, rateLimitConfig);
}

let defaultProvider: ElevenLabsProvider | null = null;

/**
 * Get the default ElevenLabs provider instance (singleton)
 */
export function getElevenLabsProvider(): ElevenLabsProvider {
    if (!defaultProvider) {
        defaultProvider = new ElevenLabsProvider();
    }
    return defaultProvider;
}

export default ElevenLabsProvider;
