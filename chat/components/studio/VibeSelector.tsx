"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconPlus, IconX } from "@tabler/icons-react"
import { StudioPersona } from "@/app/[locale]/studio/types"

interface VibeSelectorProps {
    persona: StudioPersona
    onUpdate: (updates: Partial<StudioPersona>) => void
}

export function VibeSelector({ persona, onUpdate }: VibeSelectorProps) {
    const [inputValue, setInputValue] = useState("")

    // Get vibe keywords from metadata
    const vibeKeywords = (persona.metadata?.vibe_keywords as string[]) ?? []

    const addKeyword = () => {
        const trimmed = inputValue.trim()
        if (!trimmed) return
        if (vibeKeywords.includes(trimmed)) {
            setInputValue("")
            return
        }

        onUpdate({
            metadata: {
                ...persona.metadata,
                vibe_keywords: [...vibeKeywords, trimmed]
            }
        })
        setInputValue("")
    }

    const removeKeyword = (keyword: string) => {
        onUpdate({
            metadata: {
                ...persona.metadata,
                vibe_keywords: vibeKeywords.filter(k => k !== keyword)
            }
        })
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            addKeyword()
        }
    }

    // Predefined suggestions
    const suggestions = [
        "playful", "mysterious", "wise", "energetic", "calm",
        "witty", "serious", "romantic", "adventurous", "supportive",
        "analytical", "creative", "rebellious", "gentle", "bold"
    ]

    const availableSuggestions = suggestions.filter(s => !vibeKeywords.includes(s))

    return (
        <div className="space-y-4">
            {/* Input */}
            <div className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a vibe keyword..."
                    className="border-rp-highlight-med bg-rp-surface text-rp-text"
                />
                <Button
                    onClick={addKeyword}
                    disabled={!inputValue.trim()}
                    size="icon"
                    className="bg-rp-iris hover:bg-rp-iris/90"
                >
                    <IconPlus size={18} />
                </Button>
            </div>

            {/* Current Keywords Cloud */}
            {vibeKeywords.length > 0 && (
                <div className="rounded-lg border border-rp-iris/30 bg-rp-iris/5 p-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-rp-iris">
                        Active Vibes ({vibeKeywords.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {vibeKeywords.map((keyword) => (
                            <div
                                key={keyword}
                                className="group relative flex items-center gap-2 rounded-full border border-rp-iris bg-rp-overlay px-3 py-1.5 transition-all hover:border-rp-rose hover:bg-rp-rose/10"
                            >
                                <span className="text-sm font-medium text-rp-text">
                                    {keyword}
                                </span>
                                <button
                                    onClick={() => removeKeyword(keyword)}
                                    className="flex h-4 w-4 items-center justify-center rounded-full bg-rp-rose/20 text-rp-rose opacity-0 transition-opacity hover:bg-rp-rose hover:text-white group-hover:opacity-100"
                                >
                                    <IconX size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {availableSuggestions.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-rp-subtle">
                        Quick Add
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableSuggestions.slice(0, 10).map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => {
                                    onUpdate({
                                        metadata: {
                                            ...persona.metadata,
                                            vibe_keywords: [...vibeKeywords, suggestion]
                                        }
                                    })
                                }}
                                className="rounded-full border border-rp-muted/30 bg-rp-surface px-3 py-1 text-sm text-rp-subtle transition-all hover:border-rp-iris hover:bg-rp-iris/10 hover:text-rp-iris"
                            >
                                + {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="rounded-lg border border-rp-foam/20 bg-rp-foam/5 p-3">
                <p className="text-xs text-rp-foam">
                    <strong>✨ Vibe Keywords:</strong> These tags subtly influence the AI&apos;s tone and
                    personality. They&apos;re stored in the metadata and can be used by the chat engine
                    to adjust responses dynamically.
                </p>
            </div>
        </div>
    )
}
