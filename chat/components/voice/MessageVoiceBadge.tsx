"use client"

import { cn } from "@/lib/utils"
import { IconPlayerPause, IconPlayerPlay, IconVolume2 } from "@tabler/icons-react"
import { FC, useCallback, useEffect, useRef, useState } from "react"

interface MessageVoiceBadgeProps {
    /** Text content to be spoken */
    text: string
    /** Voice ID for TTS */
    voiceId?: string
    /** Additional CSS classes */
    className?: string
}

/**
 * MessageVoiceBadge - Compact voice playback badge for AI messages
 * Shows play/pause button, audio visualization bars, and duration
 */
export const MessageVoiceBadge: FC<MessageVoiceBadgeProps> = ({
    text,
    voiceId = "female-1",
    className
}) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [estimatedDuration, setEstimatedDuration] = useState(0)

    const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

    // Calculate estimated duration on mount
    useEffect(() => {
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
        const duration = Math.max(1, Math.round((wordCount / 150) * 60))
        setEstimatedDuration(duration)
    }, [text])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    // Format duration
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        if (mins === 0) return `${secs}s`
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    // Handle play/pause toggle
    const togglePlayback = useCallback(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            console.warn("Speech synthesis not available")
            return
        }

        if (isPlaying) {
            // Stop playback
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            return
        }

        // Start playback
        setIsLoading(true)
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        speechRef.current = utterance

        // Try to find a suitable voice
        const voices = window.speechSynthesis.getVoices()
        const englishVoice = voices.find(v => v.lang.startsWith("en"))
        if (englishVoice) {
            utterance.voice = englishVoice
        }

        utterance.onstart = () => {
            setIsPlaying(true)
            setIsLoading(false)
        }

        utterance.onend = () => {
            setIsPlaying(false)
        }

        utterance.onerror = () => {
            setIsPlaying(false)
            setIsLoading(false)
        }

        window.speechSynthesis.speak(utterance)
    }, [isPlaying, text])

    return (
        <button
            onClick={togglePlayback}
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
                "border border-white/10 bg-white/5",
                "hover:border-white/20 hover:bg-white/10",
                "transition-all duration-200",
                "text-muted-foreground text-sm",
                "focus:ring-primary/50 focus:outline-none focus:ring-2",
                className
            )}
            aria-label={isPlaying ? "Stop voice playback" : "Play voice message"}
        >
            {/* Play/Pause icon */}
            {isLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
                <IconPlayerPause size={16} className="text-primary" />
            ) : (
                <IconPlayerPlay size={16} />
            )}

            {/* Audio visualization bars */}
            <div className="flex h-4 items-end gap-0.5">
                {[1, 2, 3, 4].map((bar) => (
                    <div
                        key={bar}
                        className={cn(
                            "w-0.5 rounded-full bg-current transition-all duration-150",
                            isPlaying
                                ? "animate-pulse"
                                : "opacity-50"
                        )}
                        style={{
                            height: isPlaying
                                ? `${Math.random() * 100}%`
                                : `${25 + bar * 12}%`,
                            animationDelay: `${bar * 100}ms`
                        }}
                    />
                ))}
            </div>

            {/* Duration */}
            <span className="text-xs tabular-nums">
                {formatDuration(estimatedDuration)}
            </span>

            {/* Volume icon */}
            <IconVolume2 size={14} className="opacity-60" />
        </button>
    )
}
