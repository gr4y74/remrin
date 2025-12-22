"use client"

import { cn } from "@/lib/utils"
import { speakText } from "@/lib/voice/tts"
import { IconVolume } from "@tabler/icons-react"
import { FC, useEffect, useRef, useState } from "react"

interface MotherMessageProps {
    /** The message content from the Mother */
    message: string
    /** Auto-play TTS when message appears */
    autoPlay?: boolean
    /** Voice ID for TTS (defaults to Mother's voice) */
    voiceId?: string
    /** Callback when speaking completes */
    onSpeakComplete?: () => void
    /** Additional CSS classes */
    className?: string
}

// Default voice for the Mother of Souls
const MOTHER_VOICE_ID = "female-3" // Luna - Expressive female voice

/**
 * MotherMessage - Special styling for Mother of Souls messages
 * Features subtle blue glow/aura and optional auto-TTS playback
 */
export const MotherMessage: FC<MotherMessageProps> = ({
    message,
    autoPlay = false,
    voiceId = MOTHER_VOICE_ID,
    onSpeakComplete,
    className
}) => {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const speechControlRef = useRef<{ cancel: () => void } | null>(null)
    const hasAutoPlayedRef = useRef(false)

    // Auto-play TTS on mount if enabled
    useEffect(() => {
        if (autoPlay && !hasAutoPlayedRef.current && message) {
            hasAutoPlayedRef.current = true

            // Small delay to let the message animate in first
            const timer = setTimeout(() => {
                setIsSpeaking(true)
                const control = speakText(message, voiceId, {
                    onEnd: () => {
                        setIsSpeaking(false)
                        onSpeakComplete?.()
                    },
                    onError: () => {
                        setIsSpeaking(false)
                    }
                })
                speechControlRef.current = control
            }, 500)

            return () => {
                clearTimeout(timer)
                speechControlRef.current?.cancel()
            }
        }
    }, [autoPlay, message, voiceId, onSpeakComplete])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            speechControlRef.current?.cancel()
        }
    }, [])

    return (
        <div
            className={cn(
                "relative max-w-[85%] animate-fade-in-up",
                className
            )}
        >
            {/* Outer glow effect */}
            <div
                className={cn(
                    "absolute -inset-2 rounded-2xl blur-xl",
                    "bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20",
                    "animate-mother-glow",
                    isSpeaking && "opacity-75"
                )}
            />

            {/* Message bubble */}
            <div
                className={cn(
                    "relative px-5 py-4 rounded-2xl",
                    "bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90",
                    "border border-blue-500/30",
                    "backdrop-blur-sm",
                    "shadow-lg shadow-blue-500/10"
                )}
            >
                {/* Speaking indicator */}
                {isSpeaking && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/80 animate-pulse">
                        <IconVolume size={12} className="text-white" />
                        <span className="text-[10px] text-white font-medium">Speaking</span>
                    </div>
                )}

                {/* Message content */}
                <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {message}
                </p>

                {/* Decorative element */}
                <div className="absolute bottom-0 left-4 w-8 h-[2px] bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
            </div>
        </div>
    )
}

export default MotherMessage
