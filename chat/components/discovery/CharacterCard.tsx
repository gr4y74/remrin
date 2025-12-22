"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CharacterCardProps {
    id: string
    name: string
    imageUrl: string | null
    category: string | null
    categoryColor?: string | null
    totalChats: number
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

export function CharacterCard({
    id,
    name,
    imageUrl,
    category,
    categoryColor,
    totalChats,
    className
}: CharacterCardProps) {
    return (
        <Link href={`/character/${id}`} className="block">
            <div
                className={cn(
                    "group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 transition-all duration-300",
                    "hover:scale-[1.03] hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/20",
                    className
                )}
            >
                {/* Portrait Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-600/50 to-cyan-500/50">
                            <span className="text-4xl font-bold text-white/50">
                                {name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Stats Badge */}
                    <div className="absolute right-3 top-3">
                        <Badge className="flex items-center gap-1 rounded-full border-0 bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                            <MessageCircle className="size-3" />
                            <span>{formatCount(totalChats)}</span>
                        </Badge>
                    </div>

                    {/* Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Category Badge */}
                        {category && (
                            <Badge
                                className="mb-2 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                    backgroundColor: categoryColor
                                        ? `${categoryColor}30`
                                        : "rgba(139, 92, 246, 0.3)",
                                    color: categoryColor || "#a78bfa"
                                }}
                            >
                                {category}
                            </Badge>
                        )}

                        {/* Character Name */}
                        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow-lg">
                            {name}
                        </h3>
                    </div>
                </div>
            </div>
        </Link>
    )
}
