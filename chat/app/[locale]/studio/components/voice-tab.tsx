"use client"

import { useCallback, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudioPersona, PersonaMetadata } from "../types"
import { IconMicrophone, IconUpload, IconLoader2, IconWand, IconMusic } from "@tabler/icons-react"
import { VoiceCloner } from "@/components/studio/VoiceCloner"
import { VoiceDesigner } from "@/components/studio/VoiceDesigner"
import { ProviderSelector, ProviderId } from "@/components/studio/ProviderSelector"

interface VoiceTabProps {
    persona: StudioPersona
    metadata: PersonaMetadata
    updateField: <K extends keyof StudioPersona>(field: K, value: StudioPersona[K]) => void
    updateMetadata: <K extends keyof PersonaMetadata>(field: K, value: PersonaMetadata[K]) => void
    uploadFile: (file: File, bucket: string, folder: string) => Promise<string | null>
    uploading: boolean
}

export function VoiceTab({ persona, metadata, updateField, updateMetadata, uploadFile, uploading }: VoiceTabProps) {
    const audioInputRef = useRef<HTMLInputElement>(null)
    const [selectedProvider, setSelectedProvider] = useState<ProviderId>("qwen3")

    const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await uploadFile(file, 'soul_audio', 'samples')
        if (url) {
            updateMetadata('voice_sample_url', url)
        }
    }, [uploadFile, updateMetadata])

    const handleVoiceSelect = (voiceId: string, voiceName?: string) => {
        updateField('voice_id', voiceId)
        if (voiceName) {
            updateMetadata('voice_name' as any, voiceName)
        }
    }

    return (
        <div className="space-y-6">
            {/* Voice Configuration Tabs */}
            <Tabs defaultValue="select" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="select" className="flex items-center gap-2">
                        <IconMusic size={16} />
                        Select Voice
                    </TabsTrigger>
                    <TabsTrigger value="clone" className="flex items-center gap-2">
                        <IconMicrophone size={16} />
                        Clone Voice
                    </TabsTrigger>
                    <TabsTrigger value="design" className="flex items-center gap-2">
                        <IconWand size={16} />
                        Design Voice
                    </TabsTrigger>
                </TabsList>

                {/* Select Voice Tab */}
                <TabsContent value="select" className="mt-4 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <Label>TTS Provider</Label>
                        <ProviderSelector
                            selectedProvider={selectedProvider}
                            onSelect={setSelectedProvider}
                            userTier="free"
                        />
                    </div>

                    {/* Voice ID */}
                    <div className="space-y-2">
                        <Label htmlFor="voice_id">Voice ID</Label>
                        <Input
                            id="voice_id"
                            value={persona.voice_id || ''}
                            onChange={(e) => updateField('voice_id', e.target.value)}
                            placeholder={
                                selectedProvider === 'qwen3'
                                    ? "e.g., qwen3_female_01 or a cloned/designed voice ID"
                                    : selectedProvider === 'elevenlabs'
                                        ? "e.g., ThT5KcBeYtu3NO4"
                                        : "e.g., alloy or nova"
                            }
                            className="border-rp-highlight-med bg-rp-surface font-mono"
                        />
                        <p className="text-xs text-rp-muted">
                            {selectedProvider === 'qwen3'
                                ? "Qwen3-TTS supports 10 languages with ultra-low latency. Use Clone or Design tabs for custom voices."
                                : selectedProvider === 'elevenlabs'
                                    ? "ElevenLabs voice ID for ultra-realistic synthesis."
                                    : "The voice synthesis ID for text-to-speech."
                            }
                        </p>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-2">
                        <Label>Quick Presets</Label>
                        <div className="flex flex-wrap gap-2">
                            {selectedProvider === 'qwen3' ? (
                                // Qwen3 presets
                                [
                                    { id: 'qwen3_female_01', name: 'Harmony (Female)' },
                                    { id: 'qwen3_female_02', name: 'Luna (Soft)' },
                                    { id: 'qwen3_female_03', name: 'Sakura (Anime)' },
                                    { id: 'qwen3_male_01', name: 'Atlas (Deep)' },
                                    { id: 'qwen3_male_02', name: 'Echo (Narrator)' },
                                    { id: 'qwen3_male_03', name: 'Ryu (Anime)' },
                                ].map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => updateField('voice_id', preset.id)}
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${persona.voice_id === preset.id
                                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                                            : 'border-rp-highlight-med bg-rp-surface text-rp-subtle hover:border-rp-muted'
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))
                            ) : (
                                // OpenAI/other presets
                                [
                                    { id: 'alloy', name: 'Alloy (Neutral)' },
                                    { id: 'echo', name: 'Echo (Male)' },
                                    { id: 'fable', name: 'Fable (Expressive)' },
                                    { id: 'nova', name: 'Nova (Female)' },
                                    { id: 'shimmer', name: 'Shimmer (Soft)' }
                                ].map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => updateField('voice_id', preset.id)}
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${persona.voice_id === preset.id
                                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                                            : 'border-rp-highlight-med bg-rp-surface text-rp-subtle hover:border-rp-muted'
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Clone Voice Tab */}
                <TabsContent value="clone" className="mt-4">
                    <VoiceCloner
                        onSuccess={(voiceId) => handleVoiceSelect(voiceId)}
                    />
                </TabsContent>

                {/* Design Voice Tab (Qwen3 unique feature!) */}
                <TabsContent value="design" className="mt-4">
                    <VoiceDesigner
                        onSuccess={(voiceId, voiceName) => handleVoiceSelect(voiceId, voiceName)}
                    />
                </TabsContent>
            </Tabs>

            {/* Voice Sample Upload (for preview) */}
            <div className="space-y-2">
                <Label>Voice Sample (for preview)</Label>
                <div
                    className={`relative flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-surface/50 transition-colors ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:border-rp-love'
                        }`}
                    onClick={() => !uploading && audioInputRef.current?.click()}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-rp-iris">
                            <IconLoader2 size={32} className="animate-spin" />
                            <span className="text-sm">Uploading audio...</span>
                        </div>
                    ) : metadata.voice_sample_url ? (
                        <div className="flex items-center gap-4 px-4">
                            <IconMicrophone size={24} className="text-orange-400" />
                            <audio controls className="h-10">
                                <source src={metadata.voice_sample_url} />
                            </audio>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-rp-muted">
                            <IconUpload size={24} />
                            <span className="text-sm">Upload audio sample (mp3/wav)</span>
                        </div>
                    )}
                    <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/mp3,audio/wav,audio/mpeg"
                        className="hidden"
                        onChange={handleAudioUpload}
                        disabled={uploading}
                    />
                </div>
                <p className="text-xs text-rp-muted">
                    Optional: Upload a sample to preview how your character sounds before publishing.
                </p>
            </div>

            {/* Current Voice Status */}
            {persona.voice_id && (
                <div className="rounded-lg bg-rp-overlay/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500">
                            <IconMicrophone size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-rp-text">Current Voice</p>
                            <p className="font-mono text-xs text-rp-subtle">{persona.voice_id}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
