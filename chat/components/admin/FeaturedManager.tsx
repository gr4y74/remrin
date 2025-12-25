"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import {
    IconSearch,
    IconStar,
    IconStarFilled,
    IconEye,
    IconEyeOff,
    IconLoader2,
    IconCheck,
    IconRefresh
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    visibility: string
    is_featured: boolean
    created_at: string
}

type TabType = "featured" | "visibility"

export function FeaturedManager() {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<TabType>("featured")
    const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<Persona>>>(new Map())

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
        public: personas.filter(p => p.visibility === "PUBLIC").length,
        private: personas.filter(p => p.visibility === "PRIVATE").length
    }), [personas])

    // Toggle featured status
    const toggleFeatured = (persona: Persona) => {
        const newValue = !persona.is_featured

        // Update local state
        setPersonas(prev => prev.map(p =>
            p.id === persona.id ? { ...p, is_featured: newValue } : p
        ))

        // Track pending change
        setPendingChanges(prev => {
            const updated = new Map(prev)
            updated.set(persona.id, {
                ...updated.get(persona.id),
                is_featured: newValue
            })
            return updated
        })
    }

    // Toggle visibility
    const toggleVisibility = (persona: Persona) => {
        const newValue = persona.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"

        // Update local state
        setPersonas(prev => prev.map(p =>
            p.id === persona.id ? { ...p, visibility: newValue } : p
        ))

        // Track pending change
        setPendingChanges(prev => {
            const updated = new Map(prev)
            updated.set(persona.id, {
                ...updated.get(persona.id),
                visibility: newValue
            })
            return updated
        })
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
                <IconLoader2 className="w-8 h-8 animate-spin text-rp-iris" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-rp-surface border border-rp-muted/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-rp-text">{stats.total}</div>
                    <div className="text-sm text-rp-muted">Total Souls</div>
                </div>
                <div className="bg-rp-surface border border-rp-muted/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-rp-gold">{stats.featured}</div>
                    <div className="text-sm text-rp-muted">Featured</div>
                </div>
                <div className="bg-rp-surface border border-rp-muted/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-rp-foam">{stats.public}</div>
                    <div className="text-sm text-rp-muted">Public</div>
                </div>
                <div className="bg-rp-surface border border-rp-muted/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-rp-subtle">{stats.private}</div>
                    <div className="text-sm text-rp-muted">Private</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("featured")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === "featured"
                                ? "bg-rp-gold/20 text-rp-gold border border-rp-gold/30"
                                : "text-rp-subtle hover:text-rp-text"
                        )}
                    >
                        <IconStarFilled size={16} className="inline mr-2" />
                        Hero Carousel
                    </button>
                    <button
                        onClick={() => setActiveTab("visibility")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === "visibility"
                                ? "bg-rp-foam/20 text-rp-foam border border-rp-foam/30"
                                : "text-rp-subtle hover:text-rp-text"
                        )}
                    >
                        <IconEye size={16} className="inline mr-2" />
                        Gallery Visibility
                    </button>
                </div>

                {/* Search & Actions */}
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted" />
                        <input
                            type="text"
                            placeholder="Search souls..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-rp-base border border-rp-muted/20 rounded-lg text-rp-text placeholder:text-rp-muted focus:outline-none focus:border-rp-iris"
                        />
                    </div>
                    <button
                        onClick={fetchPersonas}
                        className="p-2 text-rp-muted hover:text-rp-text transition-colors"
                        title="Refresh"
                    >
                        <IconRefresh size={20} />
                    </button>
                </div>
            </div>

            {/* Pending Changes Banner */}
            {pendingChanges.size > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-rp-iris/10 border border-rp-iris/30 rounded-xl">
                    <span className="text-rp-iris text-sm font-medium">
                        {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setPendingChanges(new Map())
                                fetchPersonas()
                            }}
                            className="px-3 py-1 text-sm text-rp-subtle hover:text-rp-text transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="px-4 py-1 text-sm bg-rp-iris text-rp-base rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredPersonas.map((persona) => (
                    <div
                        key={persona.id}
                        className={cn(
                            "relative bg-rp-surface border rounded-xl overflow-hidden transition-all",
                            activeTab === "featured" && persona.is_featured
                                ? "border-rp-gold/50 ring-1 ring-rp-gold/20"
                                : activeTab === "visibility" && persona.visibility === "PUBLIC"
                                    ? "border-rp-foam/50 ring-1 ring-rp-foam/20"
                                    : "border-rp-muted/20"
                        )}
                    >
                        {/* Image */}
                        <div className="relative aspect-[3/4] bg-rp-base">
                            {persona.image_url ? (
                                <Image
                                    src={persona.image_url}
                                    alt={persona.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-rp-muted">
                                    {persona.name.slice(0, 2).toUpperCase()}
                                </div>
                            )}

                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-rp-base/80 via-transparent to-transparent" />
                        </div>

                        {/* Info */}
                        <div className="p-3">
                            <h3 className="font-medium text-rp-text text-sm truncate">
                                {persona.name}
                            </h3>
                            <p className="text-xs text-rp-muted truncate">
                                {persona.visibility === "PUBLIC" ? "Public" : "Private"}
                            </p>
                        </div>

                        {/* Toggle Button */}
                        <button
                            onClick={() => activeTab === "featured"
                                ? toggleFeatured(persona)
                                : toggleVisibility(persona)
                            }
                            className={cn(
                                "absolute top-2 right-2 p-2 rounded-lg transition-all",
                                activeTab === "featured"
                                    ? persona.is_featured
                                        ? "bg-rp-gold text-rp-base shadow-lg shadow-rp-gold/20"
                                        : "bg-rp-base/50 text-rp-text/50 hover:text-rp-gold"
                                    : persona.visibility === "PUBLIC"
                                        ? "bg-rp-foam text-rp-base shadow-lg shadow-rp-foam/20"
                                        : "bg-rp-base/50 text-rp-text/50 hover:text-rp-foam"
                            )}
                        >
                            {activeTab === "featured" ? (
                                persona.is_featured ? <IconStarFilled size={18} /> : <IconStar size={18} />
                            ) : (
                                persona.visibility === "PUBLIC" ? <IconEye size={18} /> : <IconEyeOff size={18} />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {filteredPersonas.length === 0 && (
                <div className="text-center py-12 text-rp-muted">
                    No souls found matching your search.
                </div>
            )}
        </div>
    )
}
