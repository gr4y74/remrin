"use client"

import { useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { StudioPersona, PersonaMetadata } from "../types"
import { IconMicrophone, IconUpload, IconLoader2 } from "@tabler/icons-react"

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

    const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await uploadFile(file, 'soul_audio', 'samples')
        if (url) {
            updateMetadata('voice_sample_url', url)
        }
    }, [uploadFile, updateMetadata])

    return (
        <div className="space-y-6">
            {/* Voice Sample Upload */}
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
            </div>

            {/* Voice ID */}
            <div className="space-y-2">
                <Label htmlFor="voice_id">Voice ID (ElevenLabs / OpenAI)</Label>
                <Input
                    id="voice_id"
                    value={persona.voice_id || ''}
                    onChange={(e) => updateField('voice_id', e.target.value)}
                    placeholder="e.g., ThT5KcBeYtu3NO4 or alloy"
                    className="border-rp-highlight-med bg-rp-surface font-mono"
                />
                <p className="text-xs text-rp-muted">
                    The voice synthesis ID for text-to-speech. Leave blank to use default.
                </p>
            </div>

            {/* Voice Presets */}
            <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                    {[
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
                    ))}
                </div>
            </div>
        </div>
    )
}
