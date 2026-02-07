"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { IconLock, IconCheck, IconRotate, IconChevronDown } from "@tabler/icons-react"
import Image from "next/image"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AIModel {
    id: string
    name: string
    display_name: string
    thumbnail_url?: string
    aether_cost: number
    quality_tier: "HD" | "Genius" | "Super Genius"
}

interface ModelSelectorProps {
    models: AIModel[]
    selectedModelId?: string | null
    onSelect: (modelId: string) => void
}

export function ModelSelector({ models, selectedModelId, onSelect }: ModelSelectorProps) {
    const [activeTier, setActiveTier] = useState<"HD" | "Genius" | "Super Genius">("HD")

    const filteredByTier = models.filter(m => m.quality_tier === activeTier)

    // Top 5 "styles" for the grid view
    const featuredStyles = filteredByTier.slice(0, 5)

    const tiers = [
        { id: "HD", label: "HD", locked: false },
        { id: "Genius", label: "Genius", locked: false },
        { id: "Super Genius", label: "Super Genius", locked: false },
    ]

    const selectedModel = models.find(m => m.id === selectedModelId)

    return (
        <div className="space-y-6">
            {/* 1. Quality Tier Selection */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-rp-muted uppercase tracking-wider">Choose a model</h3>
                <div className="flex p-1 bg-rp-surface rounded-lg border border-rp-highlight-low">
                    {tiers.map((tier) => (
                        <button
                            key={tier.id}
                            onClick={() => setActiveTier(tier.id as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-bold transition-all",
                                activeTier === tier.id
                                    ? "bg-rp-iris text-white shadow-lg"
                                    : "text-rp-subtle hover:text-rp-text hover:bg-white/5"
                            )}
                        >
                            {tier.locked && <IconLock size={12} className="text-rp-muted" />}
                            <span className="uppercase tracking-widest">{tier.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Style Grid (Top 5) */}
            <div className="space-y-3">
                <h3 className="text-xs font-medium text-rp-muted uppercase tracking-widest">Choose a style</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => featuredStyles[0] && onSelect(featuredStyles[0].id)}
                        className="size-12 rounded-lg bg-rp-surface border border-rp-highlight-low flex items-center justify-center text-rp-muted hover:text-rp-text hover:border-rp-muted transition-all shrink-0"
                    >
                        <IconRotate size={20} />
                    </button>

                    {featuredStyles.map((model) => {
                        const isVideo = model.thumbnail_url?.toLowerCase().endsWith('.mp4');
                        return (
                            <button
                                key={model.id}
                                onClick={() => onSelect(model.id)}
                                className={cn(
                                    "relative size-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 group",
                                    selectedModelId === model.id
                                        ? "border-rp-iris ring-2 ring-rp-iris/30 scale-105"
                                        : "border-rp-highlight-low hover:border-rp-muted"
                                )}
                            >
                                {model.thumbnail_url ? (
                                    isVideo ? (
                                        <video
                                            src={model.thumbnail_url}
                                            className="size-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <Image
                                            src={model.thumbnail_url}
                                            alt={model.display_name}
                                            fill
                                            className="object-cover"
                                        />
                                    )
                                ) : (
                                    <div className="size-full bg-rp-overlay flex items-center justify-center text-[10px] font-bold">
                                        {model.display_name.charAt(0)}
                                    </div>
                                )}
                                {selectedModelId === model.id && (
                                    <div className="absolute inset-0 bg-rp-iris/20 flex items-center justify-center">
                                        <IconCheck size={16} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Detailed Model Dropdown (View all) */}
            <div className="space-y-2">
                <Select value={selectedModelId} onValueChange={onSelect}>
                    <SelectTrigger className="w-full h-11 bg-rp-surface border-rp-highlight-low hover:bg-rp-highlight-low/10 text-rp-text rounded-xl focus:ring-rp-iris">
                        <SelectValue placeholder="Select a model style">
                            {selectedModel ? (
                                <div className="flex items-center justify-between w-full pr-4">
                                    <span className="font-semibold">{selectedModel.display_name}</span>
                                    <span className="text-[10px] text-rp-gold font-bold ml-2">
                                        {selectedModel.aether_cost}✧
                                    </span>
                                </div>
                            ) : "Choose a model"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-rp-surface border-rp-highlight-low text-rp-text shadow-2xl rounded-xl max-h-[300px]">
                        {models
                            .filter(m => m.quality_tier === activeTier)
                            .map((model) => (
                                <SelectItem
                                    key={model.id}
                                    value={model.id}
                                    className="focus:bg-rp-iris/20 focus:text-white cursor-pointer py-3 rounded-lg mx-1 my-0.5"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold">{model.display_name}</span>
                                        <span className="text-[10px] text-rp-muted">
                                            {model.aether_cost} Aether per generation
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-rp-muted text-center px-4">
                    Explore +30 unique AI styles powered by Replicate & Black Forest Labs
                </p>
            </div>
        </div>
    )
}
