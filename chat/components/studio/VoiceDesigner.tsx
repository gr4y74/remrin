"use client"

import * as React from "react"
import { Wand2, Loader2, Play, Pause, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface VoiceDesignerProps {
    onSuccess?: (voiceId: string, voiceName: string) => void
}

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
]

const EXAMPLE_PROMPTS = [
    {
        label: "Anime girl",
        prompt: "A warm, playful anime girl voice with slight Japanese accent. She speaks with enthusiasm and curiosity.",
        gender: "female" as const,
    },
    {
        label: "Mysterious villain",
        prompt: "Deep, mysterious male voice with a slight echo. Speaks slowly and deliberately, like a calculating villain.",
        gender: "male" as const,
    },
    {
        label: "Gentle narrator",
        prompt: "A gentle, soothing female narrator voice. Warm and melodic, perfect for storytelling and bedtime tales.",
        gender: "female" as const,
    },
    {
        label: "Energetic boy",
        prompt: "Energetic young boy voice, enthusiastic and curious. Full of wonder and excitement about everything.",
        gender: "male" as const,
    },
]

export function VoiceDesigner({ onSuccess }: VoiceDesignerProps) {
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [language, setLanguage] = React.useState("en")
    const [gender, setGender] = React.useState<"male" | "female">("female")

    const [loading, setLoading] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [generatedVoiceId, setGeneratedVoiceId] = React.useState<string | null>(null)

    const audioRef = React.useRef<HTMLAudioElement | null>(null)

    const handleExampleClick = (example: typeof EXAMPLE_PROMPTS[0]) => {
        setDescription(example.prompt)
        setGender(example.gender)
    }

    const handleDesign = async () => {
        if (!name.trim()) {
            toast.error("Please enter a voice name")
            return
        }
        if (!description.trim() || description.length < 10) {
            toast.error("Please provide a detailed voice description (at least 10 characters)")
            return
        }

        setLoading(true)
        setProgress(10)

        try {
            // Simulate progress while generating
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 80))
            }, 500)

            const response = await fetch("/api/audio/qwen3/design", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description,
                    language,
                    gender,
                }),
            })

            clearInterval(interval)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to design voice")
            }

            const data = await response.json()
            setProgress(100)
            setGeneratedVoiceId(data.voice_id)
            setPreviewUrl(data.preview_url)

            toast.success("Voice designed successfully!", {
                description: "Click 'Use This Voice' to assign it to your character.",
            })

        } catch (err) {
            console.error(err)
            toast.error(err instanceof Error ? err.message : "Failed to design voice")
        } finally {
            setLoading(false)
        }
    }

    const handlePlayPreview = () => {
        if (!previewUrl) return

        if (!audioRef.current) {
            audioRef.current = new Audio(previewUrl)
            audioRef.current.onended = () => setIsPlaying(false)
        }

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    const handleUseVoice = () => {
        if (generatedVoiceId && name) {
            onSuccess?.(generatedVoiceId, name)
            toast.success("Voice assigned!", {
                description: `${name} is now the voice for your character.`,
            })

            // Reset form
            setName("")
            setDescription("")
            setPreviewUrl(null)
            setGeneratedVoiceId(null)
            setProgress(0)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-cyan-400" />
                    Design a Voice
                </CardTitle>
                <CardDescription>
                    Describe the voice you want in natural language. Powered by Qwen3-TTS.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Example Prompts */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quick examples:</Label>
                    <div className="flex flex-wrap gap-2">
                        {EXAMPLE_PROMPTS.map((example) => (
                            <button
                                key={example.label}
                                type="button"
                                onClick={() => handleExampleClick(example)}
                                className="rounded-full border border-muted-foreground/30 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-cyan-400 hover:text-cyan-400"
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Voice Name */}
                <div className="space-y-2">
                    <Label htmlFor="voice-name">Voice Name</Label>
                    <Input
                        id="voice-name"
                        placeholder="e.g. Sakura, Dark Lord, Narrator"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* Voice Description */}
                <div className="space-y-2">
                    <Label htmlFor="voice-description">Describe the Voice</Label>
                    <Textarea
                        id="voice-description"
                        placeholder="e.g. A warm, playful anime girl voice with slight Japanese accent. She speaks with enthusiasm and curiosity, like an energetic protagonist."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                        Be specific about tone, age, accent, emotion, and speaking style. ({description.length}/500)
                    </p>
                </div>

                {/* Language & Gender */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={language} onValueChange={setLanguage} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female")} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="male">Male</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Progress */}
                {loading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Designing voice...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Preview Section */}
                {previewUrl && !loading && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Preview: &ldquo;{name}&rdquo;</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePlayPreview}
                            >
                                {isPlaying ? (
                                    <><Pause className="mr-2 h-4 w-4" /> Pause</>
                                ) : (
                                    <><Play className="mr-2 h-4 w-4" /> Play Sample</>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            &ldquo;Hello! This is a preview of how this voice sounds. Nice to meet you!&rdquo;
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        className="flex-1"
                        onClick={handleDesign}
                        disabled={loading || !name.trim() || description.length < 10}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Designing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {generatedVoiceId ? "Regenerate Voice" : "Generate Voice"}
                            </>
                        )}
                    </Button>

                    {generatedVoiceId && (
                        <Button
                            onClick={handleUseVoice}
                            variant="default"
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-500"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Use This Voice
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
