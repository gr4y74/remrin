"use client"

import { useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { StudioPersona, BASE_MODELS, SAFETY_LEVELS } from "../types"
import { IconUpload, IconPhoto } from "@tabler/icons-react"
import Image from "next/image"

interface IdentityTabProps {
    persona: StudioPersona
    updateField: <K extends keyof StudioPersona>(field: K, value: StudioPersona[K]) => void
    uploadFile: (file: File, bucket: string, folder: string) => Promise<string | null>
}

export function IdentityTab({ persona, updateField, uploadFile }: IdentityTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await uploadFile(file, 'soul_forge', 'avatars')
        if (url) {
            updateField('image_url', url)
        }
    }, [uploadFile, updateField])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        const url = await uploadFile(file, 'soul_forge', 'avatars')
        if (url) {
            updateField('image_url', url)
        }
    }, [uploadFile, updateField])

    return (
        <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
                <Label>Avatar Image</Label>
                <div
                    className="relative flex size-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors hover:border-purple-500"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {persona.image_url ? (
                        <Image
                            src={persona.image_url}
                            alt="Avatar"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                            <IconPhoto size={40} />
                            <span className="text-sm">Drop image or click</span>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                    />
                </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    value={persona.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Soul Name"
                    className="border-zinc-700 bg-zinc-900"
                />
            </div>

            {/* Tagline */}
            <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                    id="tagline"
                    value={persona.tagline || ''}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="A short memorable phrase..."
                    className="border-zinc-700 bg-zinc-900"
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={persona.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Detailed description of this Soul's personality, backstory, and purpose..."
                    className="min-h-[120px] border-zinc-700 bg-zinc-900"
                />
            </div>

            {/* Base Model */}
            <div className="space-y-2">
                <Label>Base AI Model</Label>
                <Select
                    value={persona.base_model || 'deepseek-chat'}
                    onValueChange={(value) => updateField('base_model', value)}
                >
                    <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select model..." />
                    </SelectTrigger>
                    <SelectContent>
                        {BASE_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                                {model.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Safety Level */}
            <div className="space-y-2">
                <Label>Safety Level</Label>
                <Select
                    value={persona.safety_level || 'ADULT'}
                    onValueChange={(value) => updateField('safety_level', value as StudioPersona['safety_level'])}
                >
                    <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select safety level..." />
                    </SelectTrigger>
                    <SelectContent>
                        {SAFETY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
