"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    IconArrowLeft,
    IconRefresh,
    IconSearch,
    IconVideo,
    IconPhoto,
    IconUpload,
    IconX,
    IconCheck
} from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"

interface Persona {
    id: string
    name: string
    image_url: string | null
    video_url: string | null
    description: string | null
    category: string | null
}

export default function MediaManagerPage() {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
    const [uploading, setUploading] = useState(false)

    const supabase = createClient()

    const loadPersonas = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('personas')
                .select('id, name, image_url, video_url, description, category')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPersonas(data as any[]) // Type case because video_url is new
        } catch (e) {
            console.error('Failed to load personas:', e)
            toast.error("Failed to load personas")
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        loadPersonas()
    }, [loadPersonas])

    const handleImageUpload = async (file: File) => {
        if (!selectedPersona) return
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file")
            return
        }

        setUploading(true)
        const toastId = toast.loading("Uploading image...")

        try {
            // Using 'persona_images' bucket relative path or whatever the setup is. 
            // If 'persona_images' doesn't exist, we might need 'personas'. 
            // In many Supabase setups, 'public' bucket with folders is used, or specific buckets.
            // Let's assume 'persona_images' bucket for consistency with 'persona_videos'.
            const bucketName = 'persona_images'
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedPersona.id}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) {
                console.error("Upload error:", uploadError)
                throw new Error("Upload failed. Ensure 'persona_images' bucket exists and is public.")
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            // 3. Update Persona
            const { error: dbError } = await supabase
                .from('personas')
                .update({ image_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Image updated successfully!", { id: toastId })

            // Update local state
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, image_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, image_url: publicUrl } : null)

        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Something went wrong", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleVideoUpload = async (file: File) => {
        if (!selectedPersona) return
        if (!file.type.startsWith('video/')) {
            toast.error("Please upload a video file")
            return
        }

        setUploading(true)
        const toastId = toast.loading("Uploading video...")

        try {
            const bucketName = 'persona_videos'
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedPersona.id}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) {
                // If bucket doesn't exist error, user needs to create it.
                // We tried to create it in SQL but if RLS blocked it or something...
                console.error("Upload error:", uploadError)
                throw new Error("Upload failed. Ensure 'persona_videos' bucket exists and is public.")
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            // 3. Update Persona
            const { error: dbError } = await supabase
                .from('personas')
                .update({ video_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Video attached successfully!", { id: toastId })

            // Update local state
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, video_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, video_url: publicUrl } : null)

        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Something went wrong", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveVideo = async () => {
        if (!selectedPersona) return
        if (!confirm("Are you sure you want to remove the video?")) return

        try {
            const { error } = await supabase
                .from('personas')
                .update({ video_url: null })
                .eq('id', selectedPersona.id)

            if (error) throw error

            toast.success("Video removed")

            // Update local state
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, video_url: null } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, video_url: null } : null)

        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const filteredPersonas = personas.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-rp-highlight-med bg-rp-base/80 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-7xl items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-rp-subtle hover:text-rp-text flex items-center gap-2 transition-colors">
                                <IconArrowLeft size={18} />
                                Back
                            </Link>
                            <div className="bg-rp-highlight-med h-6 w-px" />
                            <h1 className="flex items-center gap-2 text-xl font-bold">
                                <IconPhoto className="text-rp-rose" size={24} />
                                Media Manager
                            </h1>
                        </div>
                        <Button variant="outline" onClick={loadPersonas}>
                            <IconRefresh size={18} />
                        </Button>
                    </div>
                </header>

                <main className="mx-auto flex h-[calc(100vh-73px)] max-w-7xl gap-6 p-6">
                    {/* List Column */}
                    <div className="flex w-1/3 flex-col gap-4">
                        <div className="relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted" size={18} />
                            <input
                                type="text"
                                placeholder="Search personas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-xl border border-rp-highlight-med bg-rp-surface py-2 pl-10 pr-4 text-sm focus:border-rp-iris focus:outline-none"
                            />
                        </div>

                        <div className="flex-1 overflow-auto rounded-xl border border-rp-highlight-med bg-rp-surface">
                            {loading ? (
                                <div className="flex h-40 items-center justify-center text-rp-muted">Loading...</div>
                            ) : filteredPersonas.length === 0 ? (
                                <div className="p-8 text-center text-rp-muted">No personas found</div>
                            ) : (
                                <div className="divide-y divide-rp-highlight-med">
                                    {filteredPersonas.map(persona => (
                                        <div
                                            key={persona.id}
                                            onClick={() => setSelectedPersona(persona)}
                                            className={`flex cursor-pointer gap-3 p-3 transition-colors ${selectedPersona?.id === persona.id ? 'bg-rp-overlay' : 'hover:bg-rp-base'
                                                }`}
                                        >
                                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-rp-base">
                                                {persona.image_url ? (
                                                    <Image src={persona.image_url} alt={persona.name} fill className="object-cover" />
                                                ) : <IconPhoto className="m-auto text-rp-muted" />}

                                                {/* Indicator if has video */}
                                                {persona.video_url && (
                                                    <div className="absolute top-0 right-0 p-1 bg-black/50 rounded-bl-lg">
                                                        <IconVideo size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium">{persona.name}</div>
                                                <div className="truncate text-xs text-rp-muted">{persona.category || "Uncategorized"}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor Column */}
                    <div className="flex-1 rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                        {selectedPersona ? (
                            <div className="flex flex-col gap-8 h-full">
                                <div className="flex items-start gap-6">
                                    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border-2 border-rp-highlight-med">
                                        {selectedPersona.image_url ? (
                                            <Image src={selectedPersona.image_url} alt={selectedPersona.name} fill className="object-cover" />
                                        ) : <div className="flex size-full items-center justify-center bg-rp-base text-2xl">🤖</div>}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedPersona.name}</h2>
                                        <p className="text-rp-subtle">{selectedPersona.description}</p>
                                        <div className="mt-2 text-xs font-mono text-rp-muted">ID: {selectedPersona.id}</div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8">
                                    {/* AVATAR SECTION */}
                                    <div>
                                        <h3 className="mb-4 font-semibold flex items-center gap-2">
                                            <IconPhoto className="text-rp-iris" />
                                            Avatar (Profile Picture)
                                        </h3>
                                        <div className="flex items-start gap-8">
                                            <div className="relative size-32 shrink-0 overflow-hidden rounded-xl border-2 border-rp-highlight-med bg-rp-base">
                                                {selectedPersona.image_url ? (
                                                    <Image src={selectedPersona.image_url} alt={selectedPersona.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center text-rp-muted">
                                                        <IconPhoto size={32} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                                    className="hidden"
                                                    id="image-upload"
                                                    disabled={uploading}
                                                />
                                                <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rp-surface border border-rp-highlight-med hover:bg-rp-highlight-low transition-colors">
                                                    <IconUpload size={18} />
                                                    <span>Upload New Avatar</span>
                                                </label>
                                                <p className="mt-2 text-xs text-rp-muted">
                                                    Recommended: Square (1:1), PNG or JPG.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VIDEO SECTION */}
                                    <div>
                                        <h3 className="mb-4 font-semibold flex items-center gap-2">
                                            <IconVideo className="text-rp-iris" />
                                            Living Portrait (Video)
                                        </h3>

                                        <div className="grid grid-cols-2 gap-8 h-[400px]">
                                            {/* Preview Area */}
                                            <div className="rounded-xl border border-rp-highlight-med bg-black/20 overflow-hidden relative group">
                                                {selectedPersona.video_url ? (
                                                    <div className="relative h-full w-full">
                                                        <video
                                                            src={selectedPersona.video_url}
                                                            autoPlay
                                                            loop
                                                            muted
                                                            playsInline
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button variant="destructive" size="sm" onClick={handleRemoveVideo}>
                                                                <IconX size={16} className="mr-1" />
                                                                Remove Video
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex h-full flex-col items-center justify-center text-rp-muted p-6 text-center">
                                                        <IconVideo size={48} className="mb-2 opacity-20" />
                                                        <p>No video attached.</p>
                                                        <p className="text-xs mt-1">Video will play instead of the static image.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upload Area */}
                                            <div className="flex flex-col gap-4 justify-center">
                                                <div className="rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-8 text-center transition-colors hover:border-rp-iris hover:bg-rp-iris/5">
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                                                        className="hidden"
                                                        id="video-upload"
                                                        disabled={uploading}
                                                    />
                                                    <label htmlFor="video-upload" className="flex flex-col items-center cursor-pointer">
                                                        <div className={`mb-4 flex size-16 items-center justify-center rounded-full ${uploading ? 'bg-rp-muted' : 'bg-rp-iris/20 text-rp-iris'}`}>
                                                            {uploading ? (
                                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-rp-text border-t-transparent" />
                                                            ) : (
                                                                <IconUpload size={32} />
                                                            )}
                                                        </div>
                                                        <h4 className="font-semibold">Upload New Video</h4>
                                                        <p className="mt-1 text-sm text-rp-subtle">
                                                            Supports MP4, WebM. <br />
                                                            Recommended ratio 9:16 (Portrait)
                                                        </p>
                                                    </label>
                                                </div>

                                                <div className="text-xs text-rp-muted text-center max-w-xs mx-auto">
                                                    Tip: Use the &quot;Spark of Life&quot; feature to generate videos from images automatically.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-rp-muted">
                                <IconPhoto size={48} className="mb-4 opacity-20" />
                                <p>Select a persona from the list to manage media</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AdminPasswordGate>
    )
}
