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
    "bg-rp-iris/20 text-rp-iris border-rp-iris/30",
    "bg-rp-foam/20 text-rp-foam border-rp-foam/30",
    "bg-rp-rose/20 text-rp-rose border-rp-rose/30",
    "bg-rp-gold/20 text-rp-gold border-rp-gold/30",
    "bg-rp-pine/20 text-rp-pine border-rp-pine/30",
    "bg-rp-love/20 text-rp-love border-rp-love/30"
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
                "group relative overflow-hidden rounded-2xl bg-rp-surface backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-rp-iris/10",
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
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-rp-iris/50 to-rp-foam/50">
                        <span className="text-6xl font-bold text-rp-text/50">
                            {name.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rp-base/80 via-transparent to-transparent" />

                {/* Character Name */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-rp-text drop-shadow-lg">
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
                        <Badge className="rounded-full border border-rp-muted bg-rp-surface/50 px-3 py-1 text-xs font-medium text-rp-subtle">
                            +{tags.length - 4}
                        </Badge>
                    )}
                </div>
            )}
        </div>
    )
}
