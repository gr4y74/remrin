"use client"

import * as React from "react"
import { RotateCcw, Volume2, PlayCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ProviderId } from "./ProviderSelector"

export interface VoiceSettings {
    voiceId: string
    pitch: number // -50 to 50
    speed: number // 0.5 to 2.0
    volume: number // 0 to 100
    emotion?: string
}

interface VoiceConfiguratorProps {
    provider: ProviderId
    settings: VoiceSettings
    onChange: (settings: VoiceSettings) => void
    onTestVoice: (text: string) => void
    availableVoices: { id: string; name: string; emotions?: string[] }[]
    isPlaying?: boolean
}

const PRESETS = [
    { name: "Default", pitch: 0, speed: 1.0, volume: 100 },
    { name: "Excited", pitch: 10, speed: 1.1, volume: 100 },
    { name: "Calm", pitch: -5, speed: 0.9, volume: 90 },
    { name: "Deep", pitch: -20, speed: 0.95, volume: 100 },
]

export function VoiceConfigurator({
    provider,
    settings,
    onChange,
    onTestVoice,
    availableVoices,
    isPlaying = false,
}: VoiceConfiguratorProps) {
    const [testText, setTestText] = React.useState("Hello, this is a test of my voice.")

    const handleSettingChange = (key: keyof VoiceSettings, value: number | string) => {
        onChange({ ...settings, [key]: value })
    }

    const applyPreset = (preset: typeof PRESETS[0]) => {
        onChange({
            ...settings,
            pitch: preset.pitch,
            speed: preset.speed,
            volume: preset.volume,
        })
    }

    const currentVoice = availableVoices.find(v => v.id === settings.voiceId)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Voice Configuration</CardTitle>
                <CardDescription>
                    Fine-tune the voice characteristics. Settings vary by provider.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Voice Selection */}
                <div className="space-y-2">
                    <Label>Voice Model</Label>
                    <Select
                        value={settings.voiceId}
                        onValueChange={(val) => handleSettingChange("voiceId", val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableVoices.map((voice) => (
                                <SelectItem key={voice.id} value={voice.id}>
                                    {voice.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Emotion Selection (if available) */
                    currentVoice?.emotions && currentVoice.emotions.length > 0 && (
                        <div className="space-y-2">
                            <Label>Emotion / Style</Label>
                            <Select
                                value={settings.emotion || "neutral"}
                                onValueChange={(val) => handleSettingChange("emotion", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select emotion" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currentVoice.emotions.map((emotion) => (
                                        <SelectItem key={emotion} value={emotion}>
                                            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                <div className="grid gap-6">
                    {/* Pitch Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Pitch</Label>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                                {settings.pitch > 0 ? "+" : ""}{settings.pitch}%
                            </span>
                        </div>
                        <Slider
                            value={[settings.pitch]}
                            min={-50}
                            max={50}
                            step={1}
                            onValueChange={([val]) => handleSettingChange("pitch", val)}
                        />
                    </div>

                    {/* Speed Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Speed</Label>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                                {settings.speed}x
                            </span>
                        </div>
                        <Slider
                            value={[settings.speed]}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            onValueChange={([val]) => handleSettingChange("speed", val)}
                        />
                    </div>

                    {/* Volume Control */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Volume</Label>
                            <span className="text-xs text-muted-foreground w-8 text-right">
                                {settings.volume}%
                            </span>
                        </div>
                        <Slider
                            value={[settings.volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([val]) => handleSettingChange("volume", val)}
                        />
                    </div>
                </div>

                {/* Presets */}
                <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground">Presets</Label>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((preset) => (
                            <Button
                                key={preset.name}
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset(preset)}
                                className="h-7 text-xs"
                            >
                                {preset.name}
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyPreset(PRESETS[0])}
                            className="h-7 text-xs ml-auto"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
