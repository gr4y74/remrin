"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface GenerationSettings {
    voiceId: string
    pitch?: number
    speed?: number
    volume?: number
    emotion?: string
}

interface UseAudioGenerationReturn {
    generate: (text: string, settings: GenerationSettings) => Promise<string | null>
    cancel: () => void
    loading: boolean
    progress: number
    audioUrl: string | null
    error: string | null
    reset: () => void
}

export function useAudioGeneration(): UseAudioGenerationReturn {
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [abortController, setAbortController] = useState<AbortController | null>(null)

    const cancel = useCallback(() => {
        if (abortController) {
            abortController.abort()
            setAbortController(null)
            setLoading(false)
            setProgress(0)
            toast.info("Generation cancelled")
        }
    }, [abortController])

    const reset = useCallback(() => {
        setAudioUrl(null)
        setError(null)
        setProgress(0)
        setLoading(false)
    }, [])

    const generate = useCallback(async (text: string, settings: GenerationSettings) => {
        if (!text.trim()) {
            toast.error("Please enter some text")
            return null
        }

        if (!settings.voiceId) {
            toast.error("Please select a voice")
            return null
        }

        // Cancel previous request if exists
        if (abortController) {
            abortController.abort()
        }

        const controller = new AbortController()
        setAbortController(controller)
        setLoading(true)
        setProgress(0)
        setError(null)
        setAudioUrl(null)

        // Simulated progress since we don't have real stream progress yet
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90))
        }, 300)

        try {
            const response = await fetch("/api/audio/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    voiceId: settings.voiceId,
                    settings: {
                        pitch: settings.pitch,
                        speed: settings.speed,
                        volume: settings.volume,
                        emotion: settings.emotion
                    }
                }),
                signal: controller.signal
            })

            clearInterval(progressInterval)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to generate audio")
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            setAudioUrl(url)
            setProgress(100)
            return url

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('Request aborted')
            } else {
                console.error("Audio generation error:", err)
                const message = err instanceof Error ? err.message : "Failed to generate audio"
                setError(message)
                toast.error(message)
            }
            return null
        } finally {
            setLoading(false)
            setAbortController(null)
            clearInterval(progressInterval)
        }
    }, [abortController])

    return {
        generate,
        cancel,
        loading,
        progress,
        audioUrl,
        error,
        reset
    }
}
