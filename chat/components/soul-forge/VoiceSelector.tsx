"use client"

import { cn } from "@/lib/utils"
import { AVAILABLE_VOICES, type VoiceConfig } from "@/lib/voice/config"
import { speakText } from "@/lib/voice/tts"
import { IconCheck, IconGenderFemale, IconGenderMale, IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react"
import { FC, useCallback, useRef, useState } from "react"

interface VoiceSelectorProps {
    /** Callback when a voice is selected */
    onSelect: (voiceId: string) => void
    /** Currently selected voice ID */
    selectedId?: string
    /** Additional CSS classes */
    className?: string
}

const SAMPLE_TEXT = "Hello! I'm excited to be your companion on this journey."

/**
 * VoiceSelector - Grid of voice options for soul creation
 * Shows name, gender icon, preview button for each voice
 */
export const VoiceSelector: FC<VoiceSelectorProps> = ({
    onSelect,
    selectedId,
    className
}) => {
    const [previewingId, setPreviewingId] = useState<string | null>(null)
    const speechControlRef = useRef<{ cancel: () => void } | null>(null)

    const getGenderIcon = (gender: VoiceConfig["gender"]) => {
        switch (gender) {
            case "male":
                return <IconGenderMale size={18} className="text-blue-400" />
            case "female":
                return <IconGenderFemale size={18} className="text-pink-400" />
            default:
                return <span className="text-amber-400 text-sm">◆</span>
        }
    }

    const getGenderColor = (gender: VoiceConfig["gender"]) => {
        switch (gender) {
            case "male":
                return "from-blue-500 to-cyan-500"
            case "female":
                return "from-pink-500 to-rose-500"
            default:
                return "from-amber-500 to-orange-500"
        }
    }

    const handlePreview = useCallback((voice: VoiceConfig) => {
        // If already previewing this voice, stop it
        if (previewingId === voice.id) {
            speechControlRef.current?.cancel()
            setPreviewingId(null)
            return
        }

        // Cancel any current preview
        speechControlRef.current?.cancel()

        // Start new preview
        setPreviewingId(voice.id)
        const control = speakText(SAMPLE_TEXT, voice.id, {
            onEnd: () => setPreviewingId(null),
            onError: () => setPreviewingId(null)
        })
        speechControlRef.current = control
    }, [previewingId])

    const handleSelect = useCallback((voiceId: string) => {
        // Stop any preview
        speechControlRef.current?.cancel()
        setPreviewingId(null)
        onSelect(voiceId)
    }, [onSelect])

    return (
        <div className={cn("w-full", className)}>
            {/* Header */}
            <div className="mb-4 text-center">
                <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-wider">
                    Select Voice Frequency
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Click preview to hear, then select your companion&apos;s voice
                </p>
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_VOICES.map((voice) => {
                    const isSelected = selectedId === voice.id
                    const isPreviewing = previewingId === voice.id

                    return (
                        <div
                            key={voice.id}
                            className={cn(
                                "relative rounded-xl p-4 transition-all duration-300",
                                "bg-white/5 border border-white/10",
                                "hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg",
                                isSelected && [
                                    "ring-2 ring-offset-2 ring-offset-background",
                                    `bg-gradient-to-br ${getGenderColor(voice.gender)} bg-opacity-10`,
                                    "border-transparent animate-pulse-glow"
                                ]
                            )}
                            style={isSelected ? {
                                "--glow-color": voice.gender === "male" ? "rgba(59, 130, 246, 0.5)" :
                                    voice.gender === "female" ? "rgba(236, 72, 153, 0.5)" : "rgba(245, 158, 11, 0.5)"
                            } as React.CSSProperties : undefined}
                        >
                            {/* Selected checkmark */}
                            {isSelected && (
                                <div className="absolute -top-2 -right-2 size-6 rounded-full bg-primary flex items-center justify-center shadow-lg animate-fade-in-scale">
                                    <IconCheck size={14} className="text-primary-foreground" />
                                </div>
                            )}

                            {/* Voice info */}
                            <div className="flex items-center gap-2 mb-3">
                                {getGenderIcon(voice.gender)}
                                <span className="font-medium text-sm">{voice.name}</span>
                            </div>

                            {/* Description */}
                            {voice.description && (
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                                    {voice.description}
                                </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {/* Preview button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handlePreview(voice)
                                    }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-2",
                                        "rounded-lg text-xs font-medium transition-all",
                                        "bg-white/10 hover:bg-white/20",
                                        isPreviewing && "bg-primary/20 text-primary"
                                    )}
                                    aria-label={isPreviewing ? "Stop preview" : "Preview voice"}
                                >
                                    {isPreviewing ? (
                                        <>
                                            <IconPlayerStop size={14} />
                                            <span>Stop</span>
                                        </>
                                    ) : (
                                        <>
                                            <IconPlayerPlay size={14} />
                                            <span>Preview</span>
                                        </>
                                    )}
                                </button>

                                {/* Select button */}
                                <button
                                    onClick={() => handleSelect(voice.id)}
                                    disabled={isSelected}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                                        isSelected
                                            ? "bg-primary text-primary-foreground cursor-default"
                                            : `bg-gradient-to-r ${getGenderColor(voice.gender)} text-white hover:opacity-90`
                                    )}
                                >
                                    {isSelected ? "Selected" : "Pick"}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default VoiceSelector
