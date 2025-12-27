"use client"

import { useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PersonaMetadata } from "../types"
import { IconPhoto, IconSparkles } from "@tabler/icons-react"
import Image from "next/image"

interface VisualsTabProps {
    metadata: PersonaMetadata
    updateMetadata: <K extends keyof PersonaMetadata>(field: K, value: PersonaMetadata[K]) => void
    uploadFile: (file: File, bucket: string, folder: string) => Promise<string | null>
}

export function VisualsTab({ metadata, updateMetadata, uploadFile }: VisualsTabProps) {
    const heroInputRef = useRef<HTMLInputElement>(null)

    const handleHeroUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await uploadFile(file, 'soul_forge', 'heroes')
        if (url) {
            updateMetadata('hero_image_url', url)
        }
    }, [uploadFile, updateMetadata])

    return (
        <div className="space-y-6">
            {/* Hero Image */}
            <div className="space-y-2">
                <Label>Hero Image (Store Background)</Label>
                <div
                    className="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-surface/50 transition-colors hover:border-rp-foam"
                    onClick={() => heroInputRef.current?.click()}
                >
                    {metadata.hero_image_url ? (
                        <Image
                            src={metadata.hero_image_url}
                            alt="Hero"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-rp-muted">
                            <IconPhoto size={40} />
                            <span className="text-sm">Upload hero background</span>
                        </div>
                    )}
                    <input
                        ref={heroInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleHeroUpload}
                    />
                </div>
            </div>

            {/* Appearance Prompt */}
            <div className="space-y-2">
                <Label htmlFor="appearance_prompt" className="flex items-center gap-2">
                    <IconSparkles size={16} className="text-cyan-400" />
                    Appearance Prompt (for AI Image Generation)
                </Label>
                <Textarea
                    id="appearance_prompt"
                    value={metadata.appearance_prompt || ''}
                    onChange={(e) => updateMetadata('appearance_prompt', e.target.value)}
                    placeholder="Blue spiky hair, red sneakers, confident stance, anime style, vibrant colors..."
                    className="min-h-[100px] border-rp-highlight-med bg-rp-surface"
                />
                <p className="text-xs text-rp-muted">
                    Describe how image generators should render this character.
                </p>
            </div>

            {/* Negative Prompt */}
            <div className="space-y-2">
                <Label htmlFor="negative_prompt">Negative Prompt (What to Avoid)</Label>
                <Textarea
                    id="negative_prompt"
                    value={metadata.negative_prompt || ''}
                    onChange={(e) => updateMetadata('negative_prompt', e.target.value)}
                    placeholder="low quality, blurry, watermark, text, deformed, ugly..."
                    className="min-h-[80px] border-rp-highlight-med bg-rp-surface"
                />
                <p className="text-xs text-rp-muted">
                    Elements to exclude from generated images.
                </p>
            </div>
        </div>
    )
}
