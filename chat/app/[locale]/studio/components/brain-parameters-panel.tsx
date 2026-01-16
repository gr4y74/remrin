"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { IconBrain, IconTemperature, IconCircleLetterP, IconRepeat } from "@tabler/icons-react"
import { InfoTooltip, TooltipTitle, TooltipBody, TooltipExample } from "@/components/ui/info-tooltip"

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
        <div className="space-y-6 rounded-lg bg-rp-iris/5 p-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rp-iris/20">
                    <IconBrain size={20} className="text-rp-iris" />
                </div>
                <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold text-rp-text">
                        Advanced Brain Parameters
                        <InfoTooltip
                            content={
                                <div className="space-y-2">
                                    <TooltipTitle>🎛️ Control Your Soul&apos;s Thinking</TooltipTitle>
                                    <TooltipBody>
                                        These sliders control HOW your character thinks and generates responses.
                                        Think of them like personality dials — tweak them to make your soul
                                        more creative, focused, or unpredictable.
                                    </TooltipBody>
                                    <TooltipExample>
                                        A wise mentor might use low temperature (careful answers),
                                        while a chaotic trickster uses high temperature (wild creativity)
                                    </TooltipExample>
                                </div>
                            }
                        />
                    </h3>
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
                        <InfoTooltip
                            iconClassName="text-rp-gold/60 hover:text-rp-gold transition-colors cursor-help"
                            content={
                                <div className="space-y-2">
                                    <TooltipTitle>🌡️ Creativity vs Predictability</TooltipTitle>
                                    <TooltipBody>
                                        Controls how &quot;random&quot; your character&apos;s responses are.
                                        Like turning up the heat on a stove — more heat means more chaos!
                                    </TooltipBody>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded bg-blue-500/10 p-2">
                                            <p className="font-medium text-blue-400">Low (0.0-0.3)</p>
                                            <p className="text-rp-subtle">Same question = same answer</p>
                                            <p className="text-rp-muted">Good for: tutors, factual bots</p>
                                        </div>
                                        <div className="rounded bg-orange-500/10 p-2">
                                            <p className="font-medium text-orange-400">High (0.8-1.5)</p>
                                            <p className="text-rp-subtle">Each response is unique</p>
                                            <p className="text-rp-muted">Good for: creative characters</p>
                                        </div>
                                    </div>
                                    <TooltipExample>
                                        0.7-0.9 is the sweet spot for most roleplay characters
                                    </TooltipExample>
                                </div>
                            }
                        />
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
                        <InfoTooltip
                            iconClassName="text-rp-foam/60 hover:text-rp-foam transition-colors cursor-help"
                            content={
                                <div className="space-y-2">
                                    <TooltipTitle>🎯 Word Choice Variety</TooltipTitle>
                                    <TooltipBody>
                                        Limits which words the AI considers when forming a response.
                                        Like choosing from a menu — low Top-P only picks from the &quot;most likely&quot; dishes.
                                    </TooltipBody>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded bg-cyan-500/10 p-2">
                                            <p className="font-medium text-cyan-400">Low (0.1-0.3)</p>
                                            <p className="text-rp-subtle">Uses common, safe words</p>
                                            <p className="text-rp-muted">Good for: formal, professional</p>
                                        </div>
                                        <div className="rounded bg-purple-500/10 p-2">
                                            <p className="font-medium text-purple-400">High (0.8-1.0)</p>
                                            <p className="text-rp-subtle">Can use rare, unique words</p>
                                            <p className="text-rp-muted">Good for: poetic, quirky</p>
                                        </div>
                                    </div>
                                    <TooltipExample>
                                        Keep at 0.9 for natural conversation, lower for technical accuracy
                                    </TooltipExample>
                                </div>
                            }
                        />
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
                        <InfoTooltip
                            iconClassName="text-rp-rose/60 hover:text-rp-rose transition-colors cursor-help"
                            content={
                                <div className="space-y-2">
                                    <TooltipTitle>🔄 Anti-Repetition Control</TooltipTitle>
                                    <TooltipBody>
                                        Stops your character from repeating the same phrases over and over.
                                        Higher values force more variety in word choice.
                                    </TooltipBody>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded bg-green-500/10 p-2">
                                            <p className="font-medium text-green-400">Low (0.0-0.5)</p>
                                            <p className="text-rp-subtle">Natural repetition allowed</p>
                                            <p className="text-rp-muted">Good for: catchphrases</p>
                                        </div>
                                        <div className="rounded bg-red-500/10 p-2">
                                            <p className="font-medium text-red-400">High (1.0-2.0)</p>
                                            <p className="text-rp-subtle">Forces new vocabulary</p>
                                            <p className="text-rp-muted">Good for: varied storytelling</p>
                                        </div>
                                    </div>
                                    <TooltipExample>
                                        Set to 0.3-0.5 if your character has iconic catchphrases they should repeat
                                    </TooltipExample>
                                </div>
                            }
                        />
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
                💡 Tip: Start with defaults and adjust based on how your character responds. Small changes can have big effects!
            </p>
        </div>
    )
}

