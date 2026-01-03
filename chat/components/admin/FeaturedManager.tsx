"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import {
    IconSearch,
    IconStar,
    IconStarFilled,
    IconEye,
    IconEyeOff,
    IconLoader2,
    IconCheck,
    IconRefresh,
    IconPlus,
    IconEdit,
    IconTrash,
    IconUpload,
    IconDownload,
    IconX,
    IconPhoto
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    visibility: string
    is_featured: boolean
    is_premium?: boolean
    category?: string
    created_at: string
}

type TabType = "featured" | "visibility" | "premium" | "trending"

export function FeaturedManager() {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<TabType>("featured")
    const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<Persona>>>(new Map())
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)

    // Fetch personas
    const fetchPersonas = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/personas")
            const data = await response.json()
            if (data.personas) {
                setPersonas(data.personas)
            }
        } catch (error) {
            toast.error("Failed to load personas")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPersonas()
    }, [])

    // Filter personas by search
    const filteredPersonas = useMemo(() => {
        if (!searchQuery) return personas
        const query = searchQuery.toLowerCase()
        return personas.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        )
    }, [personas, searchQuery])

    // Stats
    const stats = useMemo(() => ({
        total: personas.length,
        featured: personas.filter(p => p.is_featured).length,
        premium: personas.filter(p => p.is_premium).length,
        public: personas.filter(p => p.visibility === "PUBLIC").length,
        private: personas.filter(p => p.visibility === "PRIVATE").length
    }), [personas])

    // Toggle featured status
    const toggleFeatured = (persona: Persona) => {
        const newValue = !persona.is_featured

        setPersonas(prev => prev.map(p =>
            p.id === persona.id ? { ...p, is_featured: newValue } : p
        ))

        setPendingChanges(prev => {
            const updated = new Map(prev)
            updated.set(persona.id, {
                ...updated.get(persona.id),
                is_featured: newValue
            })
            return updated
        })
    }

    // Toggle premium status
    const togglePremium = (persona: Persona) => {
        const newValue = !persona.is_premium

        setPersonas(prev => prev.map(p =>
            p.id === persona.id ? { ...p, is_premium: newValue } : p
        ))

        setPendingChanges(prev => {
            const updated = new Map(prev)
            updated.set(persona.id, {
                ...updated.get(persona.id),
                is_premium: newValue
            })
            return updated
        })
    }

    // Toggle visibility
    const toggleVisibility = (persona: Persona) => {
        const newValue = persona.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"

        setPersonas(prev => prev.map(p =>
            p.id === persona.id ? { ...p, visibility: newValue } : p
        ))

        setPendingChanges(prev => {
            const updated = new Map(prev)
            updated.set(persona.id, {
                ...updated.get(persona.id),
                visibility: newValue
            })
            return updated
        })
    }

    // Delete persona
    const deletePersona = async (persona: Persona) => {
        if (!confirm(`Are you sure you want to delete "${persona.name}"? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await fetch(`/api/admin/personas?id=${persona.id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                toast.success("Persona deleted successfully")
                setPersonas(prev => prev.filter(p => p.id !== persona.id))
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to delete persona")
            }
        } catch (error) {
            toast.error("Network error. Please try again.")
        }
    }

    // Upload image
    const handleImageUpload = async (personaId: string, file: File) => {
        setUploadingImage(true)
        try {
            const supabase = createClient()

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${personaId}-${Date.now()}.${fileExt}`
            const filePath = `${personaId}/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('soul_portraits')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('soul_portraits')
                .getPublicUrl(filePath)

            // Update persona with new image URL
            const { error: updateError } = await supabase
                .from('personas')
                .update({ image_url: publicUrl })
                .eq('id', personaId)

            if (updateError) throw updateError

            // Update local state
            setPersonas(prev => prev.map(p =>
                p.id === personaId ? { ...p, image_url: publicUrl } : p
            ))

            toast.success("Image uploaded successfully!")
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload image")
        } finally {
            setUploadingImage(false)
        }
    }

    // Export personas data
    const exportPersonas = () => {
        const dataStr = JSON.stringify(personas, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `personas-export-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success("Personas exported successfully!")
    }

    // Save all pending changes
    const saveChanges = async () => {
        if (pendingChanges.size === 0) return

        setSaving(true)
        try {
            const updates = Array.from(pendingChanges.entries()).map(([id, changes]) => ({
                id,
                ...changes
            }))

            const response = await fetch("/api/admin/personas", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(data.message || "Changes saved!")
                setPendingChanges(new Map())
            } else {
                toast.error(data.error || "Failed to save changes")
            }
        } catch (error) {
            toast.error("Network error. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <IconLoader2 className="text-rp-iris size-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                    <div className="text-rp-text text-2xl font-bold">{stats.total}</div>
                    <div className="text-rp-muted text-sm">Total Souls</div>
                </div>
                <div className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                    <div className="text-rp-gold text-2xl font-bold">{stats.featured}</div>
                    <div className="text-rp-muted text-sm">Featured</div>
                </div>
                <div className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                    <div className="text-purple-400 text-2xl font-bold">{stats.premium}</div>
                    <div className="text-rp-muted text-sm">Premium</div>
                </div>
                <div className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                    <div className="text-rp-foam text-2xl font-bold">{stats.public}</div>
                    <div className="text-rp-muted text-sm">Public</div>
                </div>
                <div className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                    <div className="text-rp-subtle text-2xl font-bold">{stats.private}</div>
                    <div className="text-rp-muted text-sm">Private</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTab("featured")}
                        className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === "featured"
                                ? "bg-rp-gold/20 text-rp-gold border-rp-gold/30 border"
                                : "text-rp-subtle hover:text-rp-text"
                        )}
                    >
                        <IconStarFilled size={16} className="mr-2 inline" />
                        Featured
                    </button>
                    <button
                        onClick={() => setActiveTab("premium")}
                        className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === "premium"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30 border"
                                : "text-rp-subtle hover:text-rp-text"
                        )}
                    >
                        <IconStar size={16} className="mr-2 inline" />
                        Premium
                    </button>
                    <button
                        onClick={() => setActiveTab("visibility")}
                        className={cn(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === "visibility"
                                ? "bg-rp-foam/20 text-rp-foam border-rp-foam/30 border"
                                : "text-rp-subtle hover:text-rp-text"
                        )}
                    >
                        <IconEye size={16} className="mr-2 inline" />
                        Visibility
                    </button>
                </div>

                {/* Search & Actions */}
                <div className="flex w-full gap-3 md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <IconSearch size={18} className="text-rp-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search souls..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-rp-base border-rp-muted/20 text-rp-text placeholder:text-rp-muted focus:border-rp-iris w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={exportPersonas}
                        className="text-rp-muted hover:text-rp-text p-2 transition-colors"
                        title="Export Data"
                    >
                        <IconDownload size={20} />
                    </button>
                    <button
                        onClick={fetchPersonas}
                        className="text-rp-muted hover:text-rp-text p-2 transition-colors"
                        title="Refresh"
                    >
                        <IconRefresh size={20} />
                    </button>
                </div>
            </div>

            {/* Pending Changes Banner */}
            {pendingChanges.size > 0 && (
                <div className="bg-rp-iris/10 border-rp-iris/30 flex items-center justify-between rounded-xl border px-4 py-3">
                    <span className="text-rp-iris text-sm font-medium">
                        {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setPendingChanges(new Map())
                                fetchPersonas()
                            }}
                            className="text-rp-subtle hover:text-rp-text px-3 py-1 text-sm transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="bg-rp-iris text-rp-base flex items-center gap-2 rounded-lg px-4 py-1 text-sm transition-colors hover:opacity-90 disabled:opacity-50"
                        >
                            {saving ? (
                                <IconLoader2 size={14} className="animate-spin" />
                            ) : (
                                <IconCheck size={14} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Personas Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredPersonas.map((persona) => (
                    <PersonaCard
                        key={persona.id}
                        persona={persona}
                        activeTab={activeTab}
                        onToggleFeatured={() => toggleFeatured(persona)}
                        onTogglePremium={() => togglePremium(persona)}
                        onToggleVisibility={() => toggleVisibility(persona)}
                        onDelete={() => deletePersona(persona)}
                        onUploadImage={(file) => handleImageUpload(persona.id, file)}
                        uploadingImage={uploadingImage}
                    />
                ))}
            </div>

            {filteredPersonas.length === 0 && (
                <div className="text-rp-muted py-12 text-center">
                    No souls found matching your search.
                </div>
            )}
        </div>
    )
}

// Separate PersonaCard component for better organization
function PersonaCard({
    persona,
    activeTab,
    onToggleFeatured,
    onTogglePremium,
    onToggleVisibility,
    onDelete,
    onUploadImage,
    uploadingImage
}: {
    persona: Persona
    activeTab: TabType
    onToggleFeatured: () => void
    onTogglePremium: () => void
    onToggleVisibility: () => void
    onDelete: () => void
    onUploadImage: (file: File) => void
    uploadingImage: boolean
}) {
    const [showActions, setShowActions] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onUploadImage(file)
        }
    }

    const isHighlighted =
        (activeTab === "featured" && persona.is_featured) ||
        (activeTab === "premium" && persona.is_premium) ||
        (activeTab === "visibility" && persona.visibility === "PUBLIC")

    return (
        <div
            className={cn(
                "bg-rp-surface relative overflow-hidden rounded-xl border transition-all group",
                isHighlighted
                    ? "border-rp-gold/50 ring-rp-gold/20 ring-1"
                    : "border-rp-muted/20"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Image */}
            <div className="bg-rp-base relative aspect-[3/4]">
                {persona.image_url ? (
                    <Image
                        src={persona.image_url}
                        alt={persona.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="text-rp-muted flex size-full items-center justify-center text-3xl font-bold">
                        {persona.name.slice(0, 2).toUpperCase()}
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="from-rp-base/80 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

                {/* Action Buttons (shown on hover) */}
                {showActions && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="bg-rp-iris text-white p-2 rounded-lg hover:bg-rp-iris/80 transition-colors"
                            title="Upload Image"
                        >
                            {uploadingImage ? (
                                <IconLoader2 size={18} className="animate-spin" />
                            ) : (
                                <IconUpload size={18} />
                            )}
                        </button>
                        <button
                            onClick={onDelete}
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                            title="Delete"
                        >
                            <IconTrash size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="font-tiempos-headline text-rp-text truncate text-sm font-medium">
                    {persona.name}
                </h3>
                <p className="text-rp-muted truncate text-xs">
                    {persona.visibility === "PUBLIC" ? "Public" : "Private"}
                    {persona.is_premium && " • Premium"}
                </p>
            </div>

            {/* Toggle Buttons */}
            <div className="absolute right-2 top-2 flex flex-col gap-1">
                {activeTab === "featured" && (
                    <button
                        onClick={onToggleFeatured}
                        className={cn(
                            "rounded-lg p-2 transition-all",
                            persona.is_featured
                                ? "bg-rp-gold text-rp-base shadow-rp-gold/20 shadow-lg"
                                : "bg-rp-base/50 text-rp-text/50 hover:text-rp-gold"
                        )}
                        title="Toggle Featured"
                    >
                        {persona.is_featured ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                    </button>
                )}
                {activeTab === "premium" && (
                    <button
                        onClick={onTogglePremium}
                        className={cn(
                            "rounded-lg p-2 transition-all",
                            persona.is_premium
                                ? "bg-purple-500 text-white shadow-purple-500/20 shadow-lg"
                                : "bg-rp-base/50 text-rp-text/50 hover:text-purple-400"
                        )}
                        title="Toggle Premium"
                    >
                        <IconStar size={18} />
                    </button>
                )}
                {activeTab === "visibility" && (
                    <button
                        onClick={onToggleVisibility}
                        className={cn(
                            "rounded-lg p-2 transition-all",
                            persona.visibility === "PUBLIC"
                                ? "bg-rp-foam text-rp-base shadow-rp-foam/20 shadow-lg"
                                : "bg-rp-base/50 text-rp-text/50 hover:text-rp-foam"
                        )}
                        title="Toggle Visibility"
                    >
                        {persona.visibility === "PUBLIC" ? <IconEye size={18} /> : <IconEyeOff size={18} />}
                    </button>
                )}
            </div>
        </div>
    )
}
