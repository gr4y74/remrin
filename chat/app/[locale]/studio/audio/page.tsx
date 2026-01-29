"use client"

import * as React from "react"
import { Play, Square, Save, RotateCcw } from "lucide-react"

import { AudioStudioLayout } from "@/components/studio/AudioStudioLayout"
import { ProviderSelector, ProviderId } from "@/components/studio/ProviderSelector"
import { VoiceConfigurator, VoiceSettings } from "@/components/studio/VoiceConfigurator"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Mock Data
const PERSONAS = [
    { id: "p1", name: "Alice (Default)", avatar: "👩" },
    { id: "p2", name: "Bob the Builder", avatar: "👷" },
    { id: "p3", name: "Charlie", avatar: "🤖" },
]

const MOCK_VOICES: Record<ProviderId, { id: string; name: string; emotions?: string[] }[]> = {
    "edge-tts": [
        { id: "en-US-AriaNeural", name: "Aria (US)" },
        { id: "en-US-GuyNeural", name: "Guy (US)" },
        { id: "en-GB-SoniaNeural", name: "Sonia (UK)" },
    ],
    "kokoro": [
        { id: "k_01", name: "Kokoro A", emotions: ["neutral", "happy", "sad"] },
        { id: "k_02", name: "Kokoro B", emotions: ["neutral", "angry", "whisper"] },
    ],
    "qwen3": [
        { id: "qwen3_female_01", name: "Harmony (Female)" },
        { id: "qwen3_female_03", name: "Sakura (Anime)" },
        { id: "qwen3_male_01", name: "Atlas (Deep)" },
        { id: "qwen3_male_03", name: "Ryu (Anime)" },
    ],
    "elevenlabs": [
        { id: "el_01", name: "Rachel" },
        { id: "el_02", name: "Drew" },
        { id: "el_03", name: "Clyde" },
    ],
}

const DEFAULT_SETTINGS: VoiceSettings = {
    voiceId: "",
    pitch: 0,
    speed: 1.0,
    volume: 100,
    emotion: "neutral",
}

export default function AudioStudioPage() {
    const [selectedPersonaId, setSelectedPersonaId] = React.useState(PERSONAS[0].id)
    const [provider, setProvider] = React.useState<ProviderId>("edge-tts")
    const [settings, setSettings] = React.useState<VoiceSettings>({
        ...DEFAULT_SETTINGS,
        voiceId: MOCK_VOICES["edge-tts"][0].id,
    })
    const [testText, setTestText] = React.useState("Hello! This is a preview of my new voice settings.")
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [isDirty, setIsDirty] = React.useState(false)

    // Reset settings when provider changes (optional strategy)
    const handleProviderChange = (newProvider: ProviderId) => {
        setProvider(newProvider)
        setSettings({
            ...DEFAULT_SETTINGS,
            voiceId: MOCK_VOICES[newProvider][0].id,
        })
        setIsDirty(true)
    }

    const handleSettingsChange = (newSettings: VoiceSettings) => {
        setSettings(newSettings)
        setIsDirty(true)
    }

    const handleTestVoice = async () => {
        if (!testText) return
        setIsPlaying(true)

        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsPlaying(false)
        toast.success("Preview verified (Mock)")
    }

    const handleSave = () => {
        setIsDirty(false)
        toast.success("Voice configuration saved successfully")
    }

    const handleDiscard = () => {
        // Reset logic would go here, possibly refetching from DB
        setIsDirty(false)
        toast.info("Changes discarded")
    }

    const currentAvailableVoices = MOCK_VOICES[provider] || []

    return (
        <AudioStudioLayout isDirty={isDirty} onSave={handleSave} onDiscard={handleDiscard}>
            <div className="flex h-full flex-col md:flex-row">

                {/* Left Sidebar: Persona & Provider */}
                <aside className="w-full md:w-80 border-r bg-card/10 p-4 space-y-6 overflow-y-auto">
                    <div className="space-y-2">
                        <Label>Target Persona</Label>
                        <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERSONAS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <span className="mr-2">{p.avatar}</span>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Audio Provider</Label>
                        <ProviderSelector
                            selectedProvider={provider}
                            onSelect={handleProviderChange}
                            userTier="pro" // Assume pro for demo
                        />
                    </div>

                    <div className="rounded-lg bg-primary/5 p-4 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground mb-1">About {provider === 'edge-tts' ? 'Edge TTS' : provider === 'kokoro' ? 'Kokoro' : provider === 'qwen3' ? 'Qwen3-TTS' : 'ElevenLabs'}</h4>
                        <p>
                            {provider === 'edge-tts' && "Great for free, unlimited generation with standard voices."}
                            {provider === 'kokoro' && "Balanced choice for high quality without high costs."}
                            {provider === 'qwen3' && "Voice cloning from 3-second samples and design voices from text descriptions."}
                            {provider === 'elevenlabs' && "Premium voices with the most realistic intonation."}
                        </p>
                    </div>
                </aside>

                {/* Center: Voice Configuration */}
                <section className="flex-1 p-4 md:p-6 overflow-y-auto bg-background">
                    <div className="mx-auto max-w-2xl h-full">
                        <VoiceConfigurator
                            provider={provider}
                            settings={settings}
                            onChange={handleSettingsChange}
                            onTestVoice={handleTestVoice}
                            availableVoices={currentAvailableVoices}
                            isPlaying={isPlaying}
                        />
                    </div>
                </section>

                {/* Right Sidebar: Preview & Test */}
                <aside className="w-full md:w-80 border-l bg-card/10 p-4 flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                            <CardDescription>Test your settings with custom text.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <Textarea
                                value={testText}
                                onChange={(e) => setTestText(e.target.value)}
                                placeholder="Type something to speak..."
                                className="flex-1 resize-none min-h-[150px]"
                            />

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{testText.length} chars</span>
                                <Badge variant="outline">
                                    {provider === 'elevenlabs' ? '$$ Premium' : 'Free'}
                                </Badge>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full gap-2"
                                onClick={handleTestVoice}
                                disabled={!testText || isPlaying}
                            >
                                {isPlaying ? (
                                    <>
                                        <Square className="h-4 w-4 fill-current" />
                                        Stop
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 fill-current" />
                                        Generate Preview
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Audio Visualizer Placeholder */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Output Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-24 bg-muted/50 rounded-md flex items-center justify-center relative overflow-hidden">
                                {isPlaying ? (
                                    <div className="flex items-center justify-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-primary animate-bounce"
                                                style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Ready to generate</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </aside>

            </div>
        </AudioStudioLayout>
    )
}
