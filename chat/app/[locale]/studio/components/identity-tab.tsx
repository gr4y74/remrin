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
import { IconUpload, IconPhoto, IconLoader2 } from "@tabler/icons-react"
import Image from "next/image"
import { InfoTooltip, TooltipTitle, TooltipBody, TooltipExample } from "@/components/ui/info-tooltip"

interface IdentityTabProps {
    persona: StudioPersona
    updateField: <K extends keyof StudioPersona>(field: K, value: StudioPersona[K]) => void
    uploadFile: (file: File, bucket: string, folder: string) => Promise<string | null>
    uploading: boolean
}

export function IdentityTab({ persona, updateField, uploadFile, uploading }: IdentityTabProps) {
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
        if (uploading) return

        const file = e.dataTransfer.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        const url = await uploadFile(file, 'soul_forge', 'avatars')
        if (url) {
            updateField('image_url', url)
        }
    }, [uploadFile, updateField, uploading])

    return (
        <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
                <Label>Avatar Image</Label>
                <div
                    className={`relative flex size-48 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-surface/50 transition-colors ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:border-rp-iris'
                        }`}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2 text-rp-iris">
                            <IconLoader2 size={40} className="animate-spin" />
                            <span className="text-sm">Uploading...</span>
                        </div>
                    ) : persona.image_url ? (
                        <Image
                            src={persona.image_url}
                            alt="Avatar"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-rp-muted">
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
                        disabled={uploading}
                    />
                </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                    Name *
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>👤 Your Soul&apos;s Identity</TooltipTitle>
                                <TooltipBody>
                                    This is the name users will see and use to talk to your character.
                                    Make it memorable and fitting for the personality!
                                </TooltipBody>
                                <TooltipExample>
                                    Good names: "Luna", "Captain Rex", "Wise Owl" — avoid generic names like "AI Assistant"
                                </TooltipExample>
                            </div>
                        }
                    />
                </Label>
                <Input
                    id="name"
                    value={persona.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Soul Name"
                    className="border-rp-highlight-med bg-rp-surface"
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
                    className="border-rp-highlight-med bg-rp-surface"
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
                    className="min-h-[120px] border-rp-highlight-med bg-rp-surface"
                />
            </div>

            {/* Base Model */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    Base AI Model
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>🤖 The Brain Behind Your Soul</TooltipTitle>
                                <TooltipBody>
                                    This is which AI model powers your character. Different models have
                                    different strengths, speeds, and costs.
                                </TooltipBody>
                                <div className="mt-2 grid gap-2 text-xs">
                                    <div className="rounded bg-green-500/10 p-2">
                                        <p className="font-medium text-green-400">✨ FREE Models</p>
                                        <p className="text-rp-subtle">Great for testing & casual use</p>
                                    </div>
                                    <div className="rounded bg-purple-500/10 p-2">
                                        <p className="font-medium text-purple-400">Premium Models</p>
                                        <p className="text-rp-subtle">Better quality, uses credits</p>
                                    </div>
                                </div>
                                <TooltipExample>
                                    Start with a FREE model, upgrade later if needed!
                                </TooltipExample>
                            </div>
                        }
                    />
                </Label>
                <Select
                    value={persona.base_model || 'mistralai/mistral-7b-instruct:free'}
                    onValueChange={(value) => updateField('base_model', value)}
                >
                    <SelectTrigger className="border-rp-highlight-med bg-rp-surface">
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
                <Label className="flex items-center gap-2">
                    Safety Level
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>🛡️ Content Safety Settings</TooltipTitle>
                                <TooltipBody>
                                    Controls what kind of content your Soul can discuss.
                                    This affects both what it says and how it responds to sensitive topics.
                                </TooltipBody>
                                <div className="mt-2 space-y-1 text-xs">
                                    <div className="rounded bg-green-500/10 p-1.5">
                                        <span className="font-medium text-green-400">CHILD</span>
                                        <span className="text-rp-subtle"> — Strictly kid-friendly, no mature content</span>
                                    </div>
                                    <div className="rounded bg-blue-500/10 p-1.5">
                                        <span className="font-medium text-blue-400">TEEN</span>
                                        <span className="text-rp-subtle"> — Appropriate for teenagers</span>
                                    </div>
                                    <div className="rounded bg-purple-500/10 p-1.5">
                                        <span className="font-medium text-purple-400">ADULT</span>
                                        <span className="text-rp-subtle"> — Unrestricted conversations</span>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </Label>
                <Select
                    value={persona.safety_level || 'ADULT'}
                    onValueChange={(value) => updateField('safety_level', value as StudioPersona['safety_level'])}
                >
                    <SelectTrigger className="border-rp-highlight-med bg-rp-surface">
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
