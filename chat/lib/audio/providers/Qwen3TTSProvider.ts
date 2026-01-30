/**
 * Qwen3TTSProvider
 * 
 * Integration for Qwen3-TTS - supports both self-hosted and cloud API modes.
 * 
 * SELF-HOSTED (Recommended):
 * - Uses OpenAI-compatible endpoint (groxaxo/Qwen3-TTS-Openai-Fastapi)
 * - Set QWEN_ENDPOINT=http://localhost:8880
 * - Completely free, no API key needed
 * - Requires GPU (4-8GB VRAM)
 * 
 * CLOUD API (Alternative):
 * - Uses DashScope API (requires Chinese phone for registration)
 * - Set QWEN_API_KEY=sk-xxx
 * 
 * Features:
 * - High-quality neural voice synthesis
 * - 3-second voice cloning (10-30 seconds recommended)
 * - Voice design from natural language descriptions (unique!)
 * - 10 language support (zh, en, ja, ko, de, fr, ru, pt, es, it)
 * - Ultra-low latency streaming (~97ms)
 * - Instruction-driven emotion/prosody control
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

/** Maximum text length */
const MAX_TEXT_LENGTH = 5000;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT = 60000;

/** Maximum concurrent requests */
const MAX_CONCURRENT_REQUESTS = 5;

/** Supported languages */
const SUPPORTED_LANGUAGES = [
    { code: 'zh', name: 'Chinese', locale: 'zh-CN' },
    { code: 'en', name: 'English', locale: 'en-US' },
    { code: 'ja', name: 'Japanese', locale: 'ja-JP' },
    { code: 'ko', name: 'Korean', locale: 'ko-KR' },
    { code: 'de', name: 'German', locale: 'de-DE' },
    { code: 'fr', name: 'French', locale: 'fr-FR' },
    { code: 'ru', name: 'Russian', locale: 'ru-RU' },
    { code: 'pt', name: 'Portuguese', locale: 'pt-BR' },
    { code: 'es', name: 'Spanish', locale: 'es-ES' },
    { code: 'it', name: 'Italian', locale: 'it-IT' },
] as const;

/** Default voices available in Qwen3-TTS */
const DEFAULT_VOICES = [
    { id: 'Chelsie', name: 'Chelsie', gender: 'female' as const, language: 'en', description: 'Warm and friendly female voice' },
    { id: 'Ethan', name: 'Ethan', gender: 'male' as const, language: 'en', description: 'Deep and authoritative male voice' },
    { id: 'Laura', name: 'Laura', gender: 'female' as const, language: 'en', description: 'Soft and gentle female voice' },
    { id: 'Daniel', name: 'Daniel', gender: 'male' as const, language: 'en', description: 'Warm narrator male voice' },
    { id: 'Aria', name: 'Aria', gender: 'female' as const, language: 'en', description: 'Expressive female voice' },
    { id: 'Oliver', name: 'Oliver', gender: 'male' as const, language: 'en', description: 'Clear articulate male voice' },
];

// ============================================================================
// Types
// ============================================================================

export interface Qwen3Voice {
    voice_id: string;
    name: string;
    gender: 'male' | 'female';
    language: string;
    description?: string;
    preview_url?: string;
    is_cloned?: boolean;
    is_designed?: boolean;
    design_prompt?: string;
}

/** OpenAI-compatible TTS request format */
export interface OpenAITTSRequest {
    model: string;
    input: string;
    voice: string;
    response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav';
    speed?: number;
    instructions?: string;  // Qwen3 extension for emotion control
}

/** OpenAI-compatible voice clone request */
export interface VoiceCloneRequest {
    name: string;
    audio_url?: string;
    audio_base64?: string;
    description?: string;
}

/** Voice design request (Qwen3-specific) */
export interface VoiceDesignRequest {
    name: string;
    description: string;
    language?: string;
    gender?: 'male' | 'female';
}

export interface Qwen3Error {
    error?: {
        message: string;
        type?: string;
        code?: string;
    };
    detail?: string;
}

// ============================================================================
// Qwen3-TTS Provider
// ============================================================================

export class Qwen3TTSProvider extends BaseAudioProvider {
    readonly name = 'qwen3' as const;
    readonly requiresApiKey = false;  // Self-hosted doesn't need API key
    readonly maxTextLength = MAX_TEXT_LENGTH;

    private endpoint: string;
    private apiKey: string;
    private hfApiKey: string;
    private isSelfHosted: boolean;
    private isHF: boolean;
    private activeRequests = 0;
    private voiceCache: Map<string, Qwen3Voice> = new Map();
    private voiceCacheTimestamp: number = 0;
    private readonly CACHE_TTL = 3600000; // 1 hour

    constructor(
        endpoint?: string,
        apiKey?: string,
        hfApiKey?: string,
        retryConfig?: Partial<RetryConfig>,
        rateLimitConfig?: Partial<RateLimitConfig>
    ) {
        super(retryConfig, rateLimitConfig);

        // Check for configurations (order of priority: self-hosted -> HF -> Cloud)
        this.endpoint = endpoint || process.env.QWEN_ENDPOINT || '';
        this.apiKey = apiKey || process.env.QWEN_API_KEY || '';
        this.hfApiKey = hfApiKey || process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || '';

        this.isSelfHosted = !!this.endpoint && !this.endpoint.includes('huggingface.co');
        this.isHF = !!this.hfApiKey || (!!this.endpoint && this.endpoint.includes('huggingface.co'));

        if (!this.endpoint && !this.apiKey && !this.hfApiKey) {
            console.warn('[Qwen3-TTS] No configuration found. Set QWEN_ENDPOINT, QWEN_API_KEY, or HF_API_KEY.');
        } else if (this.isSelfHosted) {
            console.log(`[Qwen3-TTS] Using self-hosted endpoint: ${this.endpoint}`);
        } else if (this.isHF) {
            const hfModel = this.endpoint || 'Qwen/Qwen3-TTS-12Hz-1.7B-Base';
            console.log(`[Qwen3-TTS] Using Hugging Face Inference API: ${hfModel}`);
        } else {
            console.log('[Qwen3-TTS] Using DashScope cloud API');
        }

        // Initialize default voices in cache
        this.initializeDefaultVoices();
    }

    private initializeDefaultVoices(): void {
        for (const voice of DEFAULT_VOICES) {
            this.voiceCache.set(voice.id, {
                voice_id: voice.id,
                name: voice.name,
                gender: voice.gender,
                language: voice.language,
                description: voice.description,
            });
        }
        this.voiceCacheTimestamp = Date.now();
    }

    /**
     * Check if provider is configured
     */
    isConfigured(): boolean {
        return this.isSelfHosted || this.isHF || !!this.apiKey;
    }

    /**
     * Generate speech from text using Qwen3-TTS
     * Uses OpenAI-compatible API for self-hosted mode
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        options?: GenerationOptions & { instructions?: string }
    ): Promise<GenerationResult> {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        const mergedOptions = this.mergeOptions(options);

        // Validate configuration
        if (!this.isConfigured()) {
            throw new AudioProviderError(
                'Qwen3-TTS not configured. Set QWEN_ENDPOINT, QWEN_API_KEY, or HF_API_KEY.',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        // Validate text
        this.validateText(text);

        console.log(`[Qwen3-TTS] Starting generation [${requestId}]: ${text.length} chars, voice ${voiceId}`);

        try {
            // Check concurrent request limit
            if (this.activeRequests >= MAX_CONCURRENT_REQUESTS) {
                throw new RateLimitError(this.name, 5000);
            }

            this.activeRequests++;

            const audio = await this.withRetry(
                () => this.performGeneration(text, voiceId, mergedOptions, (options as any)?.instructions, requestId),
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
     * Perform the actual TTS generation using OpenAI-compatible API or HF Inference API
     */
    private async performGeneration(
        text: string,
        voiceId: string,
        options: Required<Omit<GenerationOptions, 'ssmlWrapper'>> & Pick<GenerationOptions, 'ssmlWrapper'>,
        instructions?: string,
        requestId?: string
    ): Promise<ArrayBuffer> {
        // Build URL and Headers based on mode
        let url: string;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        let body: string;

        if (this.isHF) {
            // Hugging Face Inference API
            const model = this.endpoint && this.endpoint.includes('huggingface.co')
                ? this.endpoint
                : `https://api-inference.huggingface.co/models/${this.endpoint || 'Qwen/Qwen3-TTS-12Hz-1.7B-Base'}`;

            url = model;
            headers['Authorization'] = `Bearer ${this.hfApiKey}`;

            // Hugging Face payload format
            body = JSON.stringify({
                inputs: text,
                parameters: {
                    voice: voiceId,
                    task: 'text-to-speech',
                    ...(instructions && { instructions }),
                }
            });
        } else {
            // Self-hosted or Cloud (DashScope)
            url = this.isSelfHosted
                ? `${this.endpoint}/v1/audio/speech`
                : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/generation';

            if (!this.isSelfHosted && this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            // OpenAI-compatible request format
            const requestBody: OpenAITTSRequest = {
                model: 'qwen3-tts',
                input: text,
                voice: voiceId,
                response_format: 'mp3',
                speed: options.rate || 1.0,
                ...(instructions && { instructions }),
            };
            body = JSON.stringify(requestBody);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal,
            });

            if (!response.ok) {
                await this.handleErrorResponse(response, voiceId);
            }

            // For self-hosted, response is direct audio bytes
            // For cloud API, response might be JSON with audio URL/base64
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
                // Direct audio response (self-hosted mode)
                const audioBuffer = await response.arrayBuffer();
                console.log(`[Qwen3-TTS] Generation complete [${requestId}]: ${audioBuffer.byteLength} bytes`);
                return audioBuffer;
            } else {
                // JSON response with audio data (cloud API mode)
                const data = await response.json();

                if (data.output?.audio) {
                    // Base64 encoded audio
                    const binaryString = atob(data.output.audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    console.log(`[Qwen3-TTS] Generation complete [${requestId}]: ${bytes.byteLength} bytes`);
                    return bytes.buffer;
                }

                if (data.output?.audio_url) {
                    // Fetch from URL
                    const audioResponse = await fetch(data.output.audio_url);
                    const audioBuffer = await audioResponse.arrayBuffer();
                    console.log(`[Qwen3-TTS] Generation complete [${requestId}]: ${audioBuffer.byteLength} bytes`);
                    return audioBuffer;
                }

                throw new AudioProviderError(
                    'No audio data in response',
                    'GENERATION_FAILED',
                    this.name,
                    false
                );
            }
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
     */
    async listVoices(locale?: string): Promise<Voice[]> {
        // Try to fetch voices from server if self-hosted
        if (this.isSelfHosted) {
            try {
                const response = await fetch(`${this.endpoint}/v1/voices`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.voices && Array.isArray(data.voices)) {
                        // Update cache with server voices
                        for (const voice of data.voices) {
                            this.voiceCache.set(voice.id || voice.voice_id, {
                                voice_id: voice.id || voice.voice_id,
                                name: voice.name,
                                gender: voice.gender || 'female',
                                language: voice.language || 'en',
                                description: voice.description,
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn('[Qwen3-TTS] Could not fetch voices from server, using defaults');
            }
        }

        // Return cached voices (including default + cloned + designed)
        const voices = Array.from(this.voiceCache.values()).map(voice => this.convertVoice(voice));

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
     * Get detailed information about a voice
     */
    async getVoiceInfo(voiceId: string): Promise<VoiceInfo> {
        const voice = this.voiceCache.get(voiceId);

        if (!voice) {
            throw new InvalidVoiceError(this.name, voiceId);
        }

        return this.convertToVoiceInfo(voice);
    }

    /**
     * Clone a voice from audio sample (3-30 seconds recommended)
     */
    async cloneVoice(
        audioFile: ArrayBuffer | string,
        name: string,
        description?: string
    ): Promise<string> {
        if (!this.isConfigured()) {
            throw new AudioProviderError(
                'Qwen3-TTS not configured',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        console.log(`[Qwen3-TTS] Starting voice clone: ${name}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT * 2);

        try {
            // Build request based on mode
            const url = this.isSelfHosted
                ? `${this.endpoint}/v1/voices/clone`
                : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/voice-clone/create';

            let requestBody: any;

            if (typeof audioFile === 'string') {
                // URL provided
                requestBody = { name, audio_url: audioFile, description };
            } else {
                // ArrayBuffer - convert to base64
                const base64 = Buffer.from(audioFile).toString('base64');
                requestBody = { name, audio_base64: base64, description };
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (!this.isSelfHosted && this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = await response.json() as Qwen3Error;
                throw new AudioProviderError(
                    error.error?.message || error.detail || 'Voice cloning failed',
                    'GENERATION_FAILED',
                    this.name,
                    false
                );
            }

            const result = await response.json();
            const voiceId = result.voice_id || result.id || `qwen3_cloned_${Date.now()}`;

            // Add to cache
            this.voiceCache.set(voiceId, {
                voice_id: voiceId,
                name,
                gender: 'female', // Will be inferred
                language: 'en',
                description,
                is_cloned: true,
            });

            console.log(`[Qwen3-TTS] Voice cloned successfully: ${voiceId}`);
            return voiceId;
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
     * Design a voice from natural language description (UNIQUE FEATURE!)
     * 
     * Examples:
     * - "A warm, playful anime girl voice with slight Japanese accent"
     * - "Deep, mysterious male voice like a villain"
     * - "Energetic young boy, enthusiastic and curious"
     */
    async designVoice(
        description: string,
        name: string,
        options?: { language?: string; gender?: 'male' | 'female' }
    ): Promise<{ voiceId: string; previewUrl?: string }> {
        if (!this.isConfigured()) {
            throw new AudioProviderError(
                'Qwen3-TTS not configured',
                'AUTH_ERROR',
                this.name,
                false
            );
        }

        console.log(`[Qwen3-TTS] Starting voice design: ${name}`);
        console.log(`[Qwen3-TTS] Description: ${description}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT * 2);

        try {
            // Build request
            const url = this.isSelfHosted
                ? `${this.endpoint}/v1/voices/design`
                : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/voice-design/create';

            const requestBody: VoiceDesignRequest = {
                name,
                description,
                language: options?.language || 'en',
                gender: options?.gender,
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (!this.isSelfHosted && this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = await response.json() as Qwen3Error;
                throw new AudioProviderError(
                    error.error?.message || error.detail || 'Voice design failed',
                    'GENERATION_FAILED',
                    this.name,
                    false
                );
            }

            const result = await response.json();
            const voiceId = result.voice_id || result.id || `qwen3_designed_${Date.now()}`;

            // Add to cache
            this.voiceCache.set(voiceId, {
                voice_id: voiceId,
                name,
                gender: options?.gender || 'female',
                language: options?.language || 'en',
                description,
                is_designed: true,
                design_prompt: description,
            });

            console.log(`[Qwen3-TTS] Voice designed successfully: ${voiceId}`);

            return {
                voiceId,
                previewUrl: result.preview_url || result.audio_url,
            };
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
     * Generate a preview sample for a designed or cloned voice
     */
    async generatePreview(voiceId: string, sampleText?: string): Promise<string> {
        const text = sampleText || "Hello! This is a preview of how this voice sounds. Nice to meet you!";

        const result = await this.generateSpeech(text, voiceId);

        // Return base64 data URL
        const base64 = Buffer.from(result.audio).toString('base64');
        return `data:audio/mp3;base64,${base64}`;
    }

    /**
     * Get provider status with health check
     */
    async getStatus(): Promise<ProviderStatus> {
        const startTime = Date.now();

        if (!this.isConfigured()) {
            return {
                available: false,
                name: this.name,
                message: 'Not configured. Set QWEN_ENDPOINT for self-hosted deployment.',
                lastChecked: new Date(),
            };
        }

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                // Health check endpoint
                const url = this.isSelfHosted
                    ? `${this.endpoint}/health`
                    : 'https://dashscope.aliyuncs.com/api/v1/models';

                const headers: Record<string, string> = {};
                if (!this.isSelfHosted && this.apiKey) {
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    headers,
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
                    message: this.isSelfHosted ? 'Self-hosted server is healthy' : 'Cloud API is healthy',
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
     * Get list of supported languages
     */
    getSupportedLanguages(): Array<{ code: string; name: string; locale: string }> {
        return [...SUPPORTED_LANGUAGES];
    }

    /**
     * Check if running in self-hosted mode
     */
    isSelfHostedMode(): boolean {
        return this.isSelfHosted;
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private async handleErrorResponse(response: Response, voiceId: string): Promise<never> {
        if (response.status === 401) {
            throw new AudioProviderError(
                'Authentication failed',
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
                const error = await response.json() as Qwen3Error;
                throw new AudioProviderError(
                    error.error?.message || error.detail || 'Bad request',
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
            `Qwen3-TTS error: ${response.status} ${response.statusText}`,
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
            if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
                return new AudioProviderError(
                    this.isSelfHosted
                        ? `Cannot connect to Qwen3-TTS server at ${this.endpoint}. Is it running?`
                        : 'Network error connecting to Qwen3-TTS',
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

    private mapOutputFormat(format: AudioOutputFormat): AudioOutputFormat {
        // Qwen3-TTS supports mp3 and wav
        if (format === 'mp3' || format === 'wav') {
            return format;
        }
        return 'mp3';
    }

    private convertVoice(voice: Qwen3Voice): Voice {
        const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === voice.language) ||
            { code: 'en', name: 'English', locale: 'en-US' };

        return {
            id: voice.voice_id,
            name: voice.name,
            provider: this.name,
            locale: langInfo.locale,
            language: langInfo.name,
            gender: voice.gender === 'male' ? 'male' : 'female',
            styles: this.inferStyles(voice),
            isNeural: true,
            sampleUrl: voice.preview_url,
            metadata: {
                description: voice.description,
                is_cloned: voice.is_cloned,
                is_designed: voice.is_designed,
                design_prompt: voice.design_prompt,
            },
        };
    }

    private convertToVoiceInfo(voice: Qwen3Voice): VoiceInfo {
        const baseVoice = this.convertVoice(voice);

        return {
            ...baseVoice,
            description: voice.description,
            ssmlFeatures: this.getSSMLFeatures(),
            supportsPitchAdjustment: true,
            supportsRateAdjustment: true,
            supportsVolumeAdjustment: true,
            outputFormats: ['mp3', 'wav'],
        };
    }

    private inferStyles(voice: Qwen3Voice): VoiceStyle[] {
        const styles: VoiceStyle[] = ['natural'];

        if (voice.is_cloned) {
            styles.push('cloned' as VoiceStyle);
        }
        if (voice.is_designed) {
            styles.push('expressive');
        }

        // Infer from description
        const desc = voice.description?.toLowerCase() || '';
        if (desc.includes('narrat')) styles.push('narration');
        if (desc.includes('news')) styles.push('newscast');
        if (desc.includes('anime') || desc.includes('character')) styles.push('expressive');
        if (desc.includes('conversational') || desc.includes('friendly')) styles.push('chat');

        return styles;
    }

    private getSSMLFeatures(): SSMLFeatures {
        return {
            emphasis: true,
            prosody: true,
            break: true,
            sayAs: true,
            phoneme: false,
            expressAs: true,  // Qwen3 supports instruction-based expression
        };
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let qwen3Instance: Qwen3TTSProvider | null = null;

/**
 * Get the singleton Qwen3-TTS provider instance
 */
export function getQwen3TTSProvider(): Qwen3TTSProvider {
    if (!qwen3Instance) {
        qwen3Instance = new Qwen3TTSProvider();
    }
    return qwen3Instance;
}

export default Qwen3TTSProvider;
