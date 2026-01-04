"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser-client"
import dynamic from "next/dynamic"
// import { SoulSplicer } from "@/components/studio/SoulSplicer" -- Replaced with dynamic

const SoulSplicer = dynamic(
    () => import("@/components/studio/SoulSplicer").then((mod) => mod.SoulSplicer),
    {
        loading: () => (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-rp-highlight-med bg-rp-base">
                <div className="text-center">
                    <IconLoader2 size={32} className="mx-auto mb-2 animate-spin text-rp-iris" />
                    <p className="text-sm text-rp-subtle">Loading editor...</p>
                </div>
            </div>
        ),
        ssr: false
    }
)
import { StudioPersona, DEFAULT_PERSONA } from "../../types"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

export default function SoulSplicerPage() {
    const params = useParams()
    const router = useRouter()
    const personaId = params.id as string

    const [persona, setPersona] = useState<StudioPersona | null>(null)
    const [knowledgeItems, setKnowledgeItems] = useState<Array<{ id: string; file_name: string; file_type: string }>>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Auto-save timer
    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

    // Load persona data
    useEffect(() => {
        const loadPersona = async () => {
            try {
                const { data, error } = await supabase
                    .from("personas")
                    .select("*")
                    .eq("id", personaId)
                    .single()

                if (error) throw error

                setPersona(data as StudioPersona)
            } catch (error: any) {
                console.error("Error loading persona:", error)
                toast.error("Failed to load persona")
                router.push("/studio")
            } finally {
                setLoading(false)
            }
        }

        const loadKnowledge = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Query user_knowledge table directly
                // Note: This table may not be in generated types yet
                const response = await fetch(`/api/v2/knowledge?user_id=${user.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setKnowledgeItems(data.items || [])
                } else {
                    setKnowledgeItems([])
                }
            } catch (error: any) {
                console.error("Error loading knowledge:", error)
                setKnowledgeItems([])
            }
        }

        loadPersona()
        loadKnowledge()
    }, [personaId, router])

    // Auto-save function
    const savePersona = async (personaData: StudioPersona) => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from("personas")
                .update({
                    name: personaData.name,
                    tagline: personaData.tagline,
                    description: personaData.description,
                    system_prompt: personaData.system_prompt,
                    behavioral_blueprint: personaData.behavioral_blueprint as any,
                    image_url: personaData.image_url,
                    category: personaData.category,
                    metadata: personaData.metadata as any,
                    config: personaData.config as any,
                    voice_id: personaData.voice_id,
                    updated_at: new Date().toISOString()
                })
                .eq("id", personaId)

            if (error) throw error

            setHasUnsavedChanges(false)
            toast.success("Changes saved", {
                duration: 2000,
                icon: "💾"
            })
        } catch (error: any) {
            console.error("Error saving persona:", error)
            toast.error("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    // Handle persona updates with auto-save
    const handleUpdate = (updates: Partial<StudioPersona>) => {
        if (!persona) return

        const updated = { ...persona, ...updates }
        setPersona(updated)
        setHasUnsavedChanges(true)

        // Clear existing timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer)
        }

        // Set new auto-save timer (2 seconds after last edit)
        const timer = setTimeout(() => {
            savePersona(updated)
        }, 2000)

        setAutoSaveTimer(timer)
    }

    // Manual save
    const handleManualSave = () => {
        if (persona && hasUnsavedChanges) {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer)
            }
            savePersona(persona)
        }
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer)
            }
        }
    }, [autoSaveTimer])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-rp-base">
                <div className="text-center">
                    <IconLoader2 size={48} className="mx-auto mb-4 animate-spin text-rp-iris" />
                    <p className="text-rp-subtle">Loading Soul Splicer...</p>
                </div>
            </div>
        )
    }

    if (!persona) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-rp-base">
                <div className="text-center">
                    <p className="text-rp-love">Persona not found</p>
                    <Button
                        onClick={() => router.push("/studio")}
                        className="mt-4"
                    >
                        Return to Studio
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-rp-base">
            {/* Header */}
            <div className="border-b border-rp-highlight-med bg-rp-surface">
                <div className="container mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/studio")}
                            className="text-rp-subtle hover:text-rp-text"
                        >
                            <IconArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-rp-text">
                                {persona.name || "Untitled Soul"}
                            </h1>
                            <p className="text-sm text-rp-subtle">
                                Advanced Editor
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Auto-save indicator */}
                        <div className="flex items-center gap-2 text-sm">
                            {saving ? (
                                <>
                                    <IconLoader2 size={16} className="animate-spin text-rp-iris" />
                                    <span className="text-rp-iris">Saving...</span>
                                </>
                            ) : hasUnsavedChanges ? (
                                <span className="text-rp-gold">Unsaved changes</span>
                            ) : (
                                <span className="text-rp-foam">All changes saved</span>
                            )}
                        </div>

                        {/* Manual save button */}
                        <Button
                            onClick={handleManualSave}
                            disabled={!hasUnsavedChanges || saving}
                            className="bg-rp-iris hover:bg-rp-iris/90"
                        >
                            <IconDeviceFloppy size={18} className="mr-2" />
                            Save Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="mx-auto max-w-5xl">
                    <SoulSplicer
                        persona={persona}
                        onUpdate={handleUpdate}
                        knowledgeItems={knowledgeItems}
                    />
                </div>
            </div>

            {/* Developer Console Aesthetic Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-rp-highlight-med bg-rp-surface/95 px-6 py-2 backdrop-blur-sm">
                <div className="container mx-auto flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-4 text-rp-muted">
                        <span>ID: {personaId.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>Version: 2.0</span>
                        <span>•</span>
                        <span>Engine: Soul Splicer</span>
                    </div>
                    <div className="text-rp-subtle">
                        Last modified: {new Date(persona.updated_at || "").toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    )
}
