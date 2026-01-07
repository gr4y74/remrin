# AGENT 3: UI Components

## Mission
Build all React components for video moments, reactions, and feed layouts (grid + vertical).

## Context
- Project: Remrin.ai chat application
- Location: `/mnt/Data68/remrin/chat`
- Framework: Next.js 14 + React
- Styling: Tailwind CSS + Rose Pine theme
- Dependencies: Wait for AGENT 1 (database) and AGENT 2 (APIs)

## Tasks

### 1. Create VideoMomentCard Component
Create: `/mnt/Data68/remrin/chat/components/moments/VideoMomentCard.tsx`

```typescript
"use client"

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface VideoMomentCardProps {
  videoUrl: string
  thumbnailUrl?: string | null
  personaName: string
  personaImageUrl?: string | null
  caption?: string | null
  onView?: () => void
  autoPlay?: boolean
  className?: string
}

export function VideoMomentCard({
  videoUrl,
  thumbnailUrl,
  personaName,
  personaImageUrl,
  caption,
  onView,
  autoPlay = false,
  className
}: VideoMomentCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(true)
  const [hasViewed, setHasViewed] = useState(false)

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play()
    }
  }, [autoPlay])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
        if (!hasViewed && onView) {
          onView()
          setHasViewed(true)
        }
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div
      className={cn(
        "relative aspect-[9/16] overflow-hidden rounded-2xl bg-black cursor-pointer group",
        className
      )}
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        loop
        muted={isMuted}
        playsInline
        className="h-full w-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity",
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      >
        {!isPlaying && (
          <div className="rounded-full bg-white/90 p-4 backdrop-blur-sm">
            <Play className="h-8 w-8 text-black" fill="black" />
          </div>
        )}
      </div>

      {/* Mute Toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 rounded-full bg-black/50 p-2 backdrop-blur-sm hover:bg-black/70 transition-colors z-10"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-white" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-20">
        {/* Persona Info */}
        <div className="flex items-center gap-2 mb-2">
          {personaImageUrl && (
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image
                src={personaImageUrl}
                alt={personaName}
                fill
                className="object-cover"
              />
            </div>
          )}
          <span className="font-medium text-white text-sm">{personaName}</span>
        </div>

        {/* Caption */}
        {caption && (
          <p className="text-white text-sm line-clamp-2">{caption}</p>
        )}
      </div>
    </div>
  )
}
```

### 2. Create ReactionBar Component
Create: `/mnt/Data68/remrin/chat/components/moments/ReactionBar.tsx`

```typescript
"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'

const DEFAULT_REACTIONS = ['❤️', '💀', '😂', '😭', '🔥', '👍', '😍', '🤯']

interface ReactionBarProps {
  momentId: string
  reactions: Record<string, number>
  userReactions: string[]
  onReact: (emoji: string, isAdding: boolean) => Promise<void>
  className?: string
}

export function ReactionBar({
  momentId,
  reactions,
  userReactions,
  onReact,
  className
}: ReactionBarProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleReaction = async (emoji: string) => {
    const isAdding = !userReactions.includes(emoji)
    setIsLoading(emoji)
    try {
      await onReact(emoji, isAdding)
    } finally {
      setIsLoading(null)
    }
  }

  // Get top reactions to display
  const topReactions = Object.entries(reactions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([emoji]) => emoji)

  // Merge with default reactions, prioritizing those with counts
  const displayReactions = [
    ...topReactions,
    ...DEFAULT_REACTIONS.filter(e => !topReactions.includes(e))
  ].slice(0, 8)

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {displayReactions.map((emoji) => {
        const count = reactions[emoji] || 0
        const isActive = userReactions.includes(emoji)
        const isLoadingThis = isLoading === emoji

        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={isLoadingThis}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full transition-all",
              "border-2 min-w-[68px] justify-center",
              isActive
                ? "bg-rp-iris/20 border-rp-iris scale-105"
                : "bg-white/10 border-white/30 hover:scale-105 hover:bg-white/20",
              isLoadingThis && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="text-lg">{emoji}</span>
            {count > 0 && (
              <span className={cn(
                "text-sm font-medium",
                isActive ? "text-rp-iris" : "text-white"
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

### 3. Create FeedLayout Component
Create: `/mnt/Data68/remrin/chat/components/moments/FeedLayout.tsx`

```typescript
"use client"

import { useState, useRef, useEffect } from 'react'
import { VideoMomentCard } from './VideoMomentCard'
import { ReactionBar } from './ReactionBar'
import { MomentWithPersona } from '@/types/moments'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedLayoutProps {
  moments: MomentWithPersona[]
  onReact: (momentId: string, emoji: string, isAdding: boolean) => Promise<void>
  onView: (momentId: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

export function FeedLayout({
  moments,
  onReact,
  onView,
  onLoadMore,
  hasMore
}: FeedLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentMoment = moments[currentIndex]

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (hasMore && onLoadMore) {
      onLoadMore()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, moments.length])

  if (!currentMoment) {
    return <div className="text-center text-rp-subtle">No moments to display</div>
  }

  return (
    <div ref={containerRef} className="relative h-screen flex items-center justify-center bg-rp-base">
      {/* Previous Button */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 z-10 rounded-full bg-rp-surface/80 p-3 backdrop-blur-sm hover:bg-rp-surface transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-rp-text" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center gap-4 max-w-md w-full px-4">
        {/* Video Card */}
        {currentMoment.media_type === 'video' ? (
          <VideoMomentCard
            videoUrl={currentMoment.video_url!}
            thumbnailUrl={currentMoment.thumbnail_url}
            personaName={currentMoment.persona.name}
            personaImageUrl={currentMoment.persona.image_url}
            caption={currentMoment.caption}
            onView={() => onView(currentMoment.id)}
            autoPlay
            className="w-full max-h-[70vh]"
          />
        ) : (
          <div className="relative aspect-[9/16] w-full max-h-[70vh] overflow-hidden rounded-2xl">
            <img
              src={currentMoment.image_url!}
              alt={currentMoment.caption || ''}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Reactions */}
        <ReactionBar
          momentId={currentMoment.id}
          reactions={currentMoment.reactions_summary}
          userReactions={currentMoment.userReactions || []}
          onReact={(emoji, isAdding) => onReact(currentMoment.id, emoji, isAdding)}
        />

        {/* Progress Indicator */}
        <div className="flex gap-1">
          {moments.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 rounded-full transition-all",
                idx === currentIndex
                  ? "w-8 bg-rp-iris"
                  : "w-1 bg-rp-muted/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Next Button */}
      {(currentIndex < moments.length - 1 || hasMore) && (
        <button
          onClick={goToNext}
          className="absolute right-4 z-10 rounded-full bg-rp-surface/80 p-3 backdrop-blur-sm hover:bg-rp-surface transition-colors"
        >
          <ChevronRight className="h-6 w-6 text-rp-text" />
        </button>
      )}
    </div>
  )
}
```

### 4. Update MomentsGallery for Hybrid Layout
Update: `/mnt/Data68/remrin/chat/components/moments/MomentsGallery.tsx`

Add layout toggle and support both grid and feed views. Import and use `FeedLayout` component.

### 5. Create Upload Modal Component
Create: `/mnt/Data68/remrin/chat/components/moments/UploadMomentModal.tsx`

```typescript
"use client"

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadMomentModalProps {
  isOpen: boolean
  onClose: () => void
  personaId: string
  onSuccess?: () => void
}

export function UploadMomentModal({
  isOpen,
  onClose,
  personaId,
  onSuccess
}: UploadMomentModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const mediaType = file?.type.startsWith('video/') ? 'video' : 'image'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setPreview(url)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', mediaType)
      formData.append('personaId', personaId)
      formData.append('caption', caption)
      if (thumbnail) formData.append('thumbnail', thumbnail)

      const response = await fetch('/api/moments/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      onSuccess?.()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload moment')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setThumbnail(null)
    setCaption('')
    setPreview(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Moment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-rp-muted/30 rounded-lg p-8 text-center cursor-pointer hover:border-rp-iris/50 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto mb-2 text-rp-muted" />
              <p className="text-sm text-rp-subtle">Click to upload image or video</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              {preview && (
                mediaType === 'video' ? (
                  <video src={preview} controls className="w-full rounded-lg" />
                ) : (
                  <img src={preview} alt="Preview" className="w-full rounded-lg" />
                )
              )}
              <button
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                }}
                className="absolute top-2 right-2 rounded-full bg-black/50 p-1"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          )}

          {/* Thumbnail Upload for Videos */}
          {file && mediaType === 'video' && !thumbnail && (
            <Button
              variant="outline"
              onClick={() => thumbnailInputRef.current?.click()}
              className="w-full"
            >
              Add Thumbnail (Optional)
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="hidden"
              />
            </Button>
          )}

          {/* Caption */}
          <Textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none"
            rows={3}
          />

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Moment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Deliverables
1. ✅ VideoMomentCard with controls
2. ✅ ReactionBar with emoji support
3. ✅ FeedLayout (vertical TikTok-style)
4. ✅ Updated MomentsGallery (hybrid)
5. ✅ UploadMomentModal

## Success Criteria
- [ ] Videos play/pause on click
- [ ] Mute toggle works
- [ ] Reactions add/remove correctly
- [ ] Feed navigation works (arrows + keyboard)
- [ ] Upload modal handles images and videos
- [ ] All components match Rose Pine theme

## Dependencies
- AGENT 1 (database types)
- AGENT 2 (API endpoints)

## Handoff
Once complete, notify AGENT 4 (Integration) that components are ready.
