"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconDna, IconSparkles, IconX, IconLoader2 } from "@tabler/icons-react"
import { InfoTooltip, TooltipTitle, TooltipBody, TooltipExample } from "@/components/ui/info-tooltip"

interface DNASplicing {
    donors: string[]
    synthesis_logic: string
    weights: Record<string, number>
}

interface SoulSplicerProps {
    config: {
        dna_splicing?: DNASplicing
        [key: string]: unknown
    }
    updateConfig: (key: string, value: unknown) => void
    onDistill: (donors: string[]) => Promise<{
        system_prompt: string
        nbb: Record<string, unknown>
        weights: Record<string, number>
    } | null>
    onApply?: (systemPrompt: string, nbb: Record<string, unknown>) => void
}

const ARCHETYPE_SLOTS = 5
const PLACEHOLDER_EXAMPLES = [
    "Einstein (curious, rebellious thinker)",
    "Cleopatra (diplomatic, charismatic)",
    "Sherlock Holmes (analytical, observant)",
    "Bob Ross (gentle, encouraging)",
    "Nikola Tesla (visionary, eccentric)"
]

export function SoulSplicer({ config, updateConfig, onDistill, onApply }: SoulSplicerProps) {
    const [donors, setDonors] = useState<string[]>(
        config.dna_splicing?.donors || Array(ARCHETYPE_SLOTS).fill("")
    )
    const [customDirective, setCustomDirective] = useState("")
    const [isDistilling, setIsDistilling] = useState(false)
    const [preview, setPreview] = useState<{
        system_prompt: string
        nbb: Record<string, unknown>
        weights: Record<string, number>
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDonorChange = (index: number, value: string) => {
        const updated = [...donors]
        updated[index] = value
        setDonors(updated)
    }

    const handleClearSlot = (index: number) => {
        handleDonorChange(index, "")
    }

    const handleDistill = async () => {
        const validDonors = donors.filter(d => d.trim() !== "")
        if (validDonors.length < 1 && !customDirective.trim()) {
            setError("Please add at least one archetype or a custom directive to synthesize")
            return
        }

        setIsDistilling(true)
        setError(null)

        try {
            // Include custom directive if provided
            const donorsToSend = customDirective.trim()
                ? [...validDonors, `Custom: ${customDirective.trim()}`]
                : validDonors

            const result = await onDistill(donorsToSend)
            if (result) {
                setPreview(result)
                // Auto-save the DNA config
                updateConfig("dna_splicing", {
                    donors: validDonors,
                    synthesis_logic: "cross_pollination",
                    weights: result.weights
                })
            }
        } catch (e: any) {
            setError(e.message || "DNA synthesis failed. Please try again.")
        } finally {
            setIsDistilling(false)
        }
    }

    const filledCount = donors.filter(d => d.trim() !== "").length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rp-iris to-rp-rose">
                    <IconDna size={20} className="text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="flex items-center gap-2 font-semibold text-rp-text">
                        Soul Splicer
                        <InfoTooltip
                            side="right"
                            content={
                                <div className="space-y-2">
                                    <TooltipTitle>🧬 What is Soul Splicing?</TooltipTitle>
                                    <TooltipBody>
                                        Imagine mixing paint colors — but for personalities! You combine traits from
                                        famous or fictional characters to create a brand new, unique persona.
                                    </TooltipBody>
                                    <div className="mt-2 space-y-1 text-xs">
                                        <p className="text-rp-foam">🎨 How it works:</p>
                                        <ul className="list-inside list-disc text-rp-subtle">
                                            <li>Enter names of people/characters you admire</li>
                                            <li>AI extracts their THINKING STYLE (not identity)</li>
                                            <li>Blends them into a new unique personality</li>
                                        </ul>
                                    </div>
                                    <TooltipExample>
                                        Einstein + Bob Ross = A gentle genius who explains complex ideas with calm, visual metaphors
                                    </TooltipExample>
                                </div>
                            }
                        />
                    </h3>
                    <p className="text-sm text-rp-subtle">
                        Blend archetypes to create a unique polymath persona
                    </p>
                </div>
            </div>

            {/* Archetype Input Slots */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <span>Archetype DNA Donors</span>
                    <span className="rounded-full bg-rp-overlay px-2 py-0.5 text-xs text-rp-iris">
                        {filledCount}/{ARCHETYPE_SLOTS}
                    </span>
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>👥 Who Should You Add?</TooltipTitle>
                                <TooltipBody>
                                    These are the &quot;ingredients&quot; for your new personality. Pick people or characters
                                    whose THINKING STYLE you want to blend together.
                                </TooltipBody>
                                <div className="mt-2 space-y-1 text-xs">
                                    <p className="text-rp-foam">✅ Great choices:</p>
                                    <ul className="list-inside list-disc text-rp-subtle">
                                        <li>Historical figures (Einstein, Cleopatra)</li>
                                        <li>Fictional characters (Sherlock, Gandalf)</li>
                                        <li>Personality archetypes (&quot;a wise grandmother&quot;)</li>
                                    </ul>
                                </div>
                                <TooltipExample>
                                    More donors = more complex personality. 2-3 is usually the sweet spot!
                                </TooltipExample>
                            </div>
                        }
                    />
                </Label>
                <p className="text-xs text-rp-muted">
                    Enter names of real or fictional personas. The synthesis engine extracts their <b>essence</b>
                    (thinking style, traits, voice) without cloning their identity.
                </p>

                <div className="grid gap-3">
                    {donors.map((donor, index) => (
                        <div key={index} className="group relative">
                            <Input
                                value={donor}
                                onChange={(e) => handleDonorChange(index, e.target.value)}
                                placeholder={PLACEHOLDER_EXAMPLES[index]}
                                className="border-rp-highlight-med bg-rp-surface pr-10 transition-all focus:border-rp-iris"
                            />
                            {donor && (
                                <button
                                    onClick={() => handleClearSlot(index)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-rp-muted opacity-0 transition-opacity hover:text-rp-text group-hover:opacity-100"
                                >
                                    <IconX size={16} />
                                </button>
                            )}
                            <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-rp-muted">
                                #{index + 1}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Directive Input */}
            <div className="space-y-2">
                <Label htmlFor="custom_directive" className="flex items-center gap-2">
                    Custom Directive (Optional)
                    <InfoTooltip
                        content={
                            <div className="space-y-2">
                                <TooltipTitle>✍️ Add Your Own Directive</TooltipTitle>
                                <TooltipBody>
                                    Want to add a specific instruction or personality trait that isn&apos;t covered by the archetypes?
                                    Add it here and it will be included in the synthesis.
                                </TooltipBody>
                                <TooltipExample>
                                    &quot;Always speaks in haikus&quot; or &quot;Has a fear of heights&quot; or &quot;Loves puns&quot;
                                </TooltipExample>
                            </div>
                        }
                    />
                </Label>
                <Input
                    id="custom_directive"
                    value={customDirective}
                    onChange={(e) => setCustomDirective(e.target.value)}
                    placeholder="e.g., 'Always speaks in metaphors' or 'Has a dry sense of humor'"
                    className="border-rp-highlight-med bg-rp-surface"
                />
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-lg border border-rp-love/30 bg-rp-love/10 px-4 py-2 text-sm text-rp-love">
                    {error}
                </div>
            )}

            {/* Distill Button */}
            <Button
                type="button"
                onClick={handleDistill}
                disabled={isDistilling || (filledCount < 1 && !customDirective.trim())}
                className="w-full bg-gradient-to-r from-rp-iris to-rp-rose text-white hover:from-rp-iris/90 hover:to-rp-rose/90"
            >
                {isDistilling ? (
                    <>
                        <IconLoader2 size={18} className="mr-2 animate-spin" />
                        Synthesizing DNA...
                    </>
                ) : (
                    <>
                        <IconSparkles size={18} className="mr-2" />
                        Distill Essence
                    </>
                )}
            </Button>

            {/* Live Preview */}
            {preview && (
                <div className="space-y-4 rounded-lg bg-rp-foam/5 p-4">
                    <h4 className="flex items-center gap-2 font-medium text-rp-foam">
                        <IconSparkles size={16} />
                        Synthesized DNA Preview
                    </h4>

                    {/* Trait Weights */}
                    <div className="space-y-2">
                        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-rp-subtle">
                            Trait Weights
                            <InfoTooltip
                                size={12}
                                content={
                                    <div className="space-y-2">
                                        <TooltipTitle>⚖️ What Are Trait Weights?</TooltipTitle>
                                        <TooltipBody>
                                            These show how strongly each personality trait influences your character.
                                            Higher percentages = that trait is more dominant.
                                        </TooltipBody>
                                        <TooltipExample>
                                            80% curiosity + 20% empathy = A character who asks lots of questions but might seem a bit detached
                                        </TooltipExample>
                                    </div>
                                }
                            />
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(preview.weights).map(([trait, weight]) => (
                                <div
                                    key={trait}
                                    className="flex items-center gap-1 rounded-full bg-rp-overlay px-3 py-1"
                                >
                                    <span className="text-sm text-rp-text">{trait}</span>
                                    <span className="text-xs text-rp-iris">
                                        {(Number(weight) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Prompt Preview - Now Editable */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Generated Directives (Editable)
                            </span>
                            <button
                                type="button"
                                onClick={() => setPreview(prev => prev ? { ...prev, system_prompt: preview.system_prompt } : null)}
                                className="text-xs text-rp-iris hover:text-rp-foam transition-colors"
                                title="Reset changes"
                            >
                                Reset
                            </button>
                        </div>
                        <textarea
                            value={preview.system_prompt}
                            onChange={(e) => setPreview(prev => prev ? { ...prev, system_prompt: e.target.value } : null)}
                            className="max-h-64 min-h-48 w-full rounded-md border border-rp-highlight-med bg-rp-base p-3 font-mono text-xs text-rp-text focus:border-rp-iris focus:outline-none focus:ring-1 focus:ring-rp-iris"
                            placeholder="Edit the generated directives here..."
                        />
                        <p className="text-xs text-rp-muted">
                            💡 Tip: You can edit the directives above to fine-tune the personality before applying.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreview(null)}
                            className="border-rp-highlight-med"
                        >
                            Discard
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                if (preview && onApply) {
                                    onApply(preview.system_prompt, preview.nbb)
                                    setPreview(null)
                                }
                            }}
                            className="bg-rp-foam text-rp-base hover:bg-rp-foam/90"
                        >
                            Apply to Soul
                        </Button>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg bg-rp-gold/5 p-4 text-sm">
                <p className="text-rp-gold">
                    <strong>🧬 How DNA Splicing Works:</strong>
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-rp-subtle">
                    <li>The synthesis engine analyzes each archetype&apos;s signature traits</li>
                    <li>It identifies harmonies and conflicts between their ideologies</li>
                    <li>Outputs a unique &quot;Polymath Persona&quot; that blends their essences</li>
                    <li>Your soul gets their <em>thinking style</em>, not their identity</li>
                </ul>
            </div>
        </div>
    )
}
