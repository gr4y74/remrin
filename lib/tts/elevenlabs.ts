/**
 * ElevenLabs TTS Integration
 * Provides high-quality voice synthesis using ElevenLabs API
 */

export interface ElevenLabsVoiceSettings {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
}

export interface ElevenLabsTTSOptions {
    text: string;
    voiceId: string;
    modelId?: string;
    voiceSettings?: ElevenLabsVoiceSettings;
}

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsTTS {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Generate speech from text using ElevenLabs
     * @returns ReadableStream of audio data
     */
    async generateSpeech(options: ElevenLabsTTSOptions): Promise<ReadableStream<Uint8Array>> {
        const {
            text,
            voiceId,
            modelId = 'eleven_monolingual_v1',
            voiceSettings = {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.5,
                use_speaker_boost: true,
            },
        } = options;

        const response = await fetch(
            `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify({
                    text,
                    model_id: modelId,
                    voice_settings: voiceSettings,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
        }

        if (!response.body) {
            throw new Error('No response body from ElevenLabs API');
        }

        return response.body;
    }

    /**
     * Get available voices from ElevenLabs
     */
    async getVoices() {
        const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
            headers: {
                'xi-api-key': this.apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch voices: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Check if API key is valid
     */
    async validateApiKey(): Promise<boolean> {
        try {
            await this.getVoices();
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Create ElevenLabs TTS instance
 */
export function createElevenLabsTTS(): ElevenLabsTTS | null {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        console.warn('ELEVENLABS_API_KEY not configured');
        return null;
    }

    return new ElevenLabsTTS(apiKey);
}
