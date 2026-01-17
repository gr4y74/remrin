"use client"

import { useState, useEffect, useMemo } from "react"
import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconLoader2,
    IconCheck,
    IconX,
    IconGripVertical,
    IconEye,
    IconEyeOff,
    IconMoodSmile
} from "@tabler/icons-react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ContentSection {
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    color: string | null
    age_rating: 'everyone' | 'kids' | 'teen' | 'mature'
    sort_order: number
    is_active: boolean
    persona_count?: number
    created_at: string
    updated_at: string
}

type AgeRating = 'everyone' | 'kids' | 'teen' | 'mature'

const AGE_RATING_LABELS: Record<AgeRating, string> = {
    everyone: 'Everyone',
    kids: 'Kids (0-12)',
    teen: 'Teen (13-17)',
    mature: 'Mature (18+)'
}

const AGE_RATING_COLORS: Record<AgeRating, string> = {
    everyone: 'text-green-400 bg-green-400/20 border-green-400/30',
    kids: 'text-blue-400 bg-blue-400/20 border-blue-400/30',
    teen: 'text-purple-400 bg-purple-400/20 border-purple-400/30',
    mature: 'text-red-400 bg-red-400/20 border-red-400/30'
}

export function ContentSectionsManager() {
    const [sections, setSections] = useState<ContentSection[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const fetchSections = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/content-sections")
            const data = await response.json()
            if (data.sections) {
                setSections(data.sections)
            }
        } catch (error) {
            toast.error("Failed to load content sections")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSections()
    }, [])

    const handleDelete = async (section: ContentSection) => {
        if (!confirm(`Delete "${section.name}"? This will remove all persona assignments.`)) return

        try {
            const response = await fetch(`/api/admin/content-sections?id=${section.id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                toast.success("Section deleted")
                setSections(prev => prev.filter(s => s.id !== section.id))
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to delete section")
            }
        } catch (error) {
            toast.error("Error deleting section")
        }
    }

    const handleToggleActive = async (section: ContentSection) => {
        try {
            const response = await fetch("/api/admin/content-sections", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: section.id,
                    is_active: !section.is_active
                })
            })

            if (response.ok) {
                toast.success(section.is_active ? "Section hidden" : "Section activated")
                setSections(prev => prev.map(s =>
                    s.id === section.id ? { ...s, is_active: !s.is_active } : s
                ))
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to update section")
            }
        } catch (error) {
            toast.error("Error updating section")
        }
    }

    const stats = useMemo(() => ({
        total: sections.length,
        active: sections.filter(s => s.is_active).length,
        totalPersonas: sections.reduce((sum, s) => sum + (s.persona_count || 0), 0)
    }), [sections])

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <IconLoader2 className="animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Sections", val: stats.total, color: "text-rp-text" },
                    { label: "Active", val: stats.active, color: "text-rp-foam" },
                    { label: "Total Personas", val: stats.totalPersonas, color: "text-rp-iris" }
                ].map((s, i) => (
                    <div key={i} className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 text-center">
                        <div className={cn("text-2xl font-bold", s.color)}>{s.val}</div>
                        <div className="text-rp-muted text-sm">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-rp-text">Content Sections</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-rp-iris text-white flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90"
                >
                    <IconPlus size={16} />
                    Create Section
                </button>
            </div>

            {/* Sections List */}
            <div className="space-y-3">
                {sections.map(section => (
                    <div
                        key={section.id}
                        className="bg-rp-surface border-rp-muted/20 group flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-rp-iris/30"
                    >
                        {/* Drag Handle */}
                        <div className="text-rp-muted cursor-grab">
                            <IconGripVertical size={20} />
                        </div>

                        {/* Icon */}
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg text-2xl"
                            style={{ backgroundColor: section.color + '20' || '#6366f120' }}>
                            {section.icon || '📁'}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-rp-text">{section.name}</h4>
                                <span className={cn(
                                    "rounded-full border px-2 py-0.5 text-xs font-medium",
                                    AGE_RATING_COLORS[section.age_rating]
                                )}>
                                    {AGE_RATING_LABELS[section.age_rating]}
                                </span>
                                {!section.is_active && (
                                    <span className="bg-rp-muted/20 text-rp-muted rounded-full px-2 py-0.5 text-xs">
                                        Hidden
                                    </span>
                                )}
                            </div>
                            <p className="text-rp-muted text-sm">{section.description || 'No description'}</p>
                            <div className="text-rp-subtle mt-1 text-xs">
                                {section.persona_count || 0} persona(s) • Order: {section.sort_order}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                onClick={() => handleToggleActive(section)}
                                className="text-rp-muted hover:text-rp-text p-2"
                                title={section.is_active ? "Hide section" : "Show section"}
                            >
                                {section.is_active ? <IconEye size={18} /> : <IconEyeOff size={18} />}
                            </button>
                            <button
                                onClick={() => setEditingId(section.id)}
                                className="text-rp-muted hover:text-rp-iris p-2"
                            >
                                <IconEdit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(section)}
                                className="text-rp-muted hover:text-red-400 p-2"
                            >
                                <IconTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {sections.length === 0 && (
                    <div className="bg-rp-surface border-rp-muted/20 rounded-xl border p-8 text-center">
                        <p className="text-rp-muted">No content sections yet. Create one to get started!</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingId) && (
                <SectionModal
                    section={editingId ? sections.find(s => s.id === editingId) : undefined}
                    onClose={() => {
                        setShowCreateModal(false)
                        setEditingId(null)
                    }}
                    onSave={() => {
                        fetchSections()
                        setShowCreateModal(false)
                        setEditingId(null)
                    }}
                />
            )}
        </div>
    )
}

interface SectionModalProps {
    section?: ContentSection
    onClose: () => void
    onSave: () => void
}

function SectionModal({ section, onClose, onSave }: SectionModalProps) {
    const [form, setForm] = useState({
        name: section?.name || "",
        slug: section?.slug || "",
        description: section?.description || "",
        icon: section?.icon || "",
        color: section?.color || "#6366f1",
        age_rating: section?.age_rating || 'everyone' as AgeRating,
        sort_order: section?.sort_order ?? 0,
        is_active: section?.is_active ?? true
    })
    const [saving, setSaving] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const handleSubmit = async () => {
        if (!form.name || !form.slug) {
            toast.error("Name and slug are required")
            return
        }

        setSaving(true)
        try {
            const method = section ? "PATCH" : "POST"
            const body = section
                ? { id: section.id, ...form }
                : form

            const response = await fetch("/api/admin/content-sections", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(data.message || "Section saved")
                onSave()
            } else {
                toast.error(data.error || "Failed to save section")
            }
        } catch (error) {
            toast.error("Error saving section")
        } finally {
            setSaving(false)
        }
    }

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        setForm(prev => ({
            ...prev,
            name,
            slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        }))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-rp-surface border-rp-highlight-med w-full max-w-2xl rounded-xl border p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-rp-text">
                        {section ? "Edit Section" : "Create Section"}
                    </h3>
                    <button onClick={onClose} className="text-rp-muted hover:text-rp-text">
                        <IconX size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-rp-text mb-1 block text-sm font-medium">Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => handleNameChange(e.target.value)}
                            className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border p-2 focus:border-rp-iris focus:outline-none"
                            placeholder="e.g., Kids, Gaming, Education"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="text-rp-text mb-1 block text-sm font-medium">Slug *</label>
                        <input
                            type="text"
                            value={form.slug}
                            onChange={e => setForm({ ...form, slug: e.target.value })}
                            className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border p-2 focus:border-rp-iris focus:outline-none"
                            placeholder="e.g., kids, gaming, education"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-rp-text mb-1 block text-sm font-medium">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border p-2 focus:border-rp-iris focus:outline-none"
                            rows={2}
                            placeholder="Brief description for this section"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="text-rp-text mb-1 block text-sm font-medium">Icon (Emoji)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={form.icon}
                                    onChange={e => setForm({ ...form, icon: e.target.value })}
                                    className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border p-2 focus:border-rp-iris focus:outline-none"
                                    placeholder="🧒"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="bg-rp-base border-rp-muted/20 hover:border-rp-iris flex items-center justify-center rounded-lg border px-3 transition-colors"
                                >
                                    <IconMoodSmile size={20} className="text-rp-subtle" />
                                </button>
                            </div>

                            {showEmojiPicker && (
                                <div className="absolute bottom-full right-0 z-[60] mb-2">
                                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                                    <div className="relative">
                                        <EmojiPicker
                                            theme={Theme.DARK}
                                            onEmojiClick={(emojiData) => {
                                                setForm({ ...form, icon: emojiData.emoji })
                                                setShowEmojiPicker(false)
                                            }}
                                            lazyLoadEmojis={true}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-rp-text mb-1 block text-sm font-medium">Color</label>
                            <input
                                type="color"
                                value={form.color}
                                onChange={e => setForm({ ...form, color: e.target.value })}
                                className="bg-rp-base border-rp-muted/20 h-10 w-full rounded-lg border p-1"
                            />
                        </div>
                    </div>

                    {/* Age Rating */}
                    <div>
                        <label className="text-rp-text mb-1 block text-sm font-medium">Age Rating</label>
                        <select
                            value={form.age_rating}
                            onChange={e => setForm({ ...form, age_rating: e.target.value as AgeRating })}
                            className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border p-2 focus:border-rp-iris focus:outline-none"
                        >
                            {Object.entries(AGE_RATING_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Order & Active */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-rp-text mb-1 block text-sm font-medium">Sort Order</label>
                            <input
                                type="number"
                                value={form.sort_order}
                                onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                className="bg-rp-base border-rp-muted/20 text-rp-text w-full rounded-lg border p-2 focus:border-rp-iris focus:outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="size-4"
                                />
                                <span className="text-rp-text text-sm">Active (visible on site)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="text-rp-muted hover:text-rp-text px-4 py-2 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-rp-iris text-white flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? <IconLoader2 className="animate-spin" size={14} /> : <IconCheck size={14} />}
                        {section ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </div>
    )
}
