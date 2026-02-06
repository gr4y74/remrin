"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    IconUpload,
    IconDownload,
    IconDeviceFloppy,
    IconRefresh,
    IconAlertCircle,
    IconCheck,
    IconChevronDown,
    IconChevronUp
} from "@tabler/icons-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface SoulData {
    name?: string
    tagline?: string
    description?: string
    system_prompt?: string
    intro_message?: string
    safety_level?: "CHILD" | "TEEN" | "ADULT"
    category?: string
    tags?: string[]
    voice_id?: string
    image_url?: string
    hero_image_url?: string
    metadata?: {
        hero_video_url?: string
        appearance_prompt?: string
        vibe_keywords?: string[]
        is_official?: boolean
    }
    config?: {
        brain_params?: {
            temperature?: number
            top_p?: number
            frequency_penalty?: number
        }
        safety_lock?: boolean
    }
}

interface SoulEditorProps {
    personaId: string
    initialData?: SoulData
    onSave?: (data: SoulData) => Promise<void>
    onUpdate?: () => void
    isAdmin?: boolean
}

const SAFETY_LEVELS = ["CHILD", "TEEN", "ADULT"] as const
const CATEGORIES = ["general", "romance", "adventure", "helper", "anime", "original", "education", "fantasy", "sci-fi"]

export function SoulEditor({ personaId, initialData, onSave, onUpdate, isAdmin = false }: SoulEditorProps) {
    const [soulData, setSoulData] = useState<SoulData>(initialData || {})
    const [saving, setSaving] = useState(false)
    const [importing, setImporting] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync state with props when character changes
    React.useEffect(() => {
        setSoulData(initialData || {})
        setHasChanges(false)
    }, [personaId, initialData])

    const updateField = useCallback(<K extends keyof SoulData>(field: K, value: SoulData[K]) => {
        setSoulData(prev => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }, [])

    const updateNestedField = useCallback((parent: 'metadata' | 'config', field: string, value: any) => {
        setSoulData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] || {}),
                [field]: value
            }
        }))
        setHasChanges(true)
    }, [])

    const updateBrainParam = useCallback((field: string, value: number) => {
        setSoulData(prev => ({
            ...prev,
            config: {
                ...(prev.config || {}),
                brain_params: {
                    ...(prev.config?.brain_params || {}),
                    [field]: value
                }
            }
        }))
        setHasChanges(true)
    }, [])

    // Handle JSON file import
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        try {
            const text = await file.text()
            const json = JSON.parse(text)

            // Remove internal fields that shouldn't be editable
            const { $schema, _comment, _safety_level_options, _category_options, _voice_id_comment, _image_url_comment, ...cleanData } = json

            setSoulData(cleanData)
            setHasChanges(true)
            toast.success(`Imported soul template: ${cleanData.name || 'Unknown'}`)
        } catch (err) {
            console.error("Failed to import JSON:", err)
            toast.error("Invalid JSON file")
        } finally {
            setImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    // Export current data as JSON
    const handleExport = () => {
        const exportData = {
            $schema: "./soul_schema.json",
            ...soulData
        }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${soulData.name || 'soul'}_template.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Soul template exported!")
    }

    // Save to database
    const handleSave = async () => {
        if (!personaId) {
            toast.error("No persona selected")
            return
        }

        setSaving(true)
        try {
            if (onSave) {
                await onSave(soulData)
            } else {
                // Default: call the update API
                const response = await fetch("/api/v2/personas/update", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        persona_id: personaId,
                        soul_data: soulData
                    })
                })

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(result.error || "Failed to save")
                }

                toast.success(`Updated ${result.fields_updated?.length || 0} fields`)
            }

            setHasChanges(false)
            onUpdate?.()
        } catch (err: any) {
            console.error("Failed to save:", err)
            toast.error(err.message || "Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    // Reset to initial data
    const handleReset = () => {
        if (!hasChanges) return
        if (!confirm("Discard all changes?")) return
        setSoulData(initialData || {})
        setHasChanges(false)
        toast.info("Changes discarded")
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                >
                    <IconUpload size={16} className="mr-1" />
                    Import JSON
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                >
                    <IconDownload size={16} className="mr-1" />
                    Export JSON
                </Button>
                <div className="flex-1" />
                {hasChanges && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                    >
                        <IconRefresh size={16} className="mr-1" />
                        Reset
                    </Button>
                )}
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="bg-rp-iris hover:bg-rp-iris/90"
                >
                    <IconDeviceFloppy size={16} className="mr-1" />
                    {saving ? "Saving..." : "Save Soul"}
                </Button>
            </div>

            {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-rp-gold">
                    <IconAlertCircle size={16} />
                    <span>You have unsaved changes</span>
                </div>
            )}

            {/* Core Fields */}
            <div className="grid gap-4">
                {/* Name & Tagline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rp-subtle mb-1">Name</label>
                        <input
                            type="text"
                            value={soulData.name || ""}
                            onChange={(e) => updateField("name", e.target.value)}
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none"
                            placeholder="Soul name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-rp-subtle mb-1">Tagline</label>
                        <input
                            type="text"
                            value={soulData.tagline || ""}
                            onChange={(e) => updateField("tagline", e.target.value)}
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none"
                            placeholder="A short catchy phrase"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-rp-subtle mb-1">Description</label>
                    <textarea
                        value={soulData.description || ""}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none resize-none"
                        placeholder="Who is this soul? Background, personality traits, etc."
                    />
                </div>

                {/* System Prompt */}
                <div>
                    <label className="block text-sm font-medium text-rp-subtle mb-1">
                        System Prompt
                        <span className="ml-2 text-xs text-rp-muted">(The soul&apos;s core personality)</span>
                    </label>
                    <textarea
                        value={soulData.system_prompt || ""}
                        onChange={(e) => updateField("system_prompt", e.target.value)}
                        rows={6}
                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm font-mono focus:border-rp-iris focus:outline-none resize-y"
                        placeholder="You are [Name], a [describe personality]..."
                    />
                </div>

                {/* Intro Message */}
                <div>
                    <label className="block text-sm font-medium text-rp-subtle mb-1">Intro Message</label>
                    <textarea
                        value={soulData.intro_message || ""}
                        onChange={(e) => updateField("intro_message", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none resize-none"
                        placeholder="The first message your soul sends when a conversation starts"
                    />
                </div>

                {/* Safety & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-rp-subtle mb-1">Safety Level</label>
                        <select
                            value={soulData.safety_level || "ADULT"}
                            onChange={(e) => updateField("safety_level", e.target.value as any)}
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none"
                        >
                            {SAFETY_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-rp-subtle mb-1">Category</label>
                        <select
                            value={soulData.category || "general"}
                            onChange={(e) => updateField("category", e.target.value)}
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-rp-subtle mb-1">Tags</label>
                    <input
                        type="text"
                        value={(soulData.tags || []).join(", ")}
                        onChange={(e) => updateField("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none"
                        placeholder="tag1, tag2, tag3"
                    />
                    <p className="mt-1 text-xs text-rp-muted">Separate tags with commas</p>
                </div>
            </div>

            {/* Advanced Section */}
            <div className="border-t border-rp-highlight-med pt-4">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-rp-subtle hover:text-rp-text transition-colors"
                >
                    {showAdvanced ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    Advanced Settings
                </button>

                <AnimatePresence>
                    {showAdvanced && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 space-y-4">
                                {/* Brain Parameters */}
                                <div>
                                    <h4 className="text-sm font-medium text-rp-subtle mb-3">Brain Parameters</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-rp-muted mb-1">
                                                Temperature: {soulData.config?.brain_params?.temperature?.toFixed(2) || "0.80"}
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.05"
                                                value={soulData.config?.brain_params?.temperature || 0.8}
                                                onChange={(e) => updateBrainParam("temperature", parseFloat(e.target.value))}
                                                className="w-full accent-rp-iris"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-rp-muted mb-1">
                                                Top P: {soulData.config?.brain_params?.top_p?.toFixed(2) || "0.90"}
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={soulData.config?.brain_params?.top_p || 0.9}
                                                onChange={(e) => updateBrainParam("top_p", parseFloat(e.target.value))}
                                                className="w-full accent-rp-iris"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-rp-muted mb-1">
                                                Freq Penalty: {soulData.config?.brain_params?.frequency_penalty?.toFixed(2) || "0.00"}
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={soulData.config?.brain_params?.frequency_penalty || 0}
                                                onChange={(e) => updateBrainParam("frequency_penalty", parseFloat(e.target.value))}
                                                className="w-full accent-rp-iris"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div>
                                    <h4 className="text-sm font-medium text-rp-subtle mb-3">Metadata</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-rp-muted mb-1">Appearance Prompt</label>
                                            <textarea
                                                value={soulData.metadata?.appearance_prompt || ""}
                                                onChange={(e) => updateNestedField("metadata", "appearance_prompt", e.target.value)}
                                                rows={2}
                                                className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none resize-none"
                                                placeholder="Describe the soul's appearance for image generation"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-rp-muted mb-1">Vibe Keywords</label>
                                            <input
                                                type="text"
                                                value={(soulData.metadata?.vibe_keywords || []).join(", ")}
                                                onChange={(e) => updateNestedField("metadata", "vibe_keywords", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                                                className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm focus:border-rp-iris focus:outline-none"
                                                placeholder="mysterious, playful, wise"
                                            />
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is-official"
                                                    checked={soulData.metadata?.is_official || false}
                                                    onChange={(e) => updateNestedField("metadata", "is_official", e.target.checked)}
                                                    className="rounded accent-rp-iris"
                                                />
                                                <label htmlFor="is-official" className="text-sm text-rp-subtle">
                                                    Official Remrin Character
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Voice ID */}
                                <div>
                                    <label className="block text-xs text-rp-muted mb-1">Voice ID (ElevenLabs)</label>
                                    <input
                                        type="text"
                                        value={soulData.voice_id || ""}
                                        onChange={(e) => updateField("voice_id", e.target.value)}
                                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm font-mono focus:border-rp-iris focus:outline-none"
                                        placeholder="Leave empty for default"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
