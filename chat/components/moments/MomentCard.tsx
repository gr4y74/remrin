"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Heart } from "lucide-react"
import { useState } from "react"

interface MomentCardProps {
    id: string
    imageUrl: string
    caption: string | null
    likesCount: number
    isLiked: boolean
    personaName: string
    personaImageUrl: string | null
    onClick?: () => void
    onLike?: (id: string, liked: boolean) => Promise<void>
    className?: string
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

export function MomentCard({
    id,
    imageUrl,
    caption,
    likesCount,
    isLiked: initialIsLiked,
    personaName,
    personaImageUrl,
    onClick,
    onLike,
    className
}: MomentCardProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [currentLikes, setCurrentLikes] = useState(likesCount)
    const [isLiking, setIsLiking] = useState(false)

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isLiking || !onLike) return

        setIsLiking(true)
        const newLikedState = !isLiked

        // Optimistic update
        setIsLiked(newLikedState)
        setCurrentLikes((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)))

        try {
            await onLike(id, newLikedState)
        } catch (error) {
            // Revert on error
            setIsLiked(!newLikedState)
            setCurrentLikes((prev) =>
                newLikedState ? Math.max(0, prev - 1) : prev + 1
            )
            console.error("Error toggling like:", error)
        } finally {
            setIsLiking(false)
        }
    }

    return (
        <div
            className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/5 transition-all duration-300",
                "hover:scale-[1.02] hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/20",
                className
            )}
            onClick={onClick}
        >
            {/* Moment Image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={caption || "Moment"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Gradient Overlay - stronger on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Glassmorphism overlay on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100" />

                {/* Persona Avatar + Name (top left) */}
                <div className="absolute left-3 top-3 flex items-center gap-2">
                    <div className="relative size-8 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                        {personaImageUrl ? (
                            <Image
                                src={personaImageUrl}
                                alt={personaName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-600 to-cyan-500 text-xs font-bold text-white">
                                {personaName.slice(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-medium text-white drop-shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {personaName}
                    </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Caption - truncated, full on hover */}
                    {caption && (
                        <p className="mb-3 line-clamp-2 text-sm text-white/90 drop-shadow-lg transition-all duration-300 group-hover:line-clamp-none">
                            {caption}
                        </p>
                    )}

                    {/* Like Button */}
                    <button
                        onClick={handleLikeClick}
                        disabled={isLiking}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                            "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                            isLiked ? "text-red-500" : "text-white/80 hover:text-white"
                        )}
                    >
                        <Heart
                            className={cn(
                                "size-4 transition-transform duration-200",
                                isLiked && "fill-red-500 scale-110",
                                isLiking && "animate-pulse"
                            )}
                        />
                        <span>{formatCount(currentLikes)}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
