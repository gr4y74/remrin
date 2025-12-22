/**
 * TTS Utility Functions
 * Handles text-to-speech synthesis using Web Speech API
 * with fallback structure for future provider integration
 */

import {
    AVAILABLE_VOICES,
    AVERAGE_WPM,
    DEFAULT_VOICE_ID,
    getVoiceById,
    type VoiceConfig
} from "./config"

/**
 * Check if Web Speech API is available
 */
export function isSpeechSynthesisAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window
}

/**
 * Get available browser voices
 * Note: This may need to be called after voices are loaded
 */
export function getBrowserVoices(): SpeechSynthesisVoice[] {
    if (!isSpeechSynthesisAvailable()) return []
    return window.speechSynthesis.getVoices()
}

/**
 * Find the best matching browser voice for a voice config
 */
function findBrowserVoice(config: VoiceConfig): SpeechSynthesisVoice | null {
    const voices = getBrowserVoices()
    if (voices.length === 0) return null

    // Try to find exact language match
    const languageMatch = voices.find(
        v => v.lang.startsWith(config.language.split("-")[0])
    )

    // Fallback to any English voice
    const englishVoice = voices.find(v => v.lang.startsWith("en"))

    // Use first available voice as last resort
    return languageMatch || englishVoice || voices[0]
}

/**
 * Estimate audio duration based on text length
 * @param text - The text to be spoken
 * @param rate - Speaking rate multiplier (default 1.0)
 * @returns Duration in seconds
 */
export function estimateDuration(text: string, rate: number = 1.0): number {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
    const minutesAtNormalRate = wordCount / AVERAGE_WPM
    const seconds = (minutesAtNormalRate * 60) / rate
    return Math.max(1, Math.round(seconds))
}

/**
 * Get available voices
 */
export function getAvailableVoices(): VoiceConfig[] {
    return AVAILABLE_VOICES
}

/**
 * Speak text using Web Speech API (client-side only)
 * Returns a promise that resolves when speaking is complete
 */
export function speakText(
    text: string,
    voiceId?: string,
    options?: {
        onStart?: () => void
        onEnd?: () => void
        onError?: (error: Error) => void
        onBoundary?: (event: SpeechSynthesisEvent) => void
    }
): {
    cancel: () => void
    pause: () => void
    resume: () => void
    speaking: () => boolean
} {
    const noop = () => { }
    const nullControl = {
        cancel: noop,
        pause: noop,
        resume: noop,
        speaking: () => false
    }

    if (!isSpeechSynthesisAvailable()) {
        options?.onError?.(new Error("Speech synthesis not available"))
        return nullControl
    }

    const synth = window.speechSynthesis
    const voiceConfig = getVoiceById(voiceId || DEFAULT_VOICE_ID) || AVAILABLE_VOICES[0]

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.pitch = voiceConfig.pitch
    utterance.rate = voiceConfig.rate
    utterance.lang = voiceConfig.language

    // Try to set the voice
    const browserVoice = findBrowserVoice(voiceConfig)
    if (browserVoice) {
        utterance.voice = browserVoice
    }

    // Event handlers
    utterance.onstart = () => options?.onStart?.()
    utterance.onend = () => options?.onEnd?.()
    utterance.onerror = (event) => {
        options?.onError?.(new Error(`Speech synthesis error: ${event.error}`))
    }
    utterance.onboundary = (event) => options?.onBoundary?.(event)

    // Start speaking
    synth.speak(utterance)

    return {
        cancel: () => synth.cancel(),
        pause: () => synth.pause(),
        resume: () => synth.resume(),
        speaking: () => synth.speaking
    }
}

/**
 * API-based TTS synthesis
 * For use with external providers like ElevenLabs
 * Returns a URL to the generated audio
 */
export async function synthesizeSpeech(
    text: string,
    voiceId?: string
): Promise<{ audioUrl: string; duration: number; cached: boolean }> {
    const response = await fetch("/api/voice/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text,
            voiceId: voiceId || DEFAULT_VOICE_ID
        })
    })

    if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`)
    }

    return response.json()
}

/**
 * Hash text for caching purposes
 * Simple hash function for client-side cache keys
 */
export function hashText(text: string, voiceId: string): string {
    let hash = 0
    const str = `${voiceId}:${text}`
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
}
