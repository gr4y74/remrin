"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, Share2, ChevronLeft, ChevronRight, X, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface MomentModalProps {
    isOpen: boolean
    onClose: () => void
    moment: {
        id: string
        imageUrl: string
        caption: string | null
        likesCount: number
        isLiked: boolean
        persona: {
            id: string
            name: string
            imageUrl: string | null
        }
    }
    onLike?: (id: string, liked: boolean) => Promise<void>
    onPrev?: () => void
    onNext?: () => void
}

// Format large numbers: 12500 -> "12.5K"
function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
}

export function MomentModal({
    isOpen,
    onClose,
    moment,
    onLike,
    onPrev,
    onNext
}: MomentModalProps) {
    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && onPrev) {
                onPrev()
            } else if (e.key === "ArrowRight" && onNext) {
                onNext()
            } else if (e.key === "Escape") {
                onClose()
            }
        },
        [onPrev, onNext, onClose]
    )

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, handleKeyDown])

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Moment by ${moment.persona.name}`,
                    text: moment.caption || `Check out this moment!`,
                    url: window.location.href
                })
            } catch (error) {
                // User cancelled or share failed
                console.log("Share cancelled or failed")
            }
        } else {
            // Fallback: copy link to clipboard
            await navigator.clipboard.writeText(window.location.href)
            // Could show a toast here
        }
    }

    const handleLikeClick = async () => {
        if (onLike) {
            await onLike(moment.id, !moment.isLiked)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[95vh] max-w-5xl flex-col gap-0 overflow-hidden border-white/10 bg-[#0d1117]/95 p-0 backdrop-blur-xl sm:rounded-2xl">
                <VisuallyHidden>
                    <DialogTitle>Moment by {moment.persona.name}</DialogTitle>
                </VisuallyHidden>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white/70 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
                >
                    <X className="size-5" />
                </button>

                <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
                    {/* Image Section */}
                    <div className="relative flex-1 bg-black">
                        {/* Navigation Arrows */}
                        {onPrev && (
                            <button
                                onClick={onPrev}
                                className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/70 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                            >
                                <ChevronLeft className="size-6" />
                            </button>
                        )}
                        {onNext && (
                            <button
                                onClick={onNext}
                                className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white/70 backdrop-blur-sm transition-all hover:bg-black/70 hover:text-white"
                            >
                                <ChevronRight className="size-6" />
                            </button>
                        )}

                        {/* Main Image */}
                        <div className="relative aspect-square w-full md:aspect-auto md:h-full">
                            <Image
                                src={moment.imageUrl}
                                alt={moment.caption || "Moment"}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 60vw"
                                priority
                            />
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex w-full flex-col border-t border-white/10 md:w-80 md:border-l md:border-t-0">
                        {/* Persona Header */}
                        <div className="flex items-center gap-3 border-b border-white/10 p-4">
                            <div className="relative size-10 overflow-hidden rounded-full border-2 border-white/20">
                                {moment.persona.imageUrl ? (
                                    <Image
                                        src={moment.persona.imageUrl}
                                        alt={moment.persona.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-600 to-cyan-500 text-sm font-bold text-white">
                                        {moment.persona.name.slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-white">
                                    {moment.persona.name}
                                </p>
                            </div>
                        </div>

                        {/* Caption */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {moment.caption ? (
                                <p className="text-sm leading-relaxed text-zinc-300">
                                    {moment.caption}
                                </p>
                            ) : (
                                <p className="text-sm italic text-zinc-500">
                                    No caption
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-white/10 p-4 space-y-3">
                            {/* Action Buttons */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleLikeClick}
                                    className={cn(
                                        "flex items-center gap-2 transition-colors",
                                        moment.isLiked
                                            ? "text-red-500"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    <Heart
                                        className={cn(
                                            "size-6",
                                            moment.isLiked && "fill-red-500"
                                        )}
                                    />
                                    <span className="font-medium">
                                        {formatCount(moment.likesCount)}
                                    </span>
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
                                >
                                    <Share2 className="size-5" />
                                    <span>Share</span>
                                </button>
                            </div>

                            {/* View Character Link */}
                            <Link href={`/character/${moment.persona.id}`}>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                                >
                                    <User className="mr-2 size-4" />
                                    View Character
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
