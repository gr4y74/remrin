"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
    IconTrash,
    IconMusic,
    IconPlayerPlay,
    IconPlayerPause,
    IconVolume,
    IconWaveSine,
    IconSparkles,
    IconPencil
} from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { SoulEditor } from "@/components/studio/SoulEditor"
import { useRouter } from "next/navigation"

interface Persona {
    id: string
    name: string
    image_url: string | null
    video_url: string | null
    background_url: string | null
    welcome_audio_url: string | null
    welcome_message: string | null
    description: string | null
    category: string | null
    tagline?: string | null
    system_prompt?: string | null
    intro_message?: string | null
    safety_level?: string | null
    tags?: string[] | null
    voice_id?: string | null
    metadata?: Record<string, any> | null
    config?: Record<string, any> | null
}

// Simple audio player component
const AudioPlayer = ({ src, onDelete }: { src: string; onDelete: () => void }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60)
        const secs = Math.floor(time % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="rounded-xl border border-rp-highlight-med bg-black/20 p-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    className="flex size-10 items-center justify-center rounded-full bg-rp-iris text-white hover:bg-rp-iris/90 transition-colors"
                >
                    {isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} fill="currentColor" />}
                </button>
                <div className="flex-1">
                    <div className="h-2 w-full rounded bg-rp-base/50">
                        <div
                            className="h-full rounded bg-rp-iris"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-rp-muted mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-rp-muted hover:text-red-400">
                    <IconX size={16} />
                </Button>
            </div>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
            />
        </div>
    )
}

export default function StudioManagerPage() {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()

    const loadPersonas = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            const { data, error } = await supabase
                .from('personas')
                .select('id, name, image_url, video_url, background_url, welcome_audio_url, welcome_message, description, category, tagline, system_prompt, intro_message, safety_level, tags, voice_id, metadata, config')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPersonas(data as any[])
        } catch (e) {
            console.error('Failed to load personas:', e)
            toast.error("Failed to load your souls")
        } finally {
            setLoading(false)
        }
    }, [supabase, router])

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
            const bucketName = 'persona_images'
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedPersona.id}_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file)

            if (uploadError) throw new Error("Upload failed")

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            const { error: dbError } = await supabase
                .from('personas')
                .update({ image_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Image updated!", { id: toastId })
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, image_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, image_url: publicUrl } : null)
        } catch (e: any) {
            toast.error(e.message || "Upload failed", { id: toastId })
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

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file)

            if (uploadError) throw new Error("Upload failed")

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            const { error: dbError } = await supabase
                .from('personas')
                .update({ video_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Video attached!", { id: toastId })
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, video_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, video_url: publicUrl } : null)
        } catch (e: any) {
            toast.error(e.message || "Upload failed", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleBackgroundUpload = async (file: File) => {
        if (!selectedPersona) return
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file")
            return
        }

        setUploading(true)
        const toastId = toast.loading("Uploading background...")

        try {
            const bucketName = 'persona_backgrounds'
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedPersona.id}_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file)

            if (uploadError) throw new Error("Upload failed")

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            const { error: dbError } = await supabase
                .from('personas')
                .update({ background_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Background updated!", { id: toastId })
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, background_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, background_url: publicUrl } : null)
        } catch (e: any) {
            toast.error(e.message || "Upload failed", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleAudioUpload = async (file: File) => {
        if (!selectedPersona) return
        if (!file.type.startsWith('audio/')) {
            toast.error("Please upload an audio file")
            return
        }

        setUploading(true)
        const toastId = toast.loading("Uploading audio...")

        try {
            const formData = new FormData()
            formData.append('personaId', selectedPersona.id)
            formData.append('file', file)

            const response = await fetch('/api/audio/upload', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error)

            toast.success("Audio uploaded!", { id: toastId })
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, welcome_audio_url: result.audioUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, welcome_audio_url: result.audioUrl } : null)
        } catch (e: any) {
            toast.error(e.message || "Upload failed", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveVideo = async () => {
        if (!selectedPersona || !confirm("Remove video?")) return
        try {
            await supabase.from('personas').update({ video_url: null }).eq('id', selectedPersona.id)
            toast.success("Video removed")
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, video_url: null } : p))
            setSelectedPersona(prev => prev ? { ...prev, video_url: null } : null)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleRemoveBackground = async () => {
        if (!selectedPersona || !confirm("Remove background?")) return
        try {
            await supabase.from('personas').update({ background_url: null }).eq('id', selectedPersona.id)
            toast.success("Background removed")
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, background_url: null } : p))
            setSelectedPersona(prev => prev ? { ...prev, background_url: null } : null)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleRemoveAudio = async () => {
        if (!selectedPersona || !confirm("Remove audio?")) return
        try {
            await supabase.from('personas').update({ welcome_audio_url: null }).eq('id', selectedPersona.id)
            toast.success("Audio removed")
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, welcome_audio_url: null } : p))
            setSelectedPersona(prev => prev ? { ...prev, welcome_audio_url: null } : null)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleDeleteCharacter = async () => {
        if (!selectedPersona) return
        if (!confirm(`Delete "${selectedPersona.name}"? This cannot be undone.`)) return

        setDeleting(true)
        try {
            await supabase.from('personas').delete().eq('id', selectedPersona.id)
            toast.success(`${selectedPersona.name} deleted`)
            setPersonas(prev => prev.filter(p => p.id !== selectedPersona.id))
            setSelectedPersona(null)
        } catch (e: any) {
            toast.error(e.message || "Failed to delete")
        } finally {
            setDeleting(false)
        }
    }

    const filteredPersonas = personas.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-transparent text-rp-text">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-rp-highlight-med bg-rp-base/80 px-6 py-4 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/studio" className="text-rp-subtle hover:text-rp-text flex items-center gap-2 transition-colors">
                            <IconArrowLeft size={18} />
                            Back to Studio
                        </Link>
                        <div className="bg-rp-highlight-med h-6 w-px" />
                        <h1 className="flex items-center gap-2 text-xl font-bold">
                            <IconPencil className="text-rp-iris" size={24} />
                            Soul Manager
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
                            placeholder="Search your souls..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-rp-highlight-med bg-rp-surface py-2 pl-10 pr-4 text-sm focus:border-rp-iris focus:outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-auto rounded-xl border border-rp-highlight-med bg-rp-surface">
                        {loading ? (
                            <div className="flex h-40 items-center justify-center text-rp-muted">Loading...</div>
                        ) : filteredPersonas.length === 0 ? (
                            <div className="p-8 text-center text-rp-muted">
                                <p>No souls found</p>
                                <Link href="/studio" className="text-rp-iris hover:underline text-sm mt-2 block">
                                    Create your first soul →
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-rp-highlight-med">
                                {filteredPersonas.map(persona => (
                                    <div
                                        key={persona.id}
                                        onClick={() => setSelectedPersona(persona)}
                                        className={`flex cursor-pointer gap-3 p-3 transition-colors ${selectedPersona?.id === persona.id ? 'bg-rp-overlay' : 'hover:bg-rp-base'}`}
                                    >
                                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-rp-base">
                                            {persona.image_url ? (
                                                <Image src={persona.image_url} alt={persona.name} fill className="object-cover" />
                                            ) : <IconPhoto className="m-auto text-rp-muted" />}
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
                <div className="flex-1 rounded-xl border border-rp-highlight-med bg-rp-surface p-6 overflow-auto">
                    {selectedPersona ? (
                        <div className="flex flex-col gap-8">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-6">
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
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteCharacter}
                                    disabled={deleting}
                                >
                                    <IconTrash size={16} className="mr-1" />
                                    Delete
                                </Button>
                            </div>

                            {/* SOUL EDITOR SECTION */}
                            <div>
                                <h3 className="mb-4 font-semibold flex items-center gap-2">
                                    <IconSparkles className="text-rp-gold" />
                                    Soul Editor
                                </h3>
                                <div className="rounded-xl border border-rp-highlight-med bg-rp-overlay/50 p-6">
                                    <SoulEditor
                                        personaId={selectedPersona.id}
                                        initialData={{
                                            name: selectedPersona.name,
                                            tagline: selectedPersona.tagline || undefined,
                                            description: selectedPersona.description || undefined,
                                            system_prompt: selectedPersona.system_prompt || undefined,
                                            intro_message: selectedPersona.intro_message || undefined,
                                            safety_level: (selectedPersona.safety_level as any) || "ADULT",
                                            category: selectedPersona.category || undefined,
                                            tags: selectedPersona.tags || undefined,
                                            voice_id: selectedPersona.voice_id || undefined,
                                            image_url: selectedPersona.image_url || undefined,
                                            metadata: selectedPersona.metadata || undefined,
                                            config: selectedPersona.config || undefined
                                        }}
                                        onUpdate={loadPersonas}
                                        isAdmin={false}
                                    />
                                </div>
                            </div>

                            {/* AVATAR SECTION */}
                            <div>
                                <h3 className="mb-4 font-semibold flex items-center gap-2">
                                    <IconPhoto className="text-rp-iris" />
                                    Avatar
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
                                    <div>
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
                                            <span>Upload Avatar</span>
                                        </label>
                                        <p className="mt-2 text-xs text-rp-muted">Square image recommended</p>
                                    </div>
                                </div>
                            </div>

                            {/* BACKGROUND SECTION */}
                            <div>
                                <h3 className="mb-4 font-semibold flex items-center gap-2">
                                    <IconPhoto className="text-rp-foam" />
                                    Background
                                </h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="rounded-xl border border-rp-highlight-med bg-black/20 overflow-hidden relative group h-32">
                                        {selectedPersona.background_url ? (
                                            <div className="relative h-full w-full">
                                                <Image src={selectedPersona.background_url} alt="Background" fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="destructive" size="sm" onClick={handleRemoveBackground}>
                                                        <IconX size={16} className="mr-1" />Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center text-rp-muted">
                                                <IconPhoto size={32} className="opacity-20" />
                                                <p className="text-xs">No background</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])}
                                            className="hidden"
                                            id="bg-upload"
                                            disabled={uploading}
                                        />
                                        <label htmlFor="bg-upload" className="cursor-pointer rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-6 text-center transition-colors hover:border-rp-foam flex flex-col items-center">
                                            <IconUpload size={24} className="text-rp-foam mb-2" />
                                            <span>Upload Background</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* AUDIO SECTION */}
                            <div>
                                <h3 className="mb-4 font-semibold flex items-center gap-2">
                                    <IconMusic className="text-rp-rose" />
                                    Welcome Audio
                                </h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        {selectedPersona.welcome_audio_url ? (
                                            <AudioPlayer src={selectedPersona.welcome_audio_url} onDelete={handleRemoveAudio} />
                                        ) : (
                                            <div className="rounded-xl border border-rp-highlight-med bg-black/20 p-8 text-center">
                                                <IconMusic size={32} className="mx-auto mb-2 opacity-20" />
                                                <p className="text-rp-muted text-sm">No audio</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                                            className="hidden"
                                            id="audio-upload"
                                            disabled={uploading}
                                        />
                                        <label htmlFor="audio-upload" className="cursor-pointer rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-6 text-center transition-colors hover:border-rp-rose flex flex-col items-center">
                                            <IconUpload size={24} className="text-rp-rose mb-2" />
                                            <span>Upload Audio</span>
                                            <p className="text-xs text-rp-muted mt-1">MP3, WAV (Max 10MB)</p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* VIDEO SECTION */}
                            <div>
                                <h3 className="mb-4 font-semibold flex items-center gap-2">
                                    <IconVideo className="text-rp-iris" />
                                    Living Portrait (Video)
                                </h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="rounded-xl border border-rp-highlight-med bg-black/20 overflow-hidden relative group h-48">
                                        {selectedPersona.video_url ? (
                                            <div className="relative h-full w-full">
                                                <video
                                                    src={selectedPersona.video_url}
                                                    autoPlay loop muted playsInline
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="destructive" size="sm" onClick={handleRemoveVideo}>
                                                        <IconX size={16} className="mr-1" />Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center text-rp-muted">
                                                <IconVideo size={48} className="opacity-20" />
                                                <p className="text-sm">No video</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                                            className="hidden"
                                            id="video-upload"
                                            disabled={uploading}
                                        />
                                        <label htmlFor="video-upload" className="cursor-pointer rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-6 text-center transition-colors hover:border-rp-iris flex flex-col items-center">
                                            <IconUpload size={24} className="text-rp-iris mb-2" />
                                            <span>Upload Video</span>
                                            <p className="text-xs text-rp-muted mt-1">MP4, WebM</p>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-rp-muted">
                            <IconSparkles size={48} className="mb-4 opacity-20" />
                            <p>Select a soul to edit</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
