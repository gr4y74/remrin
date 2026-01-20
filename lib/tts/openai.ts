/**
 * OpenAI TTS Integration
 * Provides fallback voice synthesis using OpenAI's TTS API
 */

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type OpenAIModel = 'tts-1' | 'tts-1-hd';

export interface OpenAITTSOptions {
    text: string;
    voice?: OpenAIVoice;
    model?: OpenAIModel;
    speed?: number; // 0.25 to 4.0
}

export class OpenAITTS {
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }

    /**
     * Generate speech from text using OpenAI TTS
     * @returns ReadableStream of audio data
     */
    async generateSpeech(options: OpenAITTSOptions): Promise<ReadableStream<Uint8Array>> {
        const {
            text,
            voice = 'alloy',
            model = 'tts-1',
            speed = 1.0,
        } = options;

        const response = await fetch(`${this.baseURL}/audio/speech`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                input: text,
                voice,
                speed,
                response_format: 'mp3',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI TTS API error: ${response.status} - ${error}`);
        }

        if (!response.body) {
            throw new Error('No response body from OpenAI TTS API');
        }

        return response.body;
    }

    /**
     * Map persona characteristics to appropriate OpenAI voice
     */
    static selectVoiceForPersona(personaGender?: string, personaTone?: string): OpenAIVoice {
        // Simple heuristic for voice selection
        const gender = personaGender?.toLowerCase();
        const tone = personaTone?.toLowerCase();

        if (gender === 'female') {
            if (tone?.includes('warm') || tone?.includes('friendly')) return 'nova';
            if (tone?.includes('professional') || tone?.includes('calm')) return 'shimmer';
            return 'alloy';
        } else if (gender === 'male') {
            if (tone?.includes('deep') || tone?.includes('serious')) return 'onyx';
            if (tone?.includes('energetic') || tone?.includes('young')) return 'echo';
            return 'fable';
        }

        // Default fallback
        return 'alloy';
    }
}

/**
 * Create OpenAI TTS instance
 */
export function createOpenAITTS(): OpenAITTS | null {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn('OPENAI_API_KEY not configured');
        return null;
    }

    return new OpenAITTS(apiKey);
}
