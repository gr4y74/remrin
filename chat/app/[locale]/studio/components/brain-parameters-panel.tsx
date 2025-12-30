"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { IconBrain, IconTemperature, IconCircleLetterP, IconRepeat } from "@tabler/icons-react"

interface BrainParams {
    temperature: number
    top_p: number
    frequency_penalty: number
}

interface BrainParametersPanelProps {
    config: {
        brain_params?: BrainParams
        [key: string]: unknown
    }
    updateConfig: (key: string, value: unknown) => void
}

const DEFAULT_PARAMS: BrainParams = {
    temperature: 0.8,
    top_p: 0.9,
    frequency_penalty: 0.0
}

export function BrainParametersPanel({ config, updateConfig }: BrainParametersPanelProps) {
    const params = config.brain_params || DEFAULT_PARAMS

    const handleParamChange = (key: keyof BrainParams, value: number) => {
        updateConfig("brain_params", {
            ...params,
            [key]: value
        })
    }

    const getTemperatureLabel = (t: number) => {
        if (t <= 0.3) return "🧊 Stoic / Logical"
        if (t <= 0.6) return "⚖️ Balanced"
        if (t <= 1.0) return "🎲 Creative"
        return "🌋 Chaotic / Wild"
    }

    const getTopPLabel = (p: number) => {
        if (p <= 0.3) return "Focused vocabulary"
        if (p <= 0.7) return "Balanced variety"
        return "Maximum diversity"
    }

    const getFrequencyPenaltyLabel = (f: number) => {
        if (f <= 0.3) return "Natural repetition"
        if (f <= 1.0) return "Reduced repetition"
        return "Strongly varied"
    }

    return (
        <div className="space-y-6 rounded-lg border border-rp-iris/20 bg-rp-iris/5 p-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-rp-iris/20 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rp-iris/20">
                    <IconBrain size={20} className="text-rp-iris" />
                </div>
                <div>
                    <h3 className="font-semibold text-rp-text">Advanced Brain Parameters</h3>
                    <p className="text-sm text-rp-subtle">
                        Fine-tune the LLM&apos;s stochastic behavior
                    </p>
                </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                        <IconTemperature size={16} className="text-rp-gold" />
                        Temperature (T)
                    </Label>
                    <span className="rounded bg-rp-overlay px-2 py-0.5 font-mono text-sm text-rp-gold">
                        {params.temperature.toFixed(2)}
                    </span>
                </div>
                <Slider
                    value={[params.temperature]}
                    onValueChange={([v]) => handleParamChange("temperature", v)}
                    min={0}
                    max={1.5}
                    step={0.05}
                    className="[&_[role=slider]]:bg-rp-gold"
                />
                <div className="flex justify-between text-xs text-rp-muted">
                    <span>0.0 (Deterministic)</span>
                    <span className="font-medium text-rp-gold">{getTemperatureLabel(params.temperature)}</span>
                    <span>1.5 (Maximum)</span>
                </div>
            </div>

            {/* Top-P Slider */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                        <IconCircleLetterP size={16} className="text-rp-foam" />
                        Top-P (Nucleus Sampling)
                    </Label>
                    <span className="rounded bg-rp-overlay px-2 py-0.5 font-mono text-sm text-rp-foam">
                        {params.top_p.toFixed(2)}
                    </span>
                </div>
                <Slider
                    value={[params.top_p]}
                    onValueChange={([v]) => handleParamChange("top_p", v)}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    className="[&_[role=slider]]:bg-rp-foam"
                />
                <div className="flex justify-between text-xs text-rp-muted">
                    <span>0.1 (Narrow)</span>
                    <span className="font-medium text-rp-foam">{getTopPLabel(params.top_p)}</span>
                    <span>1.0 (Full)</span>
                </div>
            </div>

            {/* Frequency Penalty Slider */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                        <IconRepeat size={16} className="text-rp-rose" />
                        Frequency Penalty
                    </Label>
                    <span className="rounded bg-rp-overlay px-2 py-0.5 font-mono text-sm text-rp-rose">
                        {params.frequency_penalty.toFixed(2)}
                    </span>
                </div>
                <Slider
                    value={[params.frequency_penalty]}
                    onValueChange={([v]) => handleParamChange("frequency_penalty", v)}
                    min={0}
                    max={2.0}
                    step={0.1}
                    className="[&_[role=slider]]:bg-rp-rose"
                />
                <div className="flex justify-between text-xs text-rp-muted">
                    <span>0.0 (None)</span>
                    <span className="font-medium text-rp-rose">{getFrequencyPenaltyLabel(params.frequency_penalty)}</span>
                    <span>2.0 (Strong)</span>
                </div>
            </div>

            {/* Info */}
            <p className="text-xs text-rp-muted">
                These parameters control how your soul generates responses. Higher temperature = more creative but less predictable.
                Top-P controls vocabulary diversity. Frequency penalty prevents repetitive phrases.
            </p>
        </div>
    )
}
