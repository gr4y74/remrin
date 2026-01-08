/**
 * EdgeTTSProvider
 * 
 * Production-ready Edge TTS provider implementation.
 * Uses Microsoft Edge's free TTS API for high-quality neural voices.
 * 
 * Features:
 * - 300+ neural voices across 70+ languages
 * - SSML support for emotion/emphasis
 * - Error handling with retries
 * - Rate limiting
 * - Voice caching
 * - Performance metrics
 */

import { createHash, randomUUID } from 'crypto';
import {
    BaseAudioProvider,
    Voice,
    VoiceInfo,
    VoiceGender,
    VoiceStyle,
    GenerationOptions,
    GenerationResult,
    ProviderStatus,
    SSMLFeatures,
    AudioOutputFormat,
    AudioProviderError,
    InvalidVoiceError,
    RateLimitError,
    TimeoutError,
    RetryConfig,
    RateLimitConfig,
} from './AudioProvider.interface';

// ============================================================================
// Edge TTS Types
// ============================================================================

/**
 * Edge TTS voice as returned by the API
 */
interface EdgeTTSVoice {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    SuggestedCodec: string;
    FriendlyName: string;
    Status: string;
    VoiceTag?: {
        ContentCategories?: string[];
        VoicePersonalities?: string[];
    };
}

/**
 * WebSocket message types
 */
interface WSConfig {
    context: {
        synthesis: {
            audio: {
                metadataoptions: {
                    sentenceBoundaryEnabled: boolean;
                    wordBoundaryEnabled: boolean;
                };
                outputFormat: string;
            };
        };
    };
}

// ============================================================================
// Constants
// ============================================================================

const EDGE_TTS_VOICES_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_TTS_WEBSOCKET_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

const OUTPUT_FORMAT_MAP: Record<AudioOutputFormat, string> = {
    mp3: 'audio-24khz-48kbitrate-mono-mp3',
    wav: 'riff-24khz-16bit-mono-pcm',
    ogg: 'ogg-24khz-16bit-mono-opus',
    webm: 'webm-24khz-16bit-mono-opus',
    opus: 'ogg-24khz-16bit-mono-opus',
};

const VOICE_CACHE_TTL = 3600000; // 1 hour
const MAX_TEXT_LENGTH = 5000;
const REQUEST_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Edge TTS Provider
// ============================================================================

/**
 * Edge TTS Provider Implementation
 */
export class EdgeTTSProvider extends BaseAudioProvider {
    readonly name = 'edge' as const;
    readonly requiresApiKey = false;
    readonly maxTextLength = MAX_TEXT_LENGTH;

    private voiceCache: Map<string, Voice> = new Map();
    private voiceListCache: Voice[] | null = null;
    private voiceListCacheTime: number = 0;
    private requestCount = 0;
    private windowStart = Date.now();
    private activeRequests = 0;

    constructor(
        retryConfig?: Partial<RetryConfig>,
        rateLimitConfig?: Partial<RateLimitConfig>
    ) {
        super(retryConfig, rateLimitConfig);
    }

    /**
     * Generate speech from text using Edge TTS
     */
    async generateSpeech(
        text: string,
        voiceId: string,
        options?: GenerationOptions
    ): Promise<GenerationResult> {
        const startTime = Date.now();
        const requestId = this.generateRequestId();

        console.log(`[EdgeTTS] Starting generation | Request: ${requestId} | Voice: ${voiceId} | Length: ${text.length} chars`);

        // Validate input
        this.validateText(text);
        await this.checkRateLimit();

        // Merge options with defaults
        const opts = this.mergeOptions(options);

        // Validate voice exists
        const voiceExists = await this.validateVoice(voiceId);
        if (!voiceExists) {
            throw new InvalidVoiceError('edge', voiceId);
        }

        this.activeRequests++;

        try {
            const result = await this.withRetry(
                () => this.performGeneration(text, voiceId, opts, requestId),
                'generateSpeech'
            );

            this.logMetrics('generateSpeech', startTime, text.length, true);
            return result;
        } catch (error) {
            this.logMetrics('generateSpeech', startTime, text.length, false);
            throw error;
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
    ): Promise<GenerationResult> {
        const startTime = Date.now();

        // Build SSML
        const ssml = options.useSSML
            ? text
            : this.buildSSML(text, voiceId, options);

        // Generate audio via WebSocket
        const audioBuffer = await this.synthesizeViaWebSocket(ssml, voiceId, options.format, requestId);

        const generationTime = Date.now() - startTime;

        return {
            audio: audioBuffer,
            format: options.format,
            size: audioBuffer.byteLength,
            voiceId,
            metadata: {
                provider: 'edge',
                generationTimeMs: generationTime,
                characterCount: text.length,
                timestamp: new Date(),
                requestId,
            },
        };
    }

    /**
     * Build SSML from text and options
     */
    private buildSSML(
        text: string,
        voiceId: string,
        options: Required<Omit<GenerationOptions, 'ssmlWrapper'>> & Pick<GenerationOptions, 'ssmlWrapper'>
    ): string {
        // Escape XML special characters
        const escapedText = this.escapeXml(text);

        // Build prosody attributes
        const prosodyAttrs: string[] = [];

        if (options.rate !== 1.0) {
            const ratePercent = Math.round((options.rate - 1) * 100);
            prosodyAttrs.push(`rate="${ratePercent >= 0 ? '+' : ''}${ratePercent}%"`);
        }

        if (options.pitch !== 0) {
            prosodyAttrs.push(`pitch="${options.pitch >= 0 ? '+' : ''}${options.pitch}%"`);
        }

        if (options.volume !== 100) {
            prosodyAttrs.push(`volume="${options.volume}"`);
        }

        // Build the inner content with prosody
        let content = escapedText;
        if (prosodyAttrs.length > 0) {
            content = `<prosody ${prosodyAttrs.join(' ')}>${escapedText}</prosody>`;
        }

        // Build style wrapper if specified
        if (options.style !== 'default') {
            content = `<mstts:express-as style="${options.style}" styledegree="${options.styleIntensity}">${content}</mstts:express-as>`;
        }

        // Full SSML structure
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this.getLocaleFromVoice(voiceId)}">
    <voice name="${voiceId}">
        ${content}
    </voice>
</speak>`;
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Extract locale from voice ID
     */
    private getLocaleFromVoice(voiceId: string): string {
        // Voice IDs are like "en-US-AriaNeural"
        const parts = voiceId.split('-');
        if (parts.length >= 2) {
            return `${parts[0]}-${parts[1]}`;
        }
        return 'en-US';
    }

    /**
     * Synthesize speech via WebSocket connection to Edge TTS
     */
    private async synthesizeViaWebSocket(
        ssml: string,
        voiceId: string,
        format: AudioOutputFormat,
        requestId: string
    ): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const outputFormat = OUTPUT_FORMAT_MAP[format] || OUTPUT_FORMAT_MAP.mp3;
            const connectionId = createHash('md5').update(requestId).digest('hex').toUpperCase();

            const wsUrl = `${EDGE_TTS_WEBSOCKET_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}`;

            let ws: WebSocket | null = null;
            const audioChunks: ArrayBuffer[] = [];
            let timeout: NodeJS.Timeout | null = null;

            const cleanup = () => {
                if (timeout) clearTimeout(timeout);
                if (ws && ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                }
            };

            try {
                // Use native WebSocket in Node.js 18+
                // Try to use 'ws' options (headers) if available
                // This is required for Edge TTS to accept the connection (needs Origin/User-Agent)
                try {
                    const options = {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                        }
                    };
                    // @ts-ignore - options not valid for standard WebSocket
                    ws = new WebSocket(wsUrl, options);
                } catch {
                    // Fallback for standard WebSocket (Browser/Undici)
                    ws = new WebSocket(wsUrl);
                }
                ws.binaryType = 'arraybuffer';

                timeout = setTimeout(() => {
                    cleanup();
                    reject(new TimeoutError('edge', REQUEST_TIMEOUT));
                }, REQUEST_TIMEOUT);

                ws.onopen = () => {
                    // Send config
                    const config: WSConfig = {
                        context: {
                            synthesis: {
                                audio: {
                                    metadataoptions: {
                                        sentenceBoundaryEnabled: false,
                                        wordBoundaryEnabled: false,
                                    },
                                    outputFormat,
                                },
                            },
                        },
                    };

                    const configMessage = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\nX-RequestId:${requestId}\r\n\r\n${JSON.stringify(config)}`;
                    ws!.send(configMessage);

                    // Send SSML
                    const ssmlMessage = `Content-Type:application/ssml+xml\r\nPath:ssml\r\nX-RequestId:${requestId}\r\n\r\n${ssml}`;
                    ws!.send(ssmlMessage);
                };

                ws.onmessage = (event) => {
                    if (event.data instanceof ArrayBuffer) {
                        // Binary audio data
                        // Edge TTS sends audio with a header that we need to skip
                        const view = new DataView(event.data);
                        const headerLength = view.getUint16(0, false);

                        if (event.data.byteLength > headerLength + 2) {
                            const audioData = event.data.slice(headerLength + 2);
                            audioChunks.push(audioData);
                        }
                    } else if (typeof event.data === 'string') {
                        // Text message
                        if (event.data.includes('Path:turn.end')) {
                            // Synthesis complete
                            cleanup();

                            // Combine chunks
                            const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
                            const result = new Uint8Array(totalLength);
                            let offset = 0;

                            for (const chunk of audioChunks) {
                                result.set(new Uint8Array(chunk), offset);
                                offset += chunk.byteLength;
                            }

                            resolve(result.buffer);
                        }
                    }
                };

                ws.onerror = (error) => {
                    cleanup();
                    console.error('[EdgeTTS] WebSocket error:', error);
                    reject(new AudioProviderError(
                        'WebSocket connection failed',
                        'NETWORK_ERROR',
                        'edge',
                        true
                    ));
                };

                ws.onclose = (event) => {
                    if (event.code !== 1000 && audioChunks.length === 0) {
                        reject(new AudioProviderError(
                            `WebSocket closed unexpectedly: ${event.reason || event.code}`,
                            'GENERATION_FAILED',
                            'edge',
                            true
                        ));
                    }
                };
            } catch (error) {
                cleanup();
                throw error;
            }
        });
    }

    /**
     * Check rate limit before making a request
     */
    private async checkRateLimit(): Promise<void> {
        const now = Date.now();

        // Reset window if expired
        if (now - this.windowStart >= this.rateLimitConfig.windowMs) {
            this.requestCount = 0;
            this.windowStart = now;
        }

        // Check request count
        if (this.requestCount >= this.rateLimitConfig.maxRequests) {
            const retryAfter = this.rateLimitConfig.windowMs - (now - this.windowStart);
            throw new RateLimitError('edge', retryAfter);
        }

        // Check concurrent requests
        if (this.activeRequests >= this.rateLimitConfig.maxConcurrent) {
            // Wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.checkRateLimit();
        }

        this.requestCount++;
    }

    /**
     * List all available Edge TTS voices
     */
    async listVoices(locale?: string): Promise<Voice[]> {
        // Check cache
        const now = Date.now();
        if (this.voiceListCache && (now - this.voiceListCacheTime) < VOICE_CACHE_TTL) {
            return locale
                ? this.voiceListCache.filter(v => v.locale.toLowerCase().startsWith(locale.toLowerCase()))
                : this.voiceListCache;
        }

        console.log('[EdgeTTS] Fetching voice list...');

        try {
            const response = await fetch(EDGE_TTS_VOICES_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!response.ok) {
                throw new AudioProviderError(
                    `Failed to fetch voices: ${response.status}`,
                    'NETWORK_ERROR',
                    'edge',
                    true
                );
            }

            const data: EdgeTTSVoice[] = await response.json();

            // Transform to our Voice format
            this.voiceListCache = data.map(v => this.transformVoice(v));
            this.voiceListCacheTime = now;

            // Update voice cache
            for (const voice of this.voiceListCache) {
                this.voiceCache.set(voice.id, voice);
            }

            console.log(`[EdgeTTS] Loaded ${this.voiceListCache.length} voices`);

            return locale
                ? this.voiceListCache.filter(v => v.locale.toLowerCase().startsWith(locale.toLowerCase()))
                : this.voiceListCache;
        } catch (error) {
            if (error instanceof AudioProviderError) throw error;
            throw new AudioProviderError(
                `Failed to list voices: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'NETWORK_ERROR',
                'edge',
                true
            );
        }
    }

    /**
     * Transform Edge TTS voice to our Voice format
     */
    private transformVoice(edgeVoice: EdgeTTSVoice): Voice {
        const locale = edgeVoice.Locale;
        const languageName = this.getLanguageName(locale);
        const gender = this.parseGender(edgeVoice.Gender);
        const styles = this.parseStyles(edgeVoice.VoiceTag?.VoicePersonalities || []);

        return {
            id: edgeVoice.ShortName,
            name: edgeVoice.FriendlyName.replace('Microsoft ', '').replace(' Online (Natural)', ''),
            provider: 'edge',
            locale,
            language: languageName,
            gender,
            styles,
            isNeural: edgeVoice.ShortName.includes('Neural'),
            metadata: {
                fullName: edgeVoice.Name,
                friendlyName: edgeVoice.FriendlyName,
                codec: edgeVoice.SuggestedCodec,
                status: edgeVoice.Status,
                contentCategories: edgeVoice.VoiceTag?.ContentCategories,
                personalities: edgeVoice.VoiceTag?.VoicePersonalities,
            },
        };
    }

    /**
     * Parse gender from Edge TTS response
     */
    private parseGender(gender: string): VoiceGender {
        switch (gender.toLowerCase()) {
            case 'male':
                return 'male';
            case 'female':
                return 'female';
            case 'neutral':
                return 'neutral';
            default:
                return 'unknown';
        }
    }

    /**
     * Parse voice styles from personalities
     */
    private parseStyles(personalities: string[]): VoiceStyle[] {
        const styleMap: Record<string, VoiceStyle> = {
            friendly: 'chat',
            newscast: 'newscast',
            assistant: 'assistant',
            customerservice: 'customer-service',
            narration: 'narration',
            expressive: 'expressive',
        };

        const styles: VoiceStyle[] = [];
        for (const personality of personalities) {
            const style = styleMap[personality.toLowerCase()];
            if (style) styles.push(style);
        }

        return styles.length > 0 ? styles : ['natural'];
    }

    /**
     * Get language name from locale
     */
    private getLanguageName(locale: string): string {
        const languageNames: Record<string, string> = {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'en-AU': 'English (Australia)',
            'ja-JP': 'Japanese',
            'zh-CN': 'Chinese (Simplified)',
            'zh-TW': 'Chinese (Traditional)',
            'ko-KR': 'Korean',
            'es-ES': 'Spanish (Spain)',
            'es-MX': 'Spanish (Mexico)',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'pt-BR': 'Portuguese (Brazil)',
            'ru-RU': 'Russian',
            'ar-SA': 'Arabic',
            'hi-IN': 'Hindi',
        };

        return languageNames[locale] || locale;
    }

    /**
     * Get detailed voice information
     */
    async getVoiceInfo(voiceId: string): Promise<VoiceInfo> {
        // Check cache first
        let voice = this.voiceCache.get(voiceId);

        if (!voice) {
            // Load voices if not cached
            await this.listVoices();
            voice = this.voiceCache.get(voiceId);
        }

        if (!voice) {
            throw new InvalidVoiceError('edge', voiceId);
        }

        return {
            ...voice,
            ssmlFeatures: {
                emphasis: true,
                prosody: true,
                break: true,
                sayAs: true,
                phoneme: false,
                expressAs: true,
            },
            supportsPitchAdjustment: true,
            supportsRateAdjustment: true,
            supportsVolumeAdjustment: true,
            outputFormats: ['mp3', 'wav', 'ogg', 'webm', 'opus'],
        };
    }

    /**
     * Get provider status
     */
    async getStatus(): Promise<ProviderStatus> {
        try {
            const startTime = Date.now();
            await this.listVoices();
            const responseTime = Date.now() - startTime;

            return {
                available: true,
                name: 'Edge TTS',
                message: 'Service is operational',
                lastChecked: new Date(),
                avgResponseTimeMs: responseTime,
                errorRate: 0,
            };
        } catch (error) {
            return {
                available: false,
                name: 'Edge TTS',
                message: error instanceof Error ? error.message : 'Unknown error',
                lastChecked: new Date(),
            };
        }
    }

    /**
     * Get a voice sample
     */
    async getVoiceSample(voiceId: string, sampleText?: string): Promise<GenerationResult> {
        const text = sampleText || 'Hello! This is a sample of how this voice sounds.';
        return this.generateSpeech(text, voiceId, { format: 'mp3' });
    }

    /**
     * Clear voice cache
     */
    clearCache(): void {
        this.voiceCache.clear();
        this.voiceListCache = null;
        this.voiceListCacheTime = 0;
        console.log('[EdgeTTS] Cache cleared');
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new EdgeTTSProvider instance
 */
export function createEdgeTTSProvider(
    retryConfig?: Partial<RetryConfig>,
    rateLimitConfig?: Partial<RateLimitConfig>
): EdgeTTSProvider {
    return new EdgeTTSProvider(retryConfig, rateLimitConfig);
}

// Default export and singleton
let defaultProvider: EdgeTTSProvider | null = null;

/**
 * Get the default EdgeTTSProvider instance (singleton)
 */
export function getEdgeTTSProvider(): EdgeTTSProvider {
    if (!defaultProvider) {
        defaultProvider = new EdgeTTSProvider();
    }
    return defaultProvider;
}

export default EdgeTTSProvider;
