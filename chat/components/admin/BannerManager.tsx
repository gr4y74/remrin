"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
    IconPlus,
    IconTrash,
    IconEdit,
    IconArrowUp,
    IconArrowDown,
    IconLoader2,
    IconX,
    IconCheck,
    IconPhoto
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface Banner {
    id: string
    title: string
    image_url: string
    link_url: string | null
    sort_order: number
    is_active: boolean
    created_at: string
}

export function BannerManager() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({})
    const [uploading, setUploading] = useState(false)

    const supabase = createClient()

    const fetchBanners = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/banners")
            const data = await response.json()
            if (data.banners) {
                setBanners(data.banners)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load banners")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBanners()
    }, [])

    const handleSave = async () => {
        if (!currentBanner.title || !currentBanner.image_url) {
            toast.error("Title and Image are required")
            return
        }

        try {
            const bannerData = {
                title: currentBanner.title,
                image_url: currentBanner.image_url,
                link_url: currentBanner.link_url || null,
                is_active: currentBanner.is_active ?? true,
            }

            let response
            if (currentBanner.id) {
                response = await fetch("/api/admin/banners", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: currentBanner.id, updates: bannerData })
                })
            } else {
                response = await fetch("/api/admin/banners", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bannerData)
                })
            }

            if (!response.ok) throw new Error("Failed to save")

            toast.success(currentBanner.id ? "Banner updated" : "Banner created")
            setIsEditing(false)
            setCurrentBanner({})
            fetchBanners()
        } catch (error) {
            console.error(error)
            toast.error("Failed to save banner")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return

        try {
            const response = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" })
            if (!response.ok) throw new Error("Failed to delete")

            toast.success("Banner deleted")
            fetchBanners()
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete banner")
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `banner-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // Storage still uses client directly - verified allowed for authenticated users
            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('banners')
                .getPublicUrl(filePath)

            setCurrentBanner(prev => ({ ...prev, image_url: data.publicUrl }))
            toast.success("Image uploaded")
        } catch (error) {
            console.error(error)
            toast.error("Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        const index = banners.findIndex(b => b.id === id)
        if (index === -1) return
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === banners.length - 1) return

        const newBanners = [...banners]
        const swapIndex = direction === 'up' ? index - 1 : index + 1

        // Swap sort_order
        const tempOrder = newBanners[index].sort_order
        newBanners[index].sort_order = newBanners[swapIndex].sort_order
        newBanners[swapIndex].sort_order = tempOrder

        // Swap in array
        const temp = newBanners[index]
        newBanners[index] = newBanners[swapIndex]
        newBanners[swapIndex] = temp

        setBanners(newBanners)

        // Optimistic UI, then save via API
        try {
            await Promise.all([
                fetch("/api/admin/banners", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: newBanners[index].id, updates: { sort_order: newBanners[index].sort_order } })
                }),
                fetch("/api/admin/banners", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: newBanners[swapIndex].id, updates: { sort_order: newBanners[swapIndex].sort_order } })
                })
            ])
        } catch (error) {
            toast.error("Failed to reorder")
            fetchBanners() // Revert
        }
    }


    if (loading) return <div className="flex justify-center p-8"><IconLoader2 className="animate-spin text-rp-subtle" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Discovery Banners</h3>
                    <p className="text-rp-subtle text-sm">Manage the rotating banners on the discovery page.</p>
                </div>
                <button
                    onClick={() => { setCurrentBanner({}); setIsEditing(true) }}
                    className="flex items-center gap-2 bg-rp-iris text-white px-4 py-2 rounded-lg hover:bg-rp-iris/90"
                >
                    <IconPlus size={18} />
                    Add Banner
                </button>
            </div>

            <div className="space-y-3">
                {banners.map((banner, index) => (
                    <div key={banner.id} className="bg-rp-surface border-rp-muted/20 border rounded-xl p-4 flex items-center gap-4">
                        <div className="relative h-16 w-32 shrink-0 overflow-hidden rounded-lg bg-rp-base">
                            <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{banner.title}</h4>
                            <div className="text-xs text-rp-subtle truncate">{banner.link_url || "No link"}</div>
                        </div>

                        <div className="flex items-center gap-2 text-rp-subtle">
                            <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${banner.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {banner.is_active ? 'Active' : 'Hidden'}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button onClick={() => handleReorder(banner.id, 'up')} disabled={index === 0} className="p-1.5 hover:bg-rp-base rounded disabled:opacity-30"><IconArrowUp size={16} /></button>
                            <button onClick={() => handleReorder(banner.id, 'down')} disabled={index === banners.length - 1} className="p-1.5 hover:bg-rp-base rounded disabled:opacity-30"><IconArrowDown size={16} /></button>
                        </div>

                        <div className="flex items-center gap-2 pl-4 border-l border-rp-muted/20">
                            <button
                                onClick={() => { setCurrentBanner(banner); setIsEditing(true) }}
                                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"
                            >
                                <IconEdit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(banner.id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                            >
                                <IconTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {banners.length === 0 && (
                    <div className="text-center py-10 text-rp-subtle border border-dashed border-rp-muted/20 rounded-xl">
                        No banners found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-rp-surface border-rp-highlight-med w-full max-w-lg rounded-xl border p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">{currentBanner.id ? 'Edit Banner' : 'New Banner'}</h3>
                            <button onClick={() => setIsEditing(false)}><IconX /></button>
                        </div>

                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="text-sm font-medium block mb-2">Banner Image</label>
                                <div className="relative aspect-[3/1] bg-rp-base rounded-lg border-2 border-dashed border-rp-muted/20 flex flex-col items-center justify-center overflow-hidden hover:border-rp-iris/50 transition-colors group cursor-pointer">
                                    {currentBanner.image_url ? (
                                        <Image src={currentBanner.image_url} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="text-rp-subtle flex flex-col items-center">
                                            <IconPhoto size={32} className="mb-2 opacity-50" />
                                            <span className="text-xs">Click to upload</span>
                                        </div>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                                    {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><IconLoader2 className="animate-spin text-white" /></div>}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Title</label>
                                <input
                                    className="w-full bg-rp-base border border-rp-muted/20 rounded-lg p-2.5 focus:border-rp-iris outline-none"
                                    placeholder="e.g. Summer Sale"
                                    value={currentBanner.title || ''}
                                    onChange={e => setCurrentBanner(p => ({ ...p, title: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-1">Link URL (Optional)</label>
                                <input
                                    className="w-full bg-rp-base border border-rp-muted/20 rounded-lg p-2.5 focus:border-rp-iris outline-none"
                                    placeholder="https://..."
                                    value={currentBanner.link_url || ''}
                                    onChange={e => setCurrentBanner(p => ({ ...p, link_url: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={currentBanner.is_active ?? true}
                                    onChange={e => setCurrentBanner(p => ({ ...p, is_active: e.target.checked }))}
                                    className="rounded border-rp-muted/20 bg-rp-base text-rp-iris focus:ring-rp-iris"
                                />
                                <label htmlFor="is_active" className="text-sm">Active</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-rp-subtle hover:text-rp-text">Cancel</button>
                            <button onClick={handleSave} className="bg-rp-iris text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rp-iris/90 flex items-center gap-2">
                                <IconCheck size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
