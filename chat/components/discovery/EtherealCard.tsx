"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { ElectricCard } from "@/components/ui/electric-card"
import { IconHeart, IconMessageCircle, IconSparkles } from "@tabler/icons-react"

interface EtherealCardProps {
    id: string
    name: string
    description?: string | null
    imageUrl?: string | null
    rarity?: "common" | "rare" | "epic" | "legendary"
    messageCount?: number
    followersCount?: number
    isNew?: boolean
    isFeatured?: boolean
    onClick?: () => void
    className?: string
}

export function EtherealCard({
    id,
    name,
    description,
    imageUrl,
    rarity = "common",
    messageCount = 0,
    followersCount = 0,
    isNew = false,
    isFeatured = false,
    onClick,
    className
}: EtherealCardProps) {
    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
        return count.toString()
    }

    return (
        <ElectricCard rarity={rarity} onClick={onClick} className={className}>
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl">
                {/* Image */}
                <div className="absolute inset-0">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rp-iris/50 to-rp-rose/50 flex items-center justify-center">
                            <span className="text-4xl font-bold text-rp-text/30">
                                {name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rp-base/90 via-rp-base/20 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {isNew && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rp-foam to-rp-pine text-[10px] font-bold text-rp-base uppercase tracking-wider">
                            New
                        </span>
                    )}
                    {isFeatured && (
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rp-gold to-rp-rose text-[10px] font-bold text-rp-base uppercase tracking-wider flex items-center gap-1">
                            <IconSparkles size={10} />
                            Featured
                        </span>
                    )}
                </div>

                {/* Rarity indicator */}
                {rarity !== "common" && (
                    <div className="absolute top-3 right-3">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            rarity === "rare" && "bg-rp-iris/80 text-rp-base",
                            rarity === "epic" && "bg-rp-rose/80 text-rp-base",
                            rarity === "legendary" && "bg-gradient-to-r from-rp-gold to-rp-love text-rp-base"
                        )}>
                            {rarity}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white truncate mb-1">
                        {name}
                    </h3>
                    {description && (
                        <p className="text-xs text-white/60 line-clamp-2 mb-3">
                            {description}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-white/50">
                        <div className="flex items-center gap-1">
                            <IconMessageCircle size={14} />
                            <span>{formatCount(messageCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <IconHeart size={14} />
                            <span>{formatCount(followersCount)}</span>
                        </div>
                    </div>
                </div>

                {/* Hover shine effect */}
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, transparent 50%)",
                            animation: "shine 2s infinite"
                        }}
                    />
                </div>
            </div>
        </ElectricCard>
    )
}

// Add keyframes to globals
// @keyframes shine {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
