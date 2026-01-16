"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { StudioPersona } from "../types"
import { IconWand, IconBrain } from "@tabler/icons-react"
import { InfoTooltip, TooltipTitle, TooltipBody, TooltipExample } from "@/components/ui/info-tooltip"

interface BehaviorTabProps {
    persona: StudioPersona
    updateField: <K extends keyof StudioPersona>(field: K, value: StudioPersona[K]) => void
    autoCompile: () => Promise<void>
    loading: boolean
}

export function BehaviorTab({ persona, updateField, autoCompile, loading }: BehaviorTabProps) {
    const blueprintJson = persona.behavioral_blueprint
        ? JSON.stringify(persona.behavioral_blueprint, null, 2)
        : ''

    const handleBlueprintChange = (value: string) => {
        try {
            const parsed = JSON.parse(value)
            updateField('behavioral_blueprint', parsed)
        } catch {
            // Allow invalid JSON while typing - only parse on valid JSON
        }
    }

    return (
        <div className="space-y-6">
            {/* Auto-Compile Button */}
            <div className="flex items-center gap-4 rounded-lg bg-purple-500/10 p-4">
                <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-medium text-purple-300">
                        <IconBrain size={20} />
                        Neural Upscaler
                        <InfoTooltip
                            side="right"
                            content={
                                <div className="space-y-2">
                                    <TooltipTitle>🧠 What is the Neural Upscaler?</TooltipTitle>
                                    <TooltipBody>
                                        Think of it like an &quot;AI portrait artist&quot; for personalities. You give it a name
                                        and basic description, and it paints a complete behavioral portrait.
                                    </TooltipBody>
                                    <div className="mt-2 space-y-1 text-xs">
                                        <p className="text-rp-foam">✨ What it does:</p>
                                        <ul className="list-inside list-disc text-rp-subtle">
                                            <li>Creates speech patterns & vocabulary rules</li>
                                            <li>Defines what the character would NEVER say</li>
                                            <li>Generates signature response examples</li>
                                        </ul>
                                    </div>
                                    <TooltipExample>
                                        Input: &quot;Sonic&quot; → Output: Fast-paced speech, uses &quot;gotta go fast!&quot;, never gives up attitude
                                    </TooltipExample>
                                </div>
                            }
                        />
                    </h3>
                    <p className="text-sm text-rp-subtle">
                        Auto-generate behavioral blueprint from name and description
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={autoCompile}
                    disabled={loading || !persona.name}
                    className="bg-purple-600 hover:bg-purple-500"
                >
                    <IconWand size={18} className="mr-2" />
                    {loading ? 'Compiling...' : 'Auto-Compile'}
                </Button>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
                <Label htmlFor="system_prompt" className="flex items-center gap-2">
                    System Prompt *
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>📜 The Soul&apos;s Core Identity</TooltipTitle>
                                <TooltipBody>
                                    This is the &quot;script&quot; that tells your AI character who they are.
                                    It runs at the start of every conversation, shaping how they think,
                                    talk, and react.
                                </TooltipBody>
                                <div className="mt-2 space-y-1 text-xs">
                                    <p className="text-rp-foam">📝 Include:</p>
                                    <ul className="list-inside list-disc text-rp-subtle">
                                        <li>Who they are (name, role, backstory)</li>
                                        <li>How they speak (formal, casual, quirky)</li>
                                        <li>Their goals and motivations</li>
                                        <li>Any rules they must follow</li>
                                    </ul>
                                </div>
                                <TooltipExample>
                                    &quot;You are Luna, a friendly astronomy tutor who explains space concepts using pizza analogies...&quot;
                                </TooltipExample>
                            </div>
                        }
                    />
                </Label>
                <p className="text-xs text-rp-muted">
                    The core identity and behavior instructions for this Soul.
                </p>
                <Textarea
                    id="system_prompt"
                    value={persona.system_prompt}
                    onChange={(e) => updateField('system_prompt', e.target.value)}
                    placeholder="You are [Name], a [personality traits]. You speak with [tone]. Your purpose is [goal]..."
                    className="min-h-[200px] border-rp-highlight-med bg-rp-surface font-mono text-sm"
                />
            </div>

            {/* NBB JSON Editor */}
            <div className="space-y-2">
                <Label htmlFor="nbb" className="flex items-center gap-2">
                    Neural Behavioral Blueprint (JSON)
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>🔬 Advanced Personality Programming</TooltipTitle>
                                <TooltipBody>
                                    This is the &quot;DNA&quot; of your character&apos;s personality — strict rules that
                                    ensure they stay in character no matter what.
                                </TooltipBody>
                                <div className="mt-2 space-y-1 text-xs">
                                    <p className="text-rp-foam">🧩 Contains:</p>
                                    <ul className="list-inside list-disc text-rp-subtle">
                                        <li><strong>lexical_rules</strong>: How they structure sentences</li>
                                        <li><strong>negative_constraints</strong>: Things they NEVER do</li>
                                        <li><strong>anchors</strong>: Pre-set responses to specific triggers</li>
                                    </ul>
                                </div>
                                <TooltipExample>
                                    Pro tip: Click &quot;Auto-Compile&quot; above to generate this automatically!
                                </TooltipExample>
                            </div>
                        }
                    />
                </Label>
                <p className="text-xs text-rp-muted">
                    Strict lexical rules, constraints, and anchors. Auto-generated or manually edited.
                </p>
                <Textarea
                    id="nbb"
                    value={blueprintJson}
                    onChange={(e) => handleBlueprintChange(e.target.value)}
                    placeholder={`{
  "lexical_rules": {
    "sentence_structure": "Short, punchy sentences",
    "vocabulary_tier": "casual"
  },
  "negative_constraints": [
    "NEVER break character",
    "NEVER use formal language"
  ],
  "anchors": [
    { "trigger": "Who are you?", "response": "..." }
  ]
}`}
                    className="min-h-[300px] border-rp-highlight-med bg-rp-base font-mono text-xs text-green-400"
                />
            </div>
        </div>
    )
}

