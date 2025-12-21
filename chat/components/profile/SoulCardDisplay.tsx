"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SoulCardDisplayProps {
    name: string
    imageUrl: string | null
    tags: string[]
    className?: string
}

// Color palette for tag pills
const tagColors = [
    "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    "bg-pink-500/20 text-pink-300 border-pink-500/30",
    "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "bg-blue-500/20 text-blue-300 border-blue-500/30"
]

function getTagColor(index: number): string {
    return tagColors[index % tagColors.length]
}

export function SoulCardDisplay({
    name,
    imageUrl,
    tags,
    className
}: SoulCardDisplayProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10",
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
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-600/50 to-cyan-500/50">
                        <span className="text-6xl font-bold text-white/50">
                            {name.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Character Name */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                        {name}
                    </h3>
                </div>
            </div>

            {/* Tags Section */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4">
                    {tags.slice(0, 4).map((tag, index) => (
                        <Badge
                            key={tag}
                            className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium",
                                getTagColor(index)
                            )}
                        >
                            {tag}
                        </Badge>
                    ))}
                    {tags.length > 4 && (
                        <Badge className="rounded-full border border-zinc-600 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-400">
                            +{tags.length - 4}
                        </Badge>
                    )}
                </div>
            )}
        </div>
    )
}
