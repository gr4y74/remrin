/**
 * Voice Library Exports
 */

// Config exports
export {
    AVAILABLE_VOICES,
    AVERAGE_WPM,
    DEFAULT_TTS_PROVIDER,
    DEFAULT_TTS_SETTINGS,
    DEFAULT_VOICE_ID,
    getVoiceById,
    getVoicesByGender,
    TTS_PROVIDERS,
    type TTSProvider,
    type TTSSettings,
    type VoiceConfig,
    type VoiceGender
} from "./config"

// TTS function exports
export {
    estimateDuration,
    getAvailableVoices,
    getBrowserVoices,
    hashText,
    isSpeechSynthesisAvailable,
    speakText,
    synthesizeSpeech
} from "./tts"
