"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ModelSelector } from "./ModelSelector"
import { ParameterControls } from "./ParameterControls"
import { IconSparkles, IconLoader2, IconCircleX } from "@tabler/icons-react"

export interface StudioParameters {
    preference: 'speed' | 'quality'
    aspect_ratio: string
    ye_newe: boolean
    ye_olde: boolean
    guidance: number
    steps: number
    [key: string]: any // To allow for dynamic keys in handleParamChange
}

interface StudioControlsProps {
    type: 'image' | 'video' | 'edit'
    models: any[]
    selectedModelId: string | null
    setSelectedModelId: (id: string) => void
    onGenerate: (data: any) => void
    isGenerating: boolean
}

export function StudioControls({ type, models, selectedModelId, setSelectedModelId, onGenerate, isGenerating }: StudioControlsProps) {
    const [prompt, setPrompt] = useState("")
    const [parameters, setParameters] = useState<StudioParameters>({
        preference: 'quality',
        aspect_ratio: '1:1',
        ye_newe: false,
        ye_olde: false,
        guidance: 7.5,
        steps: 25
    })

    const handleParamChange = (key: string, value: any) => {
        setParameters((prev: StudioParameters) => ({ ...prev, [key]: value }))
    }

    const selectedModel = models.find(m => m.id === selectedModelId)

    return (
        <div className="flex flex-col h-full bg-rp-base/30 border-r border-rp-highlight-low overflow-y-auto scrollbar-hide">
            <div className="p-6 space-y-8">
                {/* 1. Prompt Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-rp-muted uppercase tracking-widest">
                        {type === 'edit' ? 'Describe your changes' : 'Create an image from text prompt'}
                    </h3>
                    <div className="relative">
                        <Textarea
                            placeholder="Describe what you'd like to generate..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[140px] bg-rp-surface border-rp-highlight-low focus:border-rp-iris resize-none text-rp-text placeholder:text-rp-muted/50 rounded-2xl p-4 text-base"
                        />
                        {prompt && (
                            <button
                                onClick={() => setPrompt("")}
                                className="absolute top-3 right-3 p-1.5 text-rp-muted hover:text-rp-love bg-rp-base/50 rounded-full transition-colors"
                            >
                                <IconCircleX size={18} />
                            </button>
                        )}
                    </div>

                    {/* 2. Generate Button (Prominent, High up) */}
                    <Button
                        onClick={() => onGenerate({ model_id: selectedModelId, prompt, parameters })}
                        disabled={!prompt || isGenerating || !selectedModelId}
                        className="w-full h-14 bg-rp-iris hover:bg-rp-iris/90 text-white rounded-2xl shadow-[0_0_20px_rgba(196,167,231,0.25)] transition-all font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isGenerating ? (
                            <IconLoader2 className="animate-spin" size={26} />
                        ) : (
                            <IconSparkles size={26} />
                        )}
                        <span>
                            {isGenerating ? 'Generating...' : `Generate`}
                        </span>
                    </Button>
                </div>

                <div className="h-px bg-rp-highlight-low/30" />

                {/* 3. Model & Style Selection */}
                <ModelSelector
                    models={models}
                    selectedModelId={selectedModelId}
                    onSelect={setSelectedModelId}
                />

                {/* 4. Toggles & Parameters */}
                <ParameterControls
                    parameters={parameters}
                    onParamChange={handleParamChange}
                />

                {/* 5. Upgrade / Subscribe (Premium Feel) */}
                <div className="pt-8 pb-10 space-y-4">
                    <Button className="w-full h-14 bg-gradient-to-r from-rp-iris via-rp-love to-rp-gold text-white rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] font-black text-lg border-2 border-white/20">
                        Subscribe $9.99/mo
                    </Button>
                    <p className="text-center text-[10px] text-rp-muted px-4 leading-relaxed font-bold uppercase tracking-widest opacity-40">
                        Unlock 100+ Styles & Unlimited HD Generations
                    </p>
                </div>
            </div>
        </div>
    )
}
