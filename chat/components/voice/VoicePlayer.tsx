"use client"

import { cn } from "@/lib/utils"
import { IconPlayerPause, IconPlayerPlay, IconVolume } from "@tabler/icons-react"
import { FC, useCallback, useEffect, useRef, useState } from "react"

interface VoicePlayerProps {
    /** Audio source URL or base64 data */
    audioUrl?: string
    /** Text to speak (for Web Speech API fallback) */
    text?: string
    /** Voice ID for TTS */
    voiceId?: string
    /** Callback when playback starts */
    onPlay?: () => void
    /** Callback when playback pauses */
    onPause?: () => void
    /** Callback when playback ends */
    onEnd?: () => void
    /** Additional CSS classes */
    className?: string
    /** Compact mode (less padding) */
    compact?: boolean
}

/**
 * VoicePlayer - Reusable audio player component
 * Supports both HTML5 Audio and Web Speech API
 */
export const VoicePlayer: FC<VoicePlayerProps> = ({
    audioUrl,
    text,
    voiceId = "female-1",
    onPlay,
    onPause,
    onEnd,
    className,
    compact = false
}) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const speechRef = useRef<{
        cancel: () => void
        pause: () => void
        resume: () => void
        speaking: () => boolean
    } | null>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            if (speechRef.current) {
                speechRef.current.cancel()
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }
    }, [])

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    // Estimate duration from text
    const estimateDuration = (inputText: string): number => {
        const wordCount = inputText.split(/\s+/).filter(w => w.length > 0).length
        return Math.max(1, Math.round((wordCount / 150) * 60))
    }

    // Handle play using Web Speech API
    const handleWebSpeechPlay = useCallback(() => {
        if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
            return
        }

        setIsLoading(true)

        // Cancel any existing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        // Try to find a suitable voice
        const voices = window.speechSynthesis.getVoices()
        const englishVoice = voices.find(v => v.lang.startsWith("en"))
        if (englishVoice) {
            utterance.voice = englishVoice
        }

        const estimatedDuration = estimateDuration(text)
        setDuration(estimatedDuration)

        utterance.onstart = () => {
            setIsPlaying(true)
            setIsLoading(false)
            onPlay?.()

            // Simulate progress
            const startTime = Date.now()
            progressIntervalRef.current = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000
                setCurrentTime(Math.min(elapsed, estimatedDuration))
                setProgress(Math.min((elapsed / estimatedDuration) * 100, 100))
            }, 100)
        }

        utterance.onend = () => {
            setIsPlaying(false)
            setProgress(100)
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
            onEnd?.()
        }

        utterance.onerror = () => {
            setIsPlaying(false)
            setIsLoading(false)
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }

        window.speechSynthesis.speak(utterance)

        speechRef.current = {
            cancel: () => window.speechSynthesis.cancel(),
            pause: () => window.speechSynthesis.pause(),
            resume: () => window.speechSynthesis.resume(),
            speaking: () => window.speechSynthesis.speaking
        }
    }, [text, onPlay, onEnd])

    // Handle play for HTML5 Audio
    const handleAudioPlay = useCallback(() => {
        if (!audioUrl || audioUrl.startsWith("speech://")) {
            handleWebSpeechPlay()
            return
        }

        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl)

            audioRef.current.onloadedmetadata = () => {
                setDuration(audioRef.current?.duration || 0)
            }

            audioRef.current.ontimeupdate = () => {
                const audio = audioRef.current
                if (audio) {
                    setCurrentTime(audio.currentTime)
                    setProgress((audio.currentTime / audio.duration) * 100)
                }
            }

            audioRef.current.onended = () => {
                setIsPlaying(false)
                setProgress(100)
                onEnd?.()
            }
        }

        audioRef.current.play()
        setIsPlaying(true)
        onPlay?.()
    }, [audioUrl, handleWebSpeechPlay, onPlay, onEnd])

    // Toggle play/pause
    const togglePlayback = () => {
        if (isLoading) return

        if (isPlaying) {
            // Pause
            if (audioRef.current) {
                audioRef.current.pause()
            }
            if (speechRef.current) {
                speechRef.current.pause()
            }
            setIsPlaying(false)
            onPause?.()
        } else {
            // Play
            if (audioRef.current && progress < 100) {
                audioRef.current.play()
                setIsPlaying(true)
                onPlay?.()
            } else if (speechRef.current && speechRef.current.speaking()) {
                speechRef.current.resume()
                setIsPlaying(true)
                onPlay?.()
            } else {
                handleAudioPlay()
            }
        }
    }

    // Handle seek on progress bar
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = percentage * duration

        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
        setProgress(percentage * 100)
    }

    return (
        <div
            className={cn(
                "bg-secondary/50 flex items-center gap-3 rounded-lg",
                compact ? "px-2 py-1.5" : "px-4 py-3",
                className
            )}
        >
            {/* Play/Pause Button */}
            <button
                onClick={togglePlayback}
                disabled={isLoading}
                className={cn(
                    "flex items-center justify-center rounded-full transition-colors",
                    compact ? "size-8" : "size-10",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isLoading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPlaying ? (
                    <IconPlayerPause size={compact ? 16 : 20} />
                ) : (
                    <IconPlayerPlay size={compact ? 16 : 20} className="ml-0.5" />
                )}
            </button>

            {/* Progress Bar */}
            <div className="flex flex-1 flex-col gap-1">
                <div
                    className={cn(
                        "bg-muted w-full cursor-pointer rounded-full",
                        compact ? "h-1" : "h-1.5"
                    )}
                    onClick={handleSeek}
                >
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Duration display */}
                {!compact && (
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                )}
            </div>

            {/* Volume icon */}
            {!compact && (
                <IconVolume size={16} className="text-muted-foreground" />
            )}
        </div>
    )
}
