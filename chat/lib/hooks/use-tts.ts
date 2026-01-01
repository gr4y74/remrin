import { useState, useRef, useEffect, useCallback } from "react"

interface UseTTSOptions {
    voiceId?: string
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: string) => void
}

export function useTTS(options: UseTTSOptions = {}) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    const speak = useCallback(async (text: string, overrideVoiceId?: string) => {
        if (!text) return

        try {
            // Stop current playback
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
                setIsPlaying(false)
            }

            setIsLoading(true)

            const response = await fetch("/api/voice/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    voiceId: overrideVoiceId || options.voiceId,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to generate speech")
            }

            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)
            const audio = new Audio(audioUrl)

            audioRef.current = audio

            audio.onplay = () => {
                setIsPlaying(true)
                setIsLoading(false)
                options.onStart?.()
            }

            audio.onended = () => {
                setIsPlaying(false)
                options.onEnd?.()
                URL.revokeObjectURL(audioUrl) // Cleanup memory
            }

            audio.onerror = (e) => {
                console.error("Audio playback error:", e)
                setIsPlaying(false)
                setIsLoading(false)
                options.onError?.("Audio playback failed")
            }

            await audio.play()
        } catch (error) {
            console.error("TTS Error:", error)
            setIsLoading(false)
            setIsPlaying(false)
            options.onError?.(error instanceof Error ? error.message : "Unknown TTS error")
        }
    }, [options])

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
            setIsPlaying(false)
        }
    }, [])

    return {
        speak,
        stop,
        isPlaying,
        isLoading
    }
}
