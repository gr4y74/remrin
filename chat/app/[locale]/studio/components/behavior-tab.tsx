"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { StudioPersona } from "../types"
import { IconWand, IconBrain } from "@tabler/icons-react"

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
            <div className="flex items-center gap-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-medium text-purple-300">
                        <IconBrain size={20} />
                        Neural Upscaler
                    </h3>
                    <p className="text-sm text-zinc-400">
                        Auto-generate behavioral blueprint from name and description
                    </p>
                </div>
                <Button
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
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <p className="text-xs text-zinc-500">
                    The core identity and behavior instructions for this Soul.
                </p>
                <Textarea
                    id="system_prompt"
                    value={persona.system_prompt}
                    onChange={(e) => updateField('system_prompt', e.target.value)}
                    placeholder="You are [Name], a [personality traits]. You speak with [tone]. Your purpose is [goal]..."
                    className="min-h-[200px] border-zinc-700 bg-zinc-900 font-mono text-sm"
                />
            </div>

            {/* NBB JSON Editor */}
            <div className="space-y-2">
                <Label htmlFor="nbb">Neural Behavioral Blueprint (JSON)</Label>
                <p className="text-xs text-zinc-500">
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
                    className="min-h-[300px] border-zinc-700 bg-zinc-950 font-mono text-xs text-green-400"
                />
            </div>
        </div>
    )
}
