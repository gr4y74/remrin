"use client"

import * as React from "react"
import { Upload, Mic, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AudioRecorder } from "./AudioRecorder"
import { AudioWaveform } from "./AudioWaveform"

interface VoiceClonerProps {
    onSuccess?: (voiceId: string) => void
}

export function VoiceCloner({ onSuccess }: VoiceClonerProps) {
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("record")

    // File upload state
    const [uploadFile, setUploadFile] = React.useState<File | null>(null)
    const [uploadUrl, setUploadUrl] = React.useState<string | null>(null)

    // Recording state
    const [recordingBlob, setRecordingBlob] = React.useState<Blob | null>(null)

    // Process state
    const [loading, setLoading] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        return () => {
            if (uploadUrl) URL.revokeObjectURL(uploadUrl)
        }
    }, [uploadUrl])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validation
            if (file.size > 10 * 1024 * 1024) { // 10MB
                toast.error("File is too large (max 10MB)")
                return
            }
            if (!file.type.startsWith("audio/")) {
                toast.error("Please upload an audio file")
                return
            }

            setUploadFile(file)
            setUploadUrl(URL.createObjectURL(file))
        }
    }

    const handleClone = async () => {
        const audioSource = activeTab === "record" ? recordingBlob : uploadFile

        if (!name.trim()) {
            toast.error("Please enter a voice name")
            return
        }
        if (!audioSource) {
            toast.error("Please provide audio input")
            return
        }

        setLoading(true)
        setError(null)
        setProgress(10)

        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("description", description)
            formData.append("file", audioSource)

            // Simulate progress while uploading
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90))
            }, 500)

            const response = await fetch("/api/audio/clone", {
                method: "POST",
                body: formData
            })

            clearInterval(interval)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to clone voice")
            }

            const data = await response.json()

            setProgress(100)
            toast.success("Voice successfully cloned!")
            onSuccess?.(data.voice_id)

            // Reset form
            setName("")
            setDescription("")
            setUploadFile(null)
            setUploadUrl(null)
            setRecordingBlob(null)

        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Something went wrong")
            toast.error("Failed to clone voice")
        } finally {
            setLoading(false)
        }
    }

    const isReadyToClone = name.trim().length > 0 && (
        (activeTab === "record" && recordingBlob) ||
        (activeTab === "upload" && uploadFile)
    )

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Create New Voice
                </CardTitle>
                <CardDescription>
                    Clone a voice by uploading a sample or recording directly.
                    Best results with 30-60 seconds of clear speech.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="voice-name">Voice Name</Label>
                        <Input
                            id="voice-name"
                            placeholder="e.g. My Custom Narrator"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="e.g. A warm, professional voice suitable for news."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="record" disabled={loading}>
                            <Mic className="mr-2 h-4 w-4" />
                            Record Audio
                        </TabsTrigger>
                        <TabsTrigger value="upload" disabled={loading}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload File
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="record" className="mt-4">
                        <AudioRecorder
                            onRecordingComplete={setRecordingBlob}
                            maxDuration={120}
                        />
                    </TabsContent>

                    <TabsContent value="upload" className="mt-4 space-y-4">
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 hover:bg-muted/50 transition-colors">
                            <Input
                                id="audio-upload"
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={loading}
                            />
                            <Label
                                htmlFor="audio-upload"
                                className="flex flex-col items-center cursor-pointer"
                            >
                                <div className="rounded-full bg-primary/10 p-4 mb-4">
                                    <Upload className="h-8 w-8 text-primary" />
                                </div>
                                <span className="font-medium">Click to upload audio</span>
                                <span className="text-sm text-muted-foreground mt-1">
                                    MP3, WAV, OGG (Max 10MB)
                                </span>
                            </Label>
                        </div>

                        {uploadUrl && (
                            <div className="rounded-lg border bg-card p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium truncate max-w-[200px]">
                                        {uploadFile?.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-destructive"
                                        onClick={() => {
                                            setUploadFile(null)
                                            setUploadUrl(null)
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <AudioWaveform url={uploadUrl} height={60} />
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {loading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Processing voice clone...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Button
                    className="w-full"
                    onClick={handleClone}
                    disabled={!isReadyToClone || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cloning Voice...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Clone Voice
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
