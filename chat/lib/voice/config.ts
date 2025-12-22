/**
 * Voice Configuration
 * Defines available voices and TTS provider settings
 * Extensible for future ElevenLabs/Azure/Google integration
 */

export type VoiceGender = "male" | "female" | "neutral"

export interface VoiceConfig {
    id: string
    name: string
    gender: VoiceGender
    language: string
    pitch: number // 0.5 to 2.0, default 1.0
    rate: number // 0.5 to 2.0, default 1.0
    description?: string
    // For external providers
    providerId?: string
    providerVoiceId?: string
}

export interface TTSProvider {
    id: string
    name: string
    type: "browser" | "elevenlabs" | "google" | "azure"
    apiKeyEnvVar?: string
    baseUrl?: string
}

// Available TTS providers
export const TTS_PROVIDERS: TTSProvider[] = [
    {
        id: "browser",
        name: "Browser (Web Speech API)",
        type: "browser"
    },
    {
        id: "elevenlabs",
        name: "ElevenLabs",
        type: "elevenlabs",
        apiKeyEnvVar: "ELEVENLABS_API_KEY",
        baseUrl: "https://api.elevenlabs.io/v1"
    }
]

// Default provider
export const DEFAULT_TTS_PROVIDER = "browser"

// Available voices (using Web Speech API voice names as reference)
export const AVAILABLE_VOICES: VoiceConfig[] = [
    // Male voices
    {
        id: "male-1",
        name: "Alex",
        gender: "male",
        language: "en-US",
        pitch: 1.0,
        rate: 1.0,
        description: "Professional male voice"
    },
    {
        id: "male-2",
        name: "Daniel",
        gender: "male",
        language: "en-GB",
        pitch: 0.9,
        rate: 0.95,
        description: "British male voice"
    },
    {
        id: "male-3",
        name: "Marcus",
        gender: "male",
        language: "en-US",
        pitch: 0.85,
        rate: 1.0,
        description: "Deep male voice"
    },
    // Female voices
    {
        id: "female-1",
        name: "Samantha",
        gender: "female",
        language: "en-US",
        pitch: 1.1,
        rate: 1.0,
        description: "Warm female voice"
    },
    {
        id: "female-2",
        name: "Victoria",
        gender: "female",
        language: "en-GB",
        pitch: 1.0,
        rate: 0.95,
        description: "British female voice"
    },
    {
        id: "female-3",
        name: "Luna",
        gender: "female",
        language: "en-US",
        pitch: 1.15,
        rate: 1.05,
        description: "Expressive female voice"
    }
]

// Default voice
export const DEFAULT_VOICE_ID = "female-1"

/**
 * Get voice configuration by ID
 */
export function getVoiceById(voiceId: string): VoiceConfig | undefined {
    return AVAILABLE_VOICES.find(v => v.id === voiceId)
}

/**
 * Get voices by gender
 */
export function getVoicesByGender(gender: VoiceGender): VoiceConfig[] {
    return AVAILABLE_VOICES.filter(v => v.gender === gender)
}

/**
 * Average speaking rate in words per minute
 * Used for duration estimation
 */
export const AVERAGE_WPM = 150

/**
 * TTS Settings for UI
 */
export interface TTSSettings {
    enabled: boolean
    autoPlay: boolean
    volume: number // 0 to 1
    defaultVoiceId: string
}

export const DEFAULT_TTS_SETTINGS: TTSSettings = {
    enabled: true,
    autoPlay: false,
    volume: 0.8,
    defaultVoiceId: DEFAULT_VOICE_ID
}
