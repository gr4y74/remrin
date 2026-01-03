"use client"

import { useState } from "react"
import { IconHash, IconX, IconSparkles, IconPlus } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface HashtagEditorProps {
    hashtags: string[]
    onChange: (hashtags: string[]) => void
    onGenerateSuggestions?: () => Promise<string[]>
    maxHashtags?: number
    className?: string
}

const POPULAR_HASHTAGS = [
    // Personality
    "funny", "serious", "playful", "wise", "sarcastic", "wholesome", "mysterious",
    "tsundere", "yandere", "kuudere", "dandere",
    // Roles
    "helper", "teacher", "mentor", "companion", "therapist", "coach", "advisor", "friend",
    // Genres
    "anime", "fantasy", "scifi", "historical", "romance", "adventure", "horror", "comedy",
    // Content
    "roleplay", "storytelling", "educational", "creative", "productivity", "wellness",
    // Demographics
    "kids", "teen", "adult", "family-friendly",
    // Special
    "voice-enabled", "multilingual", "premium", "legendary", "epic", "rare"
]

export function HashtagEditor({
    hashtags,
    onChange,
    onGenerateSuggestions,
    maxHashtags = 20,
    className
}: HashtagEditorProps) {
    const [inputValue, setInputValue] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Filter popular hashtags based on input and exclude already added ones
    const suggestions = POPULAR_HASHTAGS.filter(tag =>
        !hashtags.includes(tag) &&
        tag.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 10)

    const addHashtag = (tag: string) => {
        const cleanTag = tag.toLowerCase().trim().replace(/^#/, "")

        // Validation
        if (!cleanTag) return
        if (hashtags.includes(cleanTag)) return
        if (hashtags.length >= maxHashtags) return
        if (!/^[a-z0-9-]+$/.test(cleanTag)) {
            alert("Hashtags can only contain lowercase letters, numbers, and hyphens")
            return
        }
        if (cleanTag.length < 2 || cleanTag.length > 30) {
            alert("Hashtags must be between 2 and 30 characters")
            return
        }

        onChange([...hashtags, cleanTag])
        setInputValue("")
        setShowSuggestions(false)
    }

    const removeHashtag = (tag: string) => {
        onChange(hashtags.filter(t => t !== tag))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()
            addHashtag(inputValue)
        } else if (e.key === "Backspace" && !inputValue && hashtags.length > 0) {
            // Remove last hashtag on backspace if input is empty
            removeHashtag(hashtags[hashtags.length - 1])
        }
    }

    const handleGenerateSuggestions = async () => {
        if (!onGenerateSuggestions) return

        setIsGenerating(true)
        try {
            const suggested = await onGenerateSuggestions()
            // Add suggested tags that aren't already added
            const newTags = suggested.filter(tag => !hashtags.includes(tag))
            onChange([...hashtags, ...newTags.slice(0, maxHashtags - hashtags.length)])
        } catch (error) {
            console.error("Failed to generate suggestions:", error)
            alert("Failed to generate suggestions. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-medium text-rp-text">
                        Hashtags
                    </label>
                    <p className="text-xs text-rp-muted">
                        Add up to {maxHashtags} hashtags ({hashtags.length}/{maxHashtags})
                    </p>
                </div>

                {onGenerateSuggestions && (
                    <button
                        onClick={handleGenerateSuggestions}
                        disabled={isGenerating || hashtags.length >= maxHashtags}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconSparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? "Generating..." : "AI Suggestions"}
                    </button>
                )}
            </div>

            {/* Current Hashtags */}
            <div className="flex min-h-[60px] flex-wrap gap-2 rounded-lg border border-rp-highlight-med bg-rp-surface p-3">
                {hashtags.map(tag => (
                    <div
                        key={tag}
                        className="group flex items-center gap-1 rounded-full border border-rp-highlight-med bg-rp-base px-3 py-1.5 text-sm transition-colors hover:border-rp-rose"
                    >
                        <IconHash size={14} className="text-rp-iris" />
                        <span className="text-rp-text">{tag}</span>
                        <button
                            onClick={() => removeHashtag(tag)}
                            className="ml-1 text-rp-muted opacity-0 transition-opacity hover:text-rp-rose group-hover:opacity-100"
                            aria-label={`Remove ${tag}`}
                        >
                            <IconX size={14} />
                        </button>
                    </div>
                ))}

                {hashtags.length === 0 && (
                    <p className="text-sm text-rp-muted">No hashtags yet. Add some below!</p>
                )}
            </div>

            {/* Input */}
            <div className="relative">
                <div className="relative">
                    <IconHash
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted"
                    />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value)
                            setShowSuggestions(e.target.value.length > 0)
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(inputValue.length > 0)}
                        placeholder="Type a hashtag and press Enter..."
                        disabled={hashtags.length >= maxHashtags}
                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-surface px-10 py-2.5 text-sm text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={() => addHashtag(inputValue)}
                        disabled={!inputValue.trim() || hashtags.length >= maxHashtags}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-rp-iris px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-rp-iris/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IconPlus size={14} />
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full z-10 mt-2 w-full rounded-lg border border-rp-highlight-med bg-rp-surface shadow-xl">
                        <div className="p-2">
                            <p className="px-2 py-1 text-xs font-medium text-rp-muted">Popular hashtags</p>
                            <div className="max-h-48 overflow-y-auto">
                                {suggestions.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => addHashtag(tag)}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-rp-base"
                                    >
                                        <IconHash size={14} className="text-rp-iris" />
                                        <span className="text-sm text-rp-text">{tag}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-rp-muted">
                💡 Tip: Use lowercase letters, numbers, and hyphens only. Press Enter to add.
            </p>
        </div>
    )
}
