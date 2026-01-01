"use client"

import { cn } from "@/lib/utils"
import { speakText } from "@/lib/voice/tts"
import { IconVolume } from "@tabler/icons-react"
import React, { FC, useEffect, useRef, useState } from "react"

interface MotherMessageProps {
    /** The message content from the Mother (for TTS) */
    message?: string
    /** Auto-play TTS when message appears */
    autoPlay?: boolean
    /** Voice ID for TTS (defaults to Mother's voice) */
    voiceId?: string
    /** Callback when speaking completes */
    onSpeakComplete?: () => void
    /** Additional CSS classes */
    className?: string
    /** Content to render */
    children?: React.ReactNode
    /** Whether the message is still streaming */
    isStreaming?: boolean
}

// Default voice for the Mother of Souls
const MOTHER_VOICE_ID = "female-mystical" // Ancient, mystical voice

/**
 * MotherMessage - Special styling for Mother of Souls messages
 * Features subtle blue glow/aura and optional auto-TTS playback
 */
export const MotherMessage: FC<MotherMessageProps> = ({
    message,
    autoPlay = true,
    voiceId = MOTHER_VOICE_ID,
    onSpeakComplete,
    className,
    children,
    isStreaming = false
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
                "animate-fade-in-up relative max-w-[85%]",
                className
            )}
        >
            {/* Outer glow effect */}
            <div
                className={cn(
                    "absolute -inset-2 rounded-2xl blur-xl",
                    "from-rp-pine/20 via-rp-foam/20 to-rp-pine/20 bg-gradient-to-r",
                    "animate-mother-glow",
                    isSpeaking && "opacity-75"
                )}
            />

            {/* Message bubble */}
            <div
                className={cn(
                    "relative rounded-2xl px-5 py-4",
                    "from-rp-surface/90 via-rp-surface/80 to-rp-base/90 bg-gradient-to-br",
                    "border-rp-pine/30 border",
                    "backdrop-blur-sm",
                    "shadow-rp-pine/10 shadow-lg"
                )}
            >
                {/* Speaking indicator */}
                {isSpeaking && (
                    <div className="bg-rp-pine/80 absolute -right-2 -top-2 flex animate-pulse items-center gap-1 rounded-full px-2 py-1">
                        <IconVolume size={12} className="text-white" />
                        <span className="text-xs font-medium text-white">Speaking</span>
                    </div>
                )}

                {/* Message content */}
                <div className="text-rp-text/90 text-sm leading-relaxed">
                    {children || (
                        <p className="whitespace-pre-wrap">
                            {message}
                        </p>
                    )}
                    {isStreaming && !children && (
                        <div className="mt-2">
                            <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rp-pine" style={{ animationDelay: '0ms' }} />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rp-pine" style={{ animationDelay: '150ms' }} />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rp-pine" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative element */}
                <div className="from-rp-pine absolute bottom-0 left-4 h-[2px] w-8 rounded-full bg-gradient-to-r to-transparent" />
            </div>
        </div>
    )
}

export default MotherMessage
