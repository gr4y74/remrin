"use client"

import Image from "next/image"
import { useState, useCallback, useMemo, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    IconDna,
    IconBrain,
    IconMoodHappy,
    IconBook,
    IconSparkles,
    IconAlertCircle,
    IconMicrophone,
    IconUpload
} from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { StudioPersona } from "@/app/[locale]/studio/types"
import { VibeSelector } from "./VibeSelector"
import { EmojiButton } from "@/components/ui/EmojiButton"
import { PickerItem } from "@/components/ui/UniversalPicker"
import { useEmojiInsertion } from "@/hooks/useEmojiInsertion"

interface SoulSplicerProps {
    persona: StudioPersona
    onUpdate: (updates: Partial<StudioPersona>) => void
    knowledgeItems?: Array<{ id: string; file_name: string; file_type: string }>
}

export function SoulSplicer({ persona, onUpdate, knowledgeItems = [] }: SoulSplicerProps) {
    const [activeTab, setActiveTab] = useState("identity")
    const systemPromptRef = useRef<HTMLTextAreaElement>(null)
    const { insertEmoji } = useEmojiInsertion(systemPromptRef, persona.system_prompt || "", (newVal) => onUpdate({ system_prompt: newVal }))

    // Also add one for Tagline maybe? Let's start with system prompt which is the big one.

    // Token count estimation (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4)
    const systemPromptTokens = estimateTokens(persona.system_prompt || "")

    // Get config values with defaults
    const temperature = persona.config?.brain_params?.temperature ?? 0.7
    const topP = persona.config?.brain_params?.top_p ?? 0.9
    const frequencyPenalty = persona.config?.brain_params?.frequency_penalty ?? 0

    // Personality traits from behavioral_blueprint
    const formality = (persona.behavioral_blueprint?.formality as number) ?? 50
    const empathy = (persona.behavioral_blueprint?.empathy as number) ?? 50
    const sarcasm = (persona.behavioral_blueprint?.sarcasm as number) ?? 50

    // Knowledge vault integration
    const linkedKnowledge = useMemo(() => (persona.metadata?.linked_knowledge as string[]) ?? [], [persona.metadata?.linked_knowledge])

    const updateBrainParams = useCallback((key: string, value: number) => {
        onUpdate({
            config: {
                ...persona.config,
                brain_params: {
                    ...persona.config?.brain_params,
                    temperature: persona.config?.brain_params?.temperature ?? 0.7,
                    top_p: persona.config?.brain_params?.top_p ?? 0.9,
                    frequency_penalty: persona.config?.brain_params?.frequency_penalty ?? 0,
                    [key]: value
                }
            }
        })
    }, [persona.config, onUpdate])

    const updatePersonalityTrait = useCallback((trait: string, value: number) => {
        onUpdate({
            behavioral_blueprint: {
                ...persona.behavioral_blueprint,
                [trait]: value
            }
        })
    }, [persona.behavioral_blueprint, onUpdate])

    const toggleKnowledgeLink = useCallback((knowledgeId: string) => {
        const current = linkedKnowledge
        const updated = current.includes(knowledgeId)
            ? current.filter(id => id !== knowledgeId)
            : [...current, knowledgeId]

        onUpdate({
            metadata: {
                ...persona.metadata,
                linked_knowledge: updated
            }
        })
    }, [linkedKnowledge, persona.metadata, onUpdate])

    const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${persona.id}/${Math.random()}.${fileExt}`

        const { data, error } = await supabase.storage
            .from('soul_audio')
            .upload(fileName, file)

        if (error) {
            console.error('Upload failed:', error)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('soul_audio')
            .getPublicUrl(fileName)

        onUpdate({
            metadata: {
                ...persona.metadata,
                voice_sample_url: publicUrl
            }
        })
    }, [persona.id, persona.metadata, onUpdate])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-rp-highlight-med pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-rp-iris to-rp-rose">
                    <IconDna size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-rp-text">Soul Splicer</h2>
                    <p className="text-sm text-rp-subtle">
                        Advanced persona editor with fine-tuned control
                    </p>
                </div>
            </div>

            {/* Multi-Panel Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-rp-surface">
                    <TabsTrigger
                        value="identity"
                        className="data-[state=active]:bg-rp-overlay data-[state=active]:text-rp-iris"
                    >
                        <IconSparkles size={16} className="mr-2" />
                        Identity
                    </TabsTrigger>
                    <TabsTrigger
                        value="cortex"
                        className="data-[state=active]:bg-rp-overlay data-[state=active]:text-rp-iris"
                    >
                        <IconBrain size={16} className="mr-2" />
                        Cortex
                    </TabsTrigger>
                    <TabsTrigger
                        value="personality"
                        className="data-[state=active]:bg-rp-overlay data-[state=active]:text-rp-iris"
                    >
                        <IconMoodHappy size={16} className="mr-2" />
                        Personality
                    </TabsTrigger>
                    <TabsTrigger
                        value="knowledge"
                        className="data-[state=active]:bg-rp-overlay data-[state=active]:text-rp-iris"
                    >
                        <IconBook size={16} className="mr-2" />
                        Knowledge
                    </TabsTrigger>
                    <TabsTrigger
                        value="voice"
                        className="data-[state=active]:bg-rp-overlay data-[state=active]:text-rp-iris"
                    >
                        <IconMicrophone size={16} className="mr-2" />
                        Voice
                    </TabsTrigger>
                </TabsList>

                {/* Panel A: Core Identity */}
                <TabsContent value="identity" className="space-y-6 rounded-lg border border-rp-highlight-med bg-rp-base p-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="text-rp-text">Soul Name</Label>
                            <Input
                                id="name"
                                value={persona.name}
                                onChange={(e) => onUpdate({ name: e.target.value })}
                                className="mt-2 border-rp-highlight-med bg-rp-surface font-mono text-rp-text"
                                placeholder="Enter persona name..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="tagline" className="text-rp-text">Tagline</Label>
                            <Input
                                id="tagline"
                                value={persona.tagline || ""}
                                onChange={(e) => onUpdate({ tagline: e.target.value })}
                                className="mt-2 border-rp-highlight-med bg-rp-surface text-rp-text"
                                placeholder="A brief, catchy description..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="avatar" className="text-rp-text">Avatar URL</Label>
                            <Input
                                id="avatar"
                                value={persona.image_url || ""}
                                onChange={(e) => onUpdate({ image_url: e.target.value })}
                                className="mt-2 border-rp-highlight-med bg-rp-surface font-mono text-rp-text"
                                placeholder="https://..."
                            />
                            {persona.image_url && (
                                <div className="mt-3 flex justify-center">
                                    <div className="relative h-32 w-32 shrink-0">
                                        <Image
                                            src={persona.image_url}
                                            alt="Avatar preview"
                                            className="rounded-lg border-2 border-rp-iris object-cover"
                                            fill
                                            sizes="128px"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="category" className="text-rp-text">Category</Label>
                            <Input
                                id="category"
                                value={persona.category || ""}
                                onChange={(e) => onUpdate({ category: e.target.value })}
                                className="mt-2 border-rp-highlight-med bg-rp-surface text-rp-text"
                                placeholder="e.g., romance, helper, adventure..."
                            />
                        </div>

                        {/* Vibe Keywords */}
                        <div>
                            <Label className="text-rp-text">Vibe Keywords</Label>
                            <p className="mb-3 text-xs text-rp-subtle">
                                Add tags that influence the AI&apos;s tone and style
                            </p>
                            <VibeSelector
                                persona={persona}
                                onUpdate={onUpdate}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Panel B: The Cortex */}
                <TabsContent value="cortex" className="space-y-6 rounded-lg border border-rp-highlight-med bg-rp-base p-6">
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="system-prompt" className="text-rp-text">System Prompt</Label>
                                <div className="flex items-center gap-2 rounded-full bg-rp-overlay px-3 py-1">
                                    <IconAlertCircle size={14} className="text-rp-iris" />
                                    <span className="font-mono text-xs text-rp-iris">
                                        ~{systemPromptTokens} tokens
                                    </span>
                                </div>
                            </div>
                            <Textarea
                                id="system-prompt"
                                ref={systemPromptRef}
                                value={persona.system_prompt}
                                onChange={(e) => onUpdate({ system_prompt: e.target.value })}
                                className="mt-2 min-h-[300px] border-rp-highlight-med bg-rp-surface font-mono text-sm text-rp-text"
                                placeholder="You are..."
                            />
                            <div className="flex justify-end mt-1">
                                <EmojiButton
                                    onSelect={(item) => {
                                        if (item.type === 'emoji') insertEmoji(item.data)
                                    }}
                                    position="left"
                                    theme="dark"
                                    className="p-1 rounded hover:bg-rp-highlight-low text-rp-muted hover:text-rp-text transition-colors"
                                />
                            </div>
                            <p className="mt-2 text-xs text-rp-subtle">
                                The core instructions that define how this persona thinks and responds
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <div>
                                <Label className="text-rp-text">Temperature</Label>
                                <div className="mt-3 space-y-3">
                                    <Slider
                                        value={[temperature]}
                                        onValueChange={([value]) => updateBrainParams("temperature", value)}
                                        min={0}
                                        max={2}
                                        step={0.1}
                                        className="[&_[role=slider]]:bg-rp-iris"
                                    />
                                    <div className="flex justify-between text-xs">
                                        <span className="text-rp-subtle">Focused</span>
                                        <span className="font-mono text-rp-iris">{temperature.toFixed(1)}</span>
                                        <span className="text-rp-subtle">Creative</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-rp-text">Top P</Label>
                                <div className="mt-3 space-y-3">
                                    <Slider
                                        value={[topP]}
                                        onValueChange={([value]) => updateBrainParams("top_p", value)}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        className="[&_[role=slider]]:bg-rp-rose"
                                    />
                                    <div className="flex justify-between text-xs">
                                        <span className="text-rp-subtle">Narrow</span>
                                        <span className="font-mono text-rp-rose">{topP.toFixed(2)}</span>
                                        <span className="text-rp-subtle">Diverse</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-rp-text">Frequency Penalty</Label>
                                <div className="mt-3 space-y-3">
                                    <Slider
                                        value={[frequencyPenalty]}
                                        onValueChange={([value]) => updateBrainParams("frequency_penalty", value)}
                                        min={0}
                                        max={2}
                                        step={0.1}
                                        className="[&_[role=slider]]:bg-rp-foam"
                                    />
                                    <div className="flex justify-between text-xs">
                                        <span className="text-rp-subtle">Repetitive</span>
                                        <span className="font-mono text-rp-foam">{frequencyPenalty.toFixed(1)}</span>
                                        <span className="text-rp-subtle">Varied</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-rp-gold/20 bg-rp-gold/5 p-4">
                            <p className="text-xs text-rp-gold">
                                <strong>💡 Cortex Parameters:</strong> These control the AI&apos;s thinking process.
                                Higher temperature = more creative but less predictable.
                                Top P controls vocabulary diversity.
                                Frequency penalty reduces repetition.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* Panel C: Personality Toggles */}
                <TabsContent value="personality" className="space-y-6 rounded-lg border border-rp-highlight-med bg-rp-base p-6">
                    <div className="space-y-8">
                        <div>
                            <Label className="text-rp-text">Formality Level</Label>
                            <p className="mb-3 text-xs text-rp-subtle">
                                How formal or casual should this persona speak?
                            </p>
                            <div className="space-y-3">
                                <Slider
                                    value={[formality]}
                                    onValueChange={([value]) => updatePersonalityTrait("formality", value)}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="[&_[role=slider]]:bg-rp-iris"
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-rp-subtle">Casual & Relaxed</span>
                                    <span className="font-mono text-rp-iris">{formality}%</span>
                                    <span className="text-rp-subtle">Formal & Professional</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-rp-text">Empathy Level</Label>
                            <p className="mb-3 text-xs text-rp-subtle">
                                How emotionally attuned and supportive should they be?
                            </p>
                            <div className="space-y-3">
                                <Slider
                                    value={[empathy]}
                                    onValueChange={([value]) => updatePersonalityTrait("empathy", value)}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="[&_[role=slider]]:bg-rp-rose"
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-rp-subtle">Logical & Direct</span>
                                    <span className="font-mono text-rp-rose">{empathy}%</span>
                                    <span className="text-rp-subtle">Warm & Caring</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-rp-text">Sarcasm Level</Label>
                            <p className="mb-3 text-xs text-rp-subtle">
                                How much wit, humor, and playful sarcasm?
                            </p>
                            <div className="space-y-3">
                                <Slider
                                    value={[sarcasm]}
                                    onValueChange={([value]) => updatePersonalityTrait("sarcasm", value)}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="[&_[role=slider]]:bg-rp-gold"
                                />
                                <div className="flex justify-between text-xs">
                                    <span className="text-rp-subtle">Serious & Literal</span>
                                    <span className="font-mono text-rp-gold">{sarcasm}%</span>
                                    <span className="text-rp-subtle">Witty & Sarcastic</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-rp-foam/20 bg-rp-foam/5 p-4">
                            <p className="text-xs text-rp-foam">
                                <strong>🎭 Personality Matrix:</strong> These traits shape how your persona
                                expresses themselves. Adjust them to create unique communication styles—from
                                a formal academic advisor to a casual, sarcastic friend.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* Panel D: Knowledge Vault */}
                <TabsContent value="knowledge" className="space-y-6 rounded-lg border border-rp-highlight-med bg-rp-base p-6">
                    <div className="space-y-4">
                        <div>
                            <Label className="text-rp-text">Linked Knowledge Files</Label>
                            <p className="mb-4 text-xs text-rp-subtle">
                                Connect files from your Knowledge Vault to give this persona access to specific information
                            </p>
                        </div>

                        {knowledgeItems.length === 0 ? (
                            <div className="rounded-lg border border-rp-muted/20 bg-rp-surface p-8 text-center">
                                <IconBook size={48} className="mx-auto mb-3 text-rp-muted" />
                                <p className="text-sm text-rp-subtle">
                                    No knowledge files available yet
                                </p>
                                <p className="mt-2 text-xs text-rp-muted">
                                    Upload files to your Knowledge Vault to link them here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {knowledgeItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-lg border border-rp-highlight-med bg-rp-surface p-3 transition-colors hover:bg-rp-overlay"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded bg-rp-overlay">
                                                <IconBook size={20} className="text-rp-iris" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-rp-text">
                                                    {item.file_name}
                                                </p>
                                                <p className="text-xs text-rp-subtle">
                                                    {item.file_type.toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={linkedKnowledge.includes(item.id)}
                                            onCheckedChange={() => toggleKnowledgeLink(item.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {linkedKnowledge.length > 0 && (
                            <div className="rounded-lg border border-rp-iris/20 bg-rp-iris/5 p-4">
                                <p className="text-xs text-rp-iris">
                                    <strong>📚 {linkedKnowledge.length} file(s) linked:</strong> This persona
                                    will have access to the content of these files during conversations.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Panel E: Voice Studio */}
                <TabsContent value="voice" className="space-y-6 rounded-lg border border-rp-highlight-med bg-rp-base p-6">
                    <div className="space-y-6">
                        {/* Voice Sample Upload */}
                        <div className="space-y-2">
                            <Label className="text-rp-text">Voice Sample (for preview)</Label>
                            <div className="relative flex h-24 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-surface/50 transition-colors hover:border-rp-love">
                                {persona.metadata?.voice_sample_url ? (
                                    <div className="flex items-center gap-4 px-4">
                                        <IconMicrophone size={24} className="text-orange-400" />
                                        <audio controls className="h-10">
                                            <source src={persona.metadata.voice_sample_url as string} />
                                        </audio>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-rp-muted">
                                        <IconUpload size={24} />
                                        <span className="text-sm">Upload audio sample (mp3/wav)</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="audio/mp3,audio/wav,audio/mpeg"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleAudioUpload}
                                />
                            </div>
                        </div>

                        {/* Voice ID */}
                        <div className="space-y-2">
                            <Label htmlFor="voice_id" className="text-rp-text">Voice ID (ElevenLabs / OpenAI)</Label>
                            <Input
                                id="voice_id"
                                value={persona.voice_id || ''}
                                onChange={(e) => onUpdate({ voice_id: e.target.value })}
                                placeholder="e.g., ThT5KcBeYtu3NO4 or alloy"
                                className="border-rp-highlight-med bg-rp-surface font-mono text-rp-text"
                            />
                            <p className="text-xs text-rp-subtle">
                                The voice synthesis ID for text-to-speech. Leave blank to use default.
                            </p>
                        </div>

                        {/* Voice Presets */}
                        <div className="space-y-2">
                            <Label className="text-rp-text">Quick Presets</Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'alloy', name: 'Alloy (Neutral)' },
                                    { id: 'echo', name: 'Echo (Male)' },
                                    { id: 'fable', name: 'Fable (Expressive)' },
                                    { id: 'nova', name: 'Nova (Female)' },
                                    { id: 'shimmer', name: 'Shimmer (Soft)' }
                                ].map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => onUpdate({ voice_id: preset.id })}
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${persona.voice_id === preset.id
                                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                                            : 'border-rp-highlight-med bg-rp-surface text-rp-subtle hover:border-rp-muted'
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    )
}
