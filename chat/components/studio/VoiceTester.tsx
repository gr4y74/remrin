"use client"

import * as React from "react"
import { Wand2, Download, Share2, Loader2, RefreshCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AudioWaveform } from "./AudioWaveform"
import { VoiceSettings } from "./VoiceConfigurator"
import { useAudioGeneration } from "@/hooks/useAudioGeneration"

interface VoiceTesterProps {
    voiceId: string
    settings: VoiceSettings
    characterName?: string
}

const PRESET_PHRASES = [
    "Hello! I'm {name}. How can I help you today?",
    "That's an interesting question. Let me think about that.",
    "I'm excited to chat with you! We have so much to discuss.",
    "The quick brown fox jumps over the lazy dog.",
    "In the depths of winter, I finally learned that within me there lay an invincible summer."
]

export function VoiceTester({ voiceId, settings, characterName = "Assistant" }: VoiceTesterProps) {
    const [text, setText] = React.useState(PRESET_PHRASES[0].replace("{name}", characterName))
    const [customMode, setCustomMode] = React.useState(false)
    const { generate, cancel, loading, progress, audioUrl, error } = useAudioGeneration()

    const handleGenerate = async () => {
        if (!text.trim()) return

        await generate(text, {
            voiceId,
            ...settings
        })
    }

    const handleDownload = () => {
        if (!audioUrl) return
        const a = document.createElement("a")
        a.href = audioUrl
        a.download = `voice-test-${voiceId}-${Date.now()}.wav`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success("Download started")
    }

    const handleShare = async () => {
        if (!audioUrl) return

        // In a real app, this would upload the blob and get a shareable link
        // For now, we'll just pretend
        try {
            const response = await fetch(audioUrl)
            const blob = await response.blob()
            const file = new File([blob], "voice-sample.wav", { type: "audio/wav" })

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Voice Sample',
                    text: `Check out this voice sample for ${characterName}`,
                    files: [file]
                })
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText("Voice sharing is not implemented in this demo.")
                toast.info("Sharing not supported on this device")
            }
        } catch (err) {
            console.error(err)
            toast.error("Failed to share")
        }
    }

    const handlePresetChange = (value: string) => {
        if (value === "custom") {
            setCustomMode(true)
            setText("")
        } else {
            setCustomMode(false)
            setText(value.replace("{name}", characterName))
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="flex items-center justify-between">
                    <Label>Test Phrase</Label>
                    {!customMode && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setCustomMode(true)
                                setText("")
                            }}
                            className="h-6 text-xs"
                        >
                            Switch to Custom Text
                        </Button>
                    )}
                </div>

                {!customMode ? (
                    <Select value={text} onValueChange={handlePresetChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a phrase" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRESET_PHRASES.map((phrase, i) => (
                                <SelectItem key={i} value={phrase.replace("{name}", characterName)}>
                                    {phrase.replace("{name}", characterName).substring(0, 50)}...
                                </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Text...</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="relative">
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type something to test the voice..."
                            maxLength={500}
                            className="min-h-[100px] resize-none pr-12"
                        />
                        <div className="absolute  bottom-2 right-2 text-xs text-muted-foreground">
                            {text.length}/500
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setCustomMode(false)
                                setText(PRESET_PHRASES[0].replace("{name}", characterName))
                            }}
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                        >
                            <RefreshCcw className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="rounded-lg border border-dashed p-8">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="relative">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                                {progress}%
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Generating audio preview...</p>
                        <Button variant="outline" size="sm" onClick={cancel}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <AudioWaveform url={audioUrl} />
            )}

            <div className="flex items-center gap-2">
                <Button
                    onClick={handleGenerate}
                    disabled={loading || !text.trim()}
                    className="flex-1"
                >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Preview
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                    disabled={!audioUrl}
                    title="Download Audio"
                >
                    <Download className="h-4 w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    disabled={!audioUrl}
                    title="Share Audio"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>

            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}
        </div>
    )
}
