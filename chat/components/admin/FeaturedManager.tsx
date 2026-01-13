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

interface Stats {
    total_chats: number
    followers_count: number
    trending_score: number
}

interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    visibility: string
    is_featured: boolean
    category?: string
    created_at: string
    tags?: string[]
    persona_stats?: Stats
}

type TabType = "featured" | "visibility" | "trending"

export function FeaturedManager() {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<TabType>("featured")

    // Store partial updates
    const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<Persona> & { stats?: Partial<Stats> }>>(new Map())

    // Edit Modal State
    const [editingId, setEditingId] = useState<string | null>(null)

    // Image Upload State
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

    // Filter personas
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
        public: personas.filter(p => p.visibility === "PUBLIC").length,
        private: personas.filter(p => p.visibility === "PRIVATE").length
    }), [personas])

    // Helper to buffer updates
    const updatePersona = (id: string, updates: Partial<Persona> & { stats?: Partial<Stats> }) => {
        setPersonas(prev => prev.map(p =>
            p.id === id ? { ...p, ...updates, persona_stats: { ...p.persona_stats, ...updates.stats } as Stats } : p
        ))

        setPendingChanges(prev => {
            const current = prev.get(id) || {}
            const newStats = { ...current.stats, ...updates.stats }
            const updated = new Map(prev)
            updated.set(id, { ...current, ...updates, stats: newStats })
            return updated
        })
    }

    // Toggle actions
    const toggleFeatured = (p: Persona) => updatePersona(p.id, { is_featured: !p.is_featured })
    const toggleVisibility = (p: Persona) => updatePersona(p.id, { visibility: p.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC" })

    // Save changes
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

    // Delete
    const deletePersona = async (persona: Persona) => {
        if (!confirm(`Are you sure you want to delete "${persona.name}"?`)) return
        try {
            const response = await fetch(`/api/admin/personas?id=${persona.id}`, { method: "DELETE" })
            if (response.ok) {
                toast.success("Persona deleted")
                setPersonas(prev => prev.filter(p => p.id !== persona.id))
            } else {
                const data = await response.json()
                toast.error(data.error)
            }
        } catch (e) { toast.error("Error deleting") }
    }

    // Image Upload handler
    const performImageUpload = async (personaId: string, file: File) => {
        setUploadingImage(true)
        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${personaId}-${Date.now()}.${fileExt}`
            const filePath = `${personaId}/${fileName}`

            await supabase.storage.from('soul_portraits').upload(filePath, file, { upsert: true })
            const { data } = supabase.storage.from('soul_portraits').getPublicUrl(filePath)

            // Update DB immediately for image
            await supabase.from('personas').update({ image_url: data.publicUrl }).eq('id', personaId)

            setPersonas(prev => prev.map(p => p.id === personaId ? { ...p, image_url: data.publicUrl } : p))
            toast.success("Image uploaded")
        } catch (e) {
            console.error(e)
            toast.error("Upload failed")
        } finally {
            setUploadingImage(false)
        }
    }

    // Export function
    const exportPersonas = () => {
        const dataStr = JSON.stringify(personas, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `personas.json`
        link.click()
    }

    // Save Handler for Edit Modal
    const handleSaveEdit = (updates: Partial<Persona> & { stats?: Partial<Stats> }) => {
        if (editingId) {
            updatePersona(editingId, updates)
            setEditingId(null)
        }
    }

    // Get currently being edited persona
    const editingPersona = useMemo(() =>
        personas.find(p => p.id === editingId) || null
        , [personas, editingId])

    if (loading) return <div className="flex justify-center p-20"><IconLoader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    { label: "Total Souls", val: stats.total, color: "text-rp-text" },
                    { label: "Featured", val: stats.featured, color: "text-rp-gold" },
                    { label: "Public", val: stats.public, color: "text-rp-foam" },
                    { label: "Private", val: stats.private, color: "text-rp-subtle" },
                ].map((s, i) => (
                    <div key={i} className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                        <div className={cn("text-2xl font-bold", s.color)}>{s.val}</div>
                        <div className="text-rp-muted text-sm">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: "featured", icon: IconStarFilled, label: "Featured", color: "text-rp-gold border-rp-gold/30 bg-rp-gold/20" },
                        { id: "visibility", icon: IconEye, label: "Visibility", color: "text-rp-foam border-rp-foam/30 bg-rp-foam/20" },
                    ].map((tab: any) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "rounded-lg px-4 py-2 text-sm font-medium transition-colors border flex items-center gap-2",
                                activeTab === tab.id ? tab.color : "border-transparent text-rp-subtle hover:text-rp-text"
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex w-full gap-3 md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <IconSearch size={18} className="text-rp-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:border-rp-iris"
                        />
                    </div>
                    <button onClick={exportPersonas} className="p-2 text-rp-muted hover:text-rp-text"><IconDownload size={20} /></button>
                    <button onClick={fetchPersonas} className="p-2 text-rp-muted hover:text-rp-text"><IconRefresh size={20} /></button>
                </div>
            </div>

            {/* Pending Changes */}
            {pendingChanges.size > 0 && (
                <div className="bg-rp-iris/10 border-rp-iris/30 flex items-center justify-between rounded-xl border px-4 py-3">
                    <span className="text-rp-iris text-sm font-medium">{pendingChanges.size} unsaved changes</span>
                    <div className="flex gap-2">
                        <button onClick={() => { setPendingChanges(new Map()); fetchPersonas() }} className="text-rp-subtle hover:text-rp-text px-3 py-1 text-sm">Discard</button>
                        <button onClick={saveChanges} disabled={saving} className="bg-rp-iris text-rp-base flex items-center gap-2 rounded-lg px-4 py-1 text-sm hover:opacity-90">
                            {saving ? <IconLoader2 className="animate-spin" size={14} /> : <IconCheck size={14} />} Save
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredPersonas.map(persona => (
                    <PersonaCard
                        key={persona.id}
                        persona={persona}
                        activeTab={activeTab}
                        onToggleFeatured={() => toggleFeatured(persona)}
                        onToggleVisibility={() => toggleVisibility(persona)}
                        onDelete={() => deletePersona(persona)}
                        onUploadImage={(f: File) => performImageUpload(persona.id, f)}
                        uploadingImage={uploadingImage}
                        onEdit={() => setEditingId(persona.id)}
                    />
                ))}
            </div>

            {/* Edit Modal */}
            {editingPersona && (
                <EditPersonaModal
                    persona={editingPersona}
                    onClose={() => setEditingId(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    )
}

function PersonaCard({ persona, activeTab, onToggleFeatured, onToggleVisibility, onDelete, onUploadImage, uploadingImage, onEdit }: any) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [hover, setHover] = useState(false)

    // Highlight logic
    const isHighlighted = (activeTab === "featured" && persona.is_featured)

    return (
        <div
            className={cn("bg-rp-surface relative overflow-hidden rounded-xl border transition-all group", isHighlighted ? "border-rp-gold/50 ring-1 ring-rp-gold/20" : "border-rp-muted/20")}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div className="bg-rp-base relative aspect-[3/4]">
                {persona.image_url ? (
                    <Image src={persona.image_url} alt={persona.name} fill className="object-cover" />
                ) : <div className="flex h-full items-center justify-center bg-zinc-900 text-2xl font-bold">{persona.name.substring(0, 2)}</div>}

                {hover && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 animate-in fade-in">
                        <button onClick={onEdit} className="p-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"><IconEdit size={16} /></button>
                        <button onClick={() => fileRef.current?.click()} className="p-2 bg-rp-iris rounded-lg text-white hover:bg-rp-iris/80"><IconUpload size={16} /></button>
                        <button onClick={onDelete} className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"><IconTrash size={16} /></button>
                        <input type="file" ref={fileRef} className="hidden" onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} accept="image/*" />
                    </div>
                )}
                {/* Status Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {activeTab === 'featured' && (
                        <button onClick={onToggleFeatured} className={cn("p-1.5 rounded-md", persona.is_featured ? "bg-rp-gold text-black shadow-lg shadow-rp-gold/20" : "bg-black/50 text-white/50 hover:text-white")}>
                            {persona.is_featured ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                        </button>
                    )}
                    {!persona.is_featured && activeTab === 'featured' && persona.visibility === 'PRIVATE' && <div className="bg-black/50 text-rp-subtle p-1 rounded text-[10px]">PVT</div>}
                </div>
            </div>
            <div className="p-3">
                <div className="font-bold text-sm truncate">{persona.name}</div>
                <div className="text-xs text-rp-muted flex gap-2">
                    <span>{persona.persona_stats?.total_chats || 0} Chats</span>
                    <span>{persona.persona_stats?.followers_count || 0} Follows</span>
                </div>
            </div>
        </div>
    )
}

function EditPersonaModal({ persona, onClose, onSave }: { persona: Persona, onClose: () => void, onSave: (u: any) => void }) {
    const [form, setForm] = useState({
        description: persona.description || "",
        tags: (persona.tags || []).join(", "),
        total_chats: persona.persona_stats?.total_chats || 0,
        followers_count: persona.persona_stats?.followers_count || 0,
        trending_score: persona.persona_stats?.trending_score || 0
    })

    const handleSave = () => {
        onSave({
            description: form.description,
            tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
            stats: {
                total_chats: Number(form.total_chats),
                followers_count: Number(form.followers_count),
                trending_score: Number(form.trending_score)
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-rp-surface border-rp-highlight-med w-full max-w-lg rounded-xl border p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Edit {persona.name}</h3>
                    <button onClick={onClose}><IconX /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-rp-subtle mb-1 block">Description (Bio)</label>
                        <textarea
                            className="bg-rp-base w-full rounded-lg border border-rp-muted/20 p-2 text-sm focus:border-rp-iris outline-none"
                            rows={3}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-rp-subtle mb-1 block">Tags (comma separated)</label>
                        <input
                            className="bg-rp-base w-full rounded-lg border border-rp-muted/20 p-2 text-sm focus:border-rp-iris outline-none"
                            value={form.tags}
                            placeholder="e.g. Funny, Creative, Helper"
                            onChange={e => setForm({ ...form, tags: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-rp-subtle mb-1 block">Total Chats</label>
                            <input
                                type="number"
                                className="bg-rp-base w-full rounded-lg border border-rp-muted/20 p-2 text-sm"
                                value={form.total_chats}
                                onChange={e => setForm({ ...form, total_chats: e.target.value as any })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-rp-subtle mb-1 block">Followers</label>
                            <input
                                type="number"
                                className="bg-rp-base w-full rounded-lg border border-rp-muted/20 p-2 text-sm"
                                value={form.followers_count}
                                onChange={e => setForm({ ...form, followers_count: e.target.value as any })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-rp-subtle mb-1 block">Creativity (Score)</label>
                            <input
                                type="number"
                                className="bg-rp-base w-full rounded-lg border border-rp-muted/20 p-2 text-sm"
                                value={form.trending_score}
                                onChange={e => setForm({ ...form, trending_score: e.target.value as any })}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-rp-subtle hover:text-white">Cancel</button>
                    <button onClick={handleSave} className="bg-rp-iris text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rp-iris/90">Apply Changes</button>
                </div>
            </div>
        </div>
    )
}
