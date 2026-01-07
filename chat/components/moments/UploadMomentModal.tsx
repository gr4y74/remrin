"use client"

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface UploadMomentModalProps {
    isOpen: boolean
    onClose: () => void
    personaId: string
    personaName: string
    onSuccess?: () => void
}

export function UploadMomentModal({
    isOpen,
    onClose,
    personaId,
    personaName,
    onSuccess
}: UploadMomentModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [caption, setCaption] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setError(null)

        // Validate file type
        if (selectedFile.type.startsWith('image/')) {
            setMediaType('image')
        } else if (selectedFile.type.startsWith('video/')) {
            setMediaType('video')
            // Check video duration (max 60 seconds)
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
                if (video.duration > 60) {
                    setError('Video must be 60 seconds or less')
                    setFile(null)
                    setPreview(null)
                    return
                }
            }
            video.src = URL.createObjectURL(selectedFile)
        } else {
            setError('Please select an image or video file')
            return
        }

        // Check file size (max 50MB for video, 10MB for image)
        const maxSize = selectedFile.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
        if (selectedFile.size > maxSize) {
            setError(`File too large. Max ${selectedFile.type.startsWith('video/') ? '50MB' : '10MB'}`)
            return
        }

        setFile(selectedFile)
        setPreview(URL.createObjectURL(selectedFile))
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile) {
            // Create a fake event to reuse the handleFileSelect logic
            const fakeEvent = {
                target: { files: [droppedFile] }
            } as unknown as React.ChangeEvent<HTMLInputElement>
            handleFileSelect(fakeEvent)
        }
    }, [handleFileSelect])

    const handleUpload = async () => {
        if (!file || !mediaType) return

        setIsUploading(true)
        setError(null)
        setUploadProgress(10)

        const supabase = createClient()

        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Authentication required")

            // 2. Prepare Files
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`
            const bucketName = mediaType === 'video' ? 'moment-videos' : 'moment-images'

            // 3. Upload Main File
            setUploadProgress(20)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName)

            setUploadProgress(50)

            // 4. Handle Thumbnail (Video Only)
            let thumbnailUrl = null
            let durationSeconds = 0

            if (mediaType === 'video') {
                // Generate thumbnail from video
                const generateThumbnail = async (): Promise<{ blob: Blob, duration: number }> => {
                    return new Promise((resolve, reject) => {
                        const video = document.createElement('video')
                        video.preload = 'metadata'
                        video.muted = true
                        video.playsInline = true
                        video.src = URL.createObjectURL(file)

                        video.onloadedmetadata = () => {
                            video.currentTime = Math.min(1, video.duration / 2)
                        }

                        video.onseeked = () => {
                            const canvas = document.createElement('canvas')
                            canvas.width = video.videoWidth
                            canvas.height = video.videoHeight
                            const ctx = canvas.getContext('2d')
                            ctx?.drawImage(video, 0, 0)

                            canvas.toBlob(blob => {
                                if (blob) resolve({ blob, duration: video.duration })
                                else reject(new Error("Thumbnail failed"))
                                URL.revokeObjectURL(video.src)
                            }, 'image/jpeg', 0.7)
                        }

                        video.onerror = (e) => reject(e)
                    })
                }

                try {
                    const { blob, duration } = await generateThumbnail()
                    durationSeconds = Math.round(duration)
                    const thumbName = `${user.id}/${Date.now()}_thumb.jpg`

                    const { error: thumbError } = await supabase.storage
                        .from('moment-thumbnails')
                        .upload(thumbName, blob)

                    if (!thumbError) {
                        const { data: { publicUrl: tUrl } } = supabase.storage
                            .from('moment-thumbnails')
                            .getPublicUrl(thumbName)
                        thumbnailUrl = tUrl
                    }
                } catch (e) {
                    console.warn("Thumbnail generation failed", e)
                }
            }

            setUploadProgress(80)

            // 5. Create DB Record
            const momentData = {
                persona_id: personaId,
                created_by_user_id: user.id,
                media_type: mediaType,
                caption: caption || null,
                image_url: mediaType === 'image' ? publicUrl : null,
                video_url: mediaType === 'video' ? publicUrl : null,
                thumbnail_url: thumbnailUrl,
                duration_seconds: durationSeconds,
                reactions_summary: {}
            }

            const { error: dbError } = await supabase
                .from('moments')
                .insert(momentData)

            if (dbError) throw dbError

            setUploadProgress(100)
            await new Promise(resolve => setTimeout(resolve, 500))

            onSuccess?.()
            handleClose()
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleClose = () => {
        setFile(null)
        setPreview(null)
        setCaption('')
        setError(null)
        setMediaType(null)
        onClose()
    }

    const clearFile = () => {
        setFile(null)
        setPreview(null)
        setMediaType(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-rp-surface border-rp-muted/20">
                <DialogHeader>
                    <DialogTitle className="text-rp-text">
                        Create Moment for {personaName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Upload Area */}
                    {!file ? (
                        <div
                            className={cn(
                                "border-2 border-dashed border-rp-muted/40 rounded-xl p-8",
                                "flex flex-col items-center justify-center gap-4",
                                "hover:border-rp-iris/50 transition-colors cursor-pointer"
                            )}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-12 w-12 text-rp-muted" />
                            <div className="text-center">
                                <p className="text-rp-text font-medium">
                                    Drop your file here or click to upload
                                </p>
                                <p className="text-rp-subtle text-sm mt-1">
                                    Images up to 10MB, Videos up to 50MB (60s max)
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1 px-3 py-1 bg-rp-overlay rounded-full">
                                    <ImageIcon className="h-4 w-4 text-rp-iris" />
                                    <span className="text-xs text-rp-subtle">Image</span>
                                </div>
                                <div className="flex items-center gap-1 px-3 py-1 bg-rp-overlay rounded-full">
                                    <Video className="h-4 w-4 text-rp-love" />
                                    <span className="text-xs text-rp-subtle">Video</span>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-rp-base">
                            {mediaType === 'video' ? (
                                <video
                                    src={preview || ''}
                                    className="w-full h-full object-cover"
                                    controls
                                />
                            ) : (
                                <Image
                                    src={preview || ''}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            )}
                            <button
                                onClick={clearFile}
                                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-full">
                                <span className="text-xs text-white capitalize">
                                    {mediaType}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Caption */}
                    <Textarea
                        placeholder="Add a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="bg-rp-base border-rp-muted/20 text-rp-text resize-none"
                        rows={3}
                        maxLength={500}
                    />
                    <p className="text-xs text-rp-subtle text-right">
                        {caption.length}/500
                    </p>

                    {/* Error */}
                    {error && (
                        <p className="text-rp-love text-sm bg-rp-love/10 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    {/* Upload Progress */}
                    {isUploading && uploadProgress > 0 && (
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-rp-muted/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rp-iris to-rp-foam transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-center text-rp-muted">
                                Uploading... {uploadProgress}%
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="flex-1 text-rp-subtle hover:text-rp-text"
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="flex-1 bg-gradient-to-r from-rp-iris to-rp-foam hover:opacity-90 text-white font-medium"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                '✨ Share Moment'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
