"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconDna, IconSparkles, IconX, IconLoader2 } from "@tabler/icons-react"

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
}

const ARCHETYPE_SLOTS = 5
const PLACEHOLDER_EXAMPLES = [
    "Einstein (curious, rebellious thinker)",
    "Cleopatra (diplomatic, charismatic)",
    "Sherlock Holmes (analytical, observant)",
    "Bob Ross (gentle, encouraging)",
    "Nikola Tesla (visionary, eccentric)"
]

export function SoulSplicer({ config, updateConfig, onDistill }: SoulSplicerProps) {
    const [donors, setDonors] = useState<string[]>(
        config.dna_splicing?.donors || Array(ARCHETYPE_SLOTS).fill("")
    )
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
        if (validDonors.length < 1) {
            setError("Please add at least one archetype to synthesize")
            return
        }

        setIsDistilling(true)
        setError(null)

        try {
            const result = await onDistill(validDonors)
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
            <div className="flex items-center gap-3 border-b border-rp-highlight-med pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rp-iris to-rp-rose">
                    <IconDna size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-rp-text">Soul Splicer</h3>
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

            {/* Error Display */}
            {error && (
                <div className="rounded-lg border border-rp-love/30 bg-rp-love/10 px-4 py-2 text-sm text-rp-love">
                    {error}
                </div>
            )}

            {/* Distill Button */}
            <Button
                onClick={handleDistill}
                disabled={isDistilling || filledCount < 1}
                className="w-full bg-gradient-to-r from-rp-iris to-rp-rose text-white hover:from-rp-iris/90 hover:to-rp-rose/90"
            >
                {isDistilling ? (
                    <>
                        <IconLoader2 size={18} className="mr-2 animate-spin" />
                        Distilling DNA...
                    </>
                ) : (
                    <>
                        <IconSparkles size={18} className="mr-2" />
                        Distill DNA
                    </>
                )}
            </Button>

            {/* Live Preview */}
            {preview && (
                <div className="space-y-4 rounded-lg border border-rp-foam/30 bg-rp-foam/5 p-4">
                    <h4 className="flex items-center gap-2 font-medium text-rp-foam">
                        <IconSparkles size={16} />
                        Synthesized DNA Preview
                    </h4>

                    {/* Trait Weights */}
                    <div className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-rp-subtle">
                            Trait Weights
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

                    {/* System Prompt Preview */}
                    <div className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-rp-subtle">
                            Generated Directives
                        </span>
                        <div className="max-h-48 overflow-y-auto rounded-md bg-rp-base p-3 font-mono text-xs text-rp-text">
                            <pre className="whitespace-pre-wrap">{preview.system_prompt}</pre>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreview(null)}
                            className="border-rp-highlight-med"
                        >
                            Discard
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                // Apply the synthesized prompt to the persona
                                // This would be handled by parent component
                            }}
                            className="bg-rp-foam text-rp-base hover:bg-rp-foam/90"
                        >
                            Apply to Soul
                        </Button>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="rounded-lg border border-rp-gold/20 bg-rp-gold/5 p-4 text-sm">
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
