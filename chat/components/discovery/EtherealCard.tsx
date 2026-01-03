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
    hashtags?: string[]
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
    hashtags = [],
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
            <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl">
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
                        <div className="from-rp-iris/50 to-rp-rose/50 flex size-full items-center justify-center bg-gradient-to-br">
                            <span className="text-rp-text/30 text-4xl font-bold">
                                {name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>


                {/* Badges */}
                <div className="absolute left-3 top-3 flex gap-2">
                    {isNew && (
                        <span className="from-rp-foam to-rp-pine text-rp-base rounded-full bg-gradient-to-r px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                            New
                        </span>
                    )}
                    {isFeatured && (
                        <span className="from-rp-gold to-rp-rose text-rp-base flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                            <IconSparkles size={10} />
                            Featured
                        </span>
                    )}
                </div>

                {/* Rarity indicator */}
                {rarity !== "common" && (
                    <div className="absolute right-3 top-3">
                        <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                            rarity === "rare" && "bg-rp-iris/80 text-rp-base",
                            rarity === "epic" && "bg-rp-rose/80 text-rp-base",
                            rarity === "legendary" && "from-rp-gold to-rp-love text-rp-base bg-gradient-to-r"
                        )}>
                            {rarity}
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="mb-1 truncate text-lg font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                        {name}
                    </h3>

                    {/* Description - visible on hover */}
                    {description && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="mb-3 line-clamp-3 text-sm text-white/90 bg-black/40 backdrop-blur-sm rounded-lg p-2">
                                {description}
                            </p>
                        </div>
                    )}

                    {/* Hashtags - show first 2 */}
                    {hashtags.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                            {hashtags.slice(0, 2).map(tag => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-xs text-white/80"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
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
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 hover:opacity-100">
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
