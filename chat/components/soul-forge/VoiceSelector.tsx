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
                return <IconGenderMale size={18} className="text-rp-pine" />
            case "female":
                return <IconGenderFemale size={18} className="text-rp-rose" />
            default:
                return <span className="text-rp-gold text-sm">◆</span>
        }
    }

    const getGenderColor = (gender: VoiceConfig["gender"]) => {
        switch (gender) {
            case "male":
                return "from-rp-pine to-rp-foam"
            case "female":
                return "from-rp-rose to-rp-love"
            default:
                return "from-rp-gold to-rp-rose"
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
                <h3 className="text-sm font-semibold text-rp-iris uppercase tracking-wider">
                    Select Voice Frequency
                </h3>
                <p className="text-xs text-rp-muted mt-1">
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
                                "bg-rp-surface border border-rp-muted/20",
                                "hover:bg-rp-overlay hover:scale-[1.02] hover:shadow-lg",
                                isSelected && [
                                    "ring-2 ring-offset-2 ring-offset-rp-base",
                                    `bg-gradient-to-br ${getGenderColor(voice.gender)} bg-opacity-10`,
                                    "border-transparent animate-pulse-glow"
                                ]
                            )}
                            style={isSelected ? {
                                "--glow-color": voice.gender === "male" ? "rgba(49, 116, 143, 0.5)" :
                                    voice.gender === "female" ? "rgba(235, 188, 186, 0.5)" : "rgba(246, 193, 119, 0.5)"
                            } as React.CSSProperties : undefined}
                        >
                            {/* Selected checkmark */}
                            {isSelected && (
                                <div className="absolute -top-2 -right-2 size-6 rounded-full bg-rp-iris flex items-center justify-center shadow-lg animate-fade-in-scale">
                                    <IconCheck size={14} className="text-rp-base" />
                                </div>
                            )}

                            {/* Voice info */}
                            <div className="flex items-center gap-2 mb-3">
                                {getGenderIcon(voice.gender)}
                                <span className="font-medium text-sm text-rp-text">{voice.name}</span>
                            </div>

                            {/* Description */}
                            {voice.description && (
                                <p className="text-xs text-rp-muted mb-3 line-clamp-1">
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
                                        "bg-rp-base hover:bg-rp-base/80",
                                        isPreviewing && "bg-rp-iris text-rp-base"
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
                                            ? "bg-rp-iris text-rp-base cursor-default"
                                            : `bg-gradient-to-r ${getGenderColor(voice.gender)} text-rp-base hover:opacity-90`
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
