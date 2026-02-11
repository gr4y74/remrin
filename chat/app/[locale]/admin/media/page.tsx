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
    IconCheck,
    IconTrash,
    IconStar,
    IconMusic,
    IconPlayerPlay,
    IconPlayerPause,
    IconVolume,
    IconWaveSine,
    IconSparkles
} from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"
import { SoulEditor } from "@/components/studio/SoulEditor"
import { BackgroundMusicPlayer } from "@/components/audio/BackgroundMusicPlayer"

interface Persona {
    id: string
    name: string
    image_url: string | null
    video_url: string | null
    background_url: string | null
    welcome_audio_url: string | null
    background_music_url: string | null
    welcome_message: string | null
    description: string | null
    category: string | null
    is_default_media_set: boolean | null
    // Soul fields for SoulEditor
    tagline?: string | null
    system_prompt?: string | null
    intro_message?: string | null
    safety_level?: string | null
    tags?: string[] | null
    voice_id?: string | null
    metadata?: Record<string, any> | null
    config?: Record<string, any> | null
}

const AudioPlayer = ({ src, onDelete, autoPlay = false }: { src: string, onDelete: () => void, autoPlay?: boolean }) => {
    const audioRef = useCallback((node: HTMLAudioElement | null) => {
        if (node) {
            node.volume = 0.5;
        }
    }, [])

    const [isPlaying, setIsPlaying] = useState(autoPlay)
    const [isLooping, setIsLooping] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [volume, setVolume] = useState(0.5)

    const audioInstance = useRef<HTMLAudioElement | null>(null)

    const togglePlay = () => {
        if (audioInstance.current) {
            if (isPlaying) {
                audioInstance.current.pause()
            } else {
                audioInstance.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleLoop = () => {
        setIsLooping(!isLooping)
    }

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        setCurrentTime(e.currentTarget.currentTime)
    }

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        setDuration(e.currentTarget.duration)
        if (autoPlay) e.currentTarget.play().catch(console.error)
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value)
        setVolume(val)
        if (audioInstance.current) {
            audioInstance.current.volume = val
        }
    }

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60)
        const secs = Math.floor(time % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="rounded-xl border border-rp-highlight-med bg-black/20 p-4 transition-all hover:border-rp-iris/50">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-rp-iris font-mono text-xs">
                            <IconWaveSine size={16} className={isPlaying ? "animate-pulse" : ""} />
                            <span>AUDIO PREVIEW</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onDelete} className="h-6 w-6 p-0 text-rp-muted hover:text-red-400">
                            <IconX size={14} />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlay}
                            className="flex size-10 items-center justify-center rounded-full bg-rp-iris text-white hover:bg-rp-iris/90 transition-colors"
                        >
                            {isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} fill="currentColor" />}
                        </button>

                        <div className="flex-1 space-y-1">
                            <div className="h-8 w-full rounded bg-rp-base/50 flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 flex items-end justify-between px-1 gap-px opacity-50">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-rp-iris rounded-t"
                                            style={{
                                                height: `${20 + Math.random() * 80}%`,
                                                opacity: currentTime / duration > i / 40 ? 1 : 0.3
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between text-[10px] font-mono text-rp-subtle">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <IconVolume size={14} className="text-rp-muted" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-rp-surface accent-rp-iris"
                        />
                        <button
                            onClick={toggleLoop}
                            className={`ml-2 p-1 rounded-md transition-colors ${isLooping ? 'bg-rp-iris text-white' : 'text-rp-muted hover:text-rp-text'}`}
                            title="Toggle Loop"
                        >
                            <IconRefresh size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <audio
                ref={(el) => {
                    audioInstance.current = el;
                    if (audioRef) audioRef(el);
                }}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => !isLooping && setIsPlaying(false)}
                loop={isLooping}
                crossOrigin="anonymous"
                className="hidden"
            />
        </div>
    )
}

export default function MediaManagerPage() {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const supabase = createClient()

    const loadPersonas = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('personas')
                .select('id, name, image_url, video_url, background_url, welcome_audio_url, background_music_url, welcome_message, description, category, is_default_media_set, system_prompt, intro_message, safety_level, tags, voice_id, metadata, config')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPersonas(data as any[])
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
            const bucketName = 'persona_images'
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedPersona.id}_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) {
                console.error("Upload error:", uploadError)
                throw new Error("Upload failed. Ensure 'persona_images' bucket exists and is public.")
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            const { error: dbError } = await supabase
                .from('personas')
                .update({ image_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Image updated successfully!", { id: toastId })

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

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) {
                console.error("Upload error:", uploadError)
                throw new Error("Upload failed. Ensure 'persona_videos' bucket exists and is public.")
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            const { error: dbError } = await supabase
                .from('personas')
                .update({ video_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Video attached successfully!", { id: toastId })

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
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file)

            if (uploadError) {
                console.error("Upload error:", uploadError)
                throw new Error("Upload failed. Ensure 'persona_backgrounds' bucket exists and is public.")
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

            const { error: dbError } = await supabase
                .from('personas')
                .update({ background_url: publicUrl })
                .eq('id', selectedPersona.id)

            if (dbError) throw dbError

            toast.success("Background updated successfully!", { id: toastId })

            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, background_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, background_url: publicUrl } : null)

        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Something went wrong", { id: toastId })
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
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB")
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

            if (!response.ok) {
                throw new Error(result.error || "Upload failed")
            }

            const publicUrl = result.audioUrl

            toast.success("Audio uploaded successfully!", { id: toastId })

            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, welcome_audio_url: publicUrl } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, welcome_audio_url: publicUrl } : null)

        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Upload failed", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleMusicUpload = async (file: File) => {
        if (!selectedPersona) return
        setUploading(true)
        const toastId = toast.loading("Uploading music...")
        try {
            const formData = new FormData()
            formData.append('personaId', selectedPersona.id)
            formData.append('file', file)
            formData.append('type', 'music')
            const response = await fetch('/api/audio/upload', { method: 'POST', body: formData })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || "Upload failed")
            const publicUrl = result.audioUrl
            toast.success("Music uploaded successfully!", { id: toastId })
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, background_music_url: publicUrl } : p))
            setSelectedPersona(prev => prev ? { ...prev, background_music_url: publicUrl } : null)
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Upload failed", { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    const handleSaveWelcomeMessage = async () => {
        if (!selectedPersona) return
        try {
            const { error } = await supabase
                .from('personas')
                .update({ welcome_message: selectedPersona.welcome_message })
                .eq('id', selectedPersona.id)

            if (error) throw error
            toast.success("Transcript saved", { duration: 1500 })
        } catch (e: any) {
            toast.error("Failed to save transcript")
            console.error(e)
        }
    }

    const handleRemoveAudio = async () => {
        if (!selectedPersona) return
        if (!confirm("Are you sure you want to remove the audio?")) return

        try {
            const { error } = await supabase
                .from('personas')
                .update({ welcome_audio_url: null })
                .eq('id', selectedPersona.id)

            if (error) throw error

            toast.success("Audio removed")

            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, welcome_audio_url: null } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, welcome_audio_url: null } : null)

        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Failed to remove audio")
        }
    }

    const handleRemoveMusic = async () => {
        if (!selectedPersona || !selectedPersona.background_music_url) return
        if (!confirm("Are you sure you want to remove the background music?")) return
        const toastId = toast.loading("Removing music...")
        try {
            const { error } = await supabase.from('personas').update({ background_music_url: null }).eq('id', selectedPersona.id)
            if (error) throw error
            toast.success("Music removed successfully!", { id: toastId })
            setPersonas(prev => prev.map(p => p.id === selectedPersona.id ? { ...p, background_music_url: null } : p))
            setSelectedPersona(prev => prev ? { ...prev, background_music_url: null } : null)
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Failed to remove music", { id: toastId })
        }
    }

    const handleSetAsDefault = async () => {
        if (!selectedPersona) return
        try {
            const { error } = await supabase
                .from('personas')
                .update({ is_default_media_set: true })
                .eq('id', selectedPersona.id)

            if (error) throw error
            toast.success("Media set as default! This will persist across server restarts.")

            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, is_default_media_set: true } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, is_default_media_set: true } : null)
        } catch (e: any) {
            toast.error(e.message || "Failed to set as default")
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

            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, video_url: null } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, video_url: null } : null)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleRemoveBackground = async () => {
        if (!selectedPersona) return
        if (!confirm("Are you sure you want to remove the background?")) return
        try {
            const { error } = await supabase
                .from('personas')
                .update({ background_url: null })
                .eq('id', selectedPersona.id)

            if (error) throw error
            toast.success("Background removed")

            setPersonas(prev => prev.map(p =>
                p.id === selectedPersona.id ? { ...p, background_url: null } : p
            ))
            setSelectedPersona(prev => prev ? { ...prev, background_url: null } : null)
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    const handleDeleteCharacter = async () => {
        if (!selectedPersona) return
        const confirmText = `Are you sure you want to DELETE "${selectedPersona.name}"? This action cannot be undone and will remove all associated data.`
        if (!confirm(confirmText)) return

        setDeleting(true)
        const toastId = toast.loading("Deleting character...")
        try {
            const { error } = await supabase
                .from('personas')
                .delete()
                .eq('id', selectedPersona.id)

            if (error) throw error
            toast.success(`${selectedPersona.name} has been deleted`, { id: toastId })
            setPersonas(prev => prev.filter(p => p.id !== selectedPersona.id))
            setSelectedPersona(null)
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Failed to delete character", { id: toastId })
        } finally {
            setDeleting(false)
        }
    }

    const filteredPersonas = personas.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
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

                                                {persona.video_url && (
                                                    <div className="absolute top-0 right-0 p-1 bg-black/50 rounded-bl-lg">
                                                        <IconVideo size={10} className="text-white" />
                                                    </div>
                                                )}
                                                {persona.is_default_media_set && (
                                                    <div className="absolute bottom-0 right-0 p-1 bg-rp-gold/80 rounded-tl-lg">
                                                        <IconStar size={10} className="text-white" />
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

                    <div className="flex-1 rounded-xl border border-rp-highlight-med bg-rp-surface p-6 overflow-auto">
                        {selectedPersona ? (
                            <div className="flex flex-col gap-8">
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

                                    <div className="flex gap-2">
                                        <Button
                                            variant={selectedPersona.is_default_media_set ? "default" : "outline"}
                                            size="sm"
                                            onClick={handleSetAsDefault}
                                            className={selectedPersona.is_default_media_set ? "bg-rp-gold hover:bg-rp-gold/90" : ""}
                                        >
                                            <IconStar size={16} className="mr-1" />
                                            {selectedPersona.is_default_media_set ? "Default Set" : "Set as Default"}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleDeleteCharacter}
                                            disabled={deleting}
                                        >
                                            <IconTrash size={16} className="mr-1" />
                                            Delete Character
                                        </Button>
                                    </div>
                                </div>

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

                                {/* BACKGROUND SECTION */}
                                <div>
                                    <h3 className="mb-4 font-semibold flex items-center gap-2">
                                        <IconPhoto className="text-rp-foam" />
                                        Background Image
                                    </h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="rounded-xl border border-rp-highlight-med bg-black/20 overflow-hidden relative group h-48">
                                            {selectedPersona.background_url ? (
                                                <div className="relative h-full w-full">
                                                    <Image src={selectedPersona.background_url} alt="Background" fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button variant="destructive" size="sm" onClick={handleRemoveBackground}>
                                                            <IconX size={16} className="mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex h-full flex-col items-center justify-center text-rp-muted p-6 text-center">
                                                    <IconPhoto size={48} className="mb-2 opacity-20" />
                                                    <p>No background set</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-4 justify-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])}
                                                className="hidden"
                                                id="background-upload"
                                                disabled={uploading}
                                            />
                                            <label htmlFor="background-upload" className="cursor-pointer rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-6 text-center transition-colors hover:border-rp-foam hover:bg-rp-foam/5 flex flex-col items-center">
                                                <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${uploading ? 'bg-rp-muted' : 'bg-rp-foam/20 text-rp-foam'}`}>
                                                    {uploading ? (
                                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-rp-text border-t-transparent" />
                                                    ) : (
                                                        <IconUpload size={24} />
                                                    )}
                                                </div>
                                                <h4 className="font-semibold">Upload Background</h4>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* WELCOME AUDIO SECTION */}
                                <div>
                                    <h3 className="mb-4 font-semibold flex items-center gap-2">
                                        <IconMusic className="text-rp-rose" />
                                        Welcome Audio
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-4">
                                            {selectedPersona.welcome_audio_url ? (
                                                <AudioPlayer
                                                    src={selectedPersona.welcome_audio_url}
                                                    onDelete={handleRemoveAudio}
                                                />
                                            ) : (
                                                <div className="rounded-xl border border-rp-highlight-med bg-black/20 p-8 text-center h-40 flex flex-col items-center justify-center text-rp-muted">
                                                    <IconMusic size={32} className="mb-2 opacity-20" />
                                                    <p>No audio attached</p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold uppercase tracking-wider text-rp-subtle">
                                                    Transcript / Welcome Message
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base p-3 text-sm focus:border-rp-iris focus:outline-none min-h-[100px] resize-none"
                                                        placeholder="Enter text..."
                                                        value={selectedPersona.welcome_message || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setSelectedPersona(prev => prev ? { ...prev, welcome_message: val } : null);
                                                        }}
                                                        onBlur={handleSaveWelcomeMessage}
                                                    />
                                                    <div className="absolute bottom-2 right-2">
                                                        <span className="text-[10px] text-rp-muted">Saved on blur</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 justify-start">
                                            <div className="rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-8 text-center transition-colors hover:border-rp-rose hover:bg-rp-rose/5">
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                                                    className="hidden"
                                                    id="audio-upload"
                                                    disabled={uploading}
                                                />
                                                <label htmlFor="audio-upload" className="flex flex-col items-center cursor-pointer">
                                                    <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${uploading ? 'bg-rp-muted' : 'bg-rp-rose/20 text-rp-rose'}`}>
                                                        {uploading ? (
                                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rp-text border-t-transparent" />
                                                        ) : (
                                                            <IconUpload size={24} />
                                                        )}
                                                    </div>
                                                    <h4 className="font-semibold">Upload Audio</h4>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BACKGROUND MUSIC SECTION */}
                                <div>
                                    <h3 className="mb-4 font-semibold flex items-center gap-1.5">
                                        <IconMusic className="text-rp-gold" size={20} />
                                        Background Music
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-4">
                                            {selectedPersona.background_music_url ? (
                                                <div className="rounded-xl border border-rp-highlight-med bg-black/20 p-6 flex flex-col items-center justify-center min-h-[160px]">
                                                    <div className="flex flex-col items-center gap-4 w-full">
                                                        <BackgroundMusicPlayer
                                                            musicUrl={selectedPersona.background_music_url}
                                                        />
                                                        <Button variant="outline" size="sm" onClick={handleRemoveMusic} className="text-rp-love hover:bg-rp-love/10 border-rp-love/20 h-8">
                                                            <IconTrash size={14} className="mr-1.5" />
                                                            Remove Music
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-rp-highlight-med bg-black/20 p-8 text-center h-40 flex flex-col items-center justify-center text-rp-muted">
                                                    <IconMusic size={32} className="mb-2 opacity-20" />
                                                    <p>No background music</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-4 justify-start">
                                            <div className="rounded-xl border-2 border-dashed border-rp-highlight-med bg-rp-base/50 p-8 text-center transition-colors hover:border-rp-gold hover:bg-rp-gold/5">
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={(e) => e.target.files?.[0] && handleMusicUpload(e.target.files[0])}
                                                    className="hidden"
                                                    id="music-upload-admin"
                                                    disabled={uploading}
                                                />
                                                <label htmlFor="music-upload-admin" className="flex flex-col items-center cursor-pointer">
                                                    <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${uploading ? 'bg-rp-muted' : 'bg-rp-gold/20 text-rp-gold'}`}>
                                                        {uploading ? (
                                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-rp-text border-t-transparent" />
                                                        ) : (
                                                            <IconUpload size={24} />
                                                        )}
                                                    </div>
                                                    <h4 className="font-semibold">Upload Music Track</h4>
                                                </label>
                                            </div>
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
                                                </div>
                                            )}
                                        </div>

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
                                                </label>
                                            </div>
                                        </div>
                                    </div>
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
                                            isAdmin={true}
                                        />
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
