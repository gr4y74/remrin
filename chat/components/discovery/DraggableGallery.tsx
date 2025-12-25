"use client"

import { useState } from "react"
import { EtherealCard } from "./EtherealCard"
import { cn } from "@/lib/utils"
import { IconSettings, IconX } from "@tabler/icons-react"
import Image from "next/image"

interface GalleryItem {
    id: string
    name: string
    description?: string | null
    imageUrl?: string | null
    rarity?: "common" | "rare" | "epic" | "legendary"
    messageCount?: number
    followersCount?: number
}

interface DraggableGalleryProps {
    items: GalleryItem[]
    onItemClick: (item: GalleryItem) => void
    className?: string
}

interface GridConfig {
    columns: number
    gap: number
}

export function DraggableGallery({
    items,
    onItemClick,
    className
}: DraggableGalleryProps) {
    const [showControls, setShowControls] = useState(false)
    const [expandedItem, setExpandedItem] = useState<GalleryItem | null>(null)
    const [config, setConfig] = useState<GridConfig>({
        columns: 6,
        gap: 16
    })

    // Click to expand flow
    const handleCardClick = (item: GalleryItem) => {
        setExpandedItem(item)
    }

    const handleExpandedClick = () => {
        if (expandedItem) {
            onItemClick(expandedItem)
            setExpandedItem(null)
        }
    }

    const handleCloseExpanded = () => {
        setExpandedItem(null)
    }

    const handleConfigChange = (key: keyof GridConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }))
    }

    return (
        <>
            {/* Grid Container - normal flow, centered */}
            <div
                className={cn(
                    "w-full px-4 pb-8",
                    className
                )}
            >
                {/* Grid with centered auto-fit columns */}
                <div
                    className="mx-auto max-w-7xl"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
                        gap: `${config.gap}px`,
                        justifyItems: "center"
                    }}
                >
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="w-full max-w-[280px] cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                            onClick={() => handleCardClick(item)}
                        >
                            <EtherealCard
                                id={item.id}
                                name={item.name}
                                description={item.description}
                                imageUrl={item.imageUrl}
                                rarity={item.rarity}
                                messageCount={item.messageCount}
                                followersCount={item.followersCount}
                                isNew={index < 3}
                            />
                        </div>
                    ))}
                </div>

                {/* Settings toggle - fixed position */}
                <button
                    onClick={() => setShowControls(!showControls)}
                    className={cn(
                        "fixed bottom-6 right-6 z-40 p-3 rounded-full transition-all shadow-lg",
                        showControls
                            ? "bg-rp-iris text-rp-base"
                            : "bg-rp-base/60 backdrop-blur-md border border-rp-muted text-rp-subtle hover:text-rp-text"
                    )}
                    title="Grid Settings"
                >
                    <IconSettings size={20} />
                </button>

                {/* Settings panel */}
                {showControls && (
                    <div className="fixed bottom-20 right-6 z-40 p-4 w-64 rounded-xl bg-rp-surface backdrop-blur-md border border-rp-muted shadow-xl">
                        <h4 className="text-sm font-medium text-rp-text mb-3">Grid Settings</h4>
                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="text-rp-muted block mb-1">Gap</label>
                                <input
                                    type="range"
                                    min="8"
                                    max="32"
                                    value={config.gap}
                                    onChange={(e) => handleConfigChange('gap', parseInt(e.target.value))}
                                    className="w-full accent-rp-iris"
                                    title="Gap size"
                                />
                                <span className="text-rp-subtle">{config.gap}px</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Expanded view overlay - PORTAL-LIKE: fixed with highest z-index */}
            {expandedItem && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-rp-base/90 backdrop-blur-sm"
                    onClick={handleCloseExpanded}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div
                        className="relative max-w-3xl w-full mx-4 animate-fade-in-scale"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCloseExpanded}
                            className="absolute -top-12 right-0 p-2 text-rp-subtle hover:text-rp-text transition-colors z-10"
                            title="Close"
                        >
                            <IconX size={28} />
                        </button>

                        {/* Expanded card */}
                        <div className="flex flex-col md:flex-row gap-6 bg-rp-surface rounded-2xl overflow-hidden border border-rp-highlight-med shadow-2xl">
                            {/* Large image */}
                            <div className="relative w-full md:w-1/2 aspect-square md:aspect-[3/4] min-h-[300px]">
                                {expandedItem.imageUrl ? (
                                    <Image
                                        src={expandedItem.imageUrl}
                                        alt={expandedItem.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-rp-iris/50 to-rp-rose/50 flex items-center justify-center">
                                        <span className="text-6xl font-bold text-rp-text/30">
                                            {expandedItem.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                                {/* Rarity badge */}
                                {expandedItem.rarity && expandedItem.rarity !== "common" && (
                                    <span className={cn(
                                        "inline-flex w-fit px-3 py-1 rounded-full text-xs font-bold uppercase mb-4",
                                        expandedItem.rarity === "rare" && "bg-rp-iris text-rp-base",
                                        expandedItem.rarity === "epic" && "bg-rp-rose text-rp-base",
                                        expandedItem.rarity === "legendary" && "bg-gradient-to-r from-rp-gold to-rp-love text-rp-base"
                                    )}>
                                        {expandedItem.rarity}
                                    </span>
                                )}

                                <h2 className="text-2xl md:text-3xl font-bold text-rp-text mb-4">
                                    {expandedItem.name}
                                </h2>

                                <p className="text-rp-subtle mb-6 leading-relaxed text-sm md:text-base">
                                    {expandedItem.description || "A mysterious soul waiting to be discovered..."}
                                </p>

                                {/* Stats */}
                                <div className="flex gap-4 text-sm text-rp-muted mb-6">
                                    <span>💬 {(expandedItem.messageCount || 0).toLocaleString()}</span>
                                    <span>❤️ {(expandedItem.followersCount || 0).toLocaleString()}</span>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={handleExpandedClick}
                                    className="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-rp-iris to-rp-rose text-rp-base font-semibold hover:from-rp-iris/80 hover:to-rp-rose/80 transition-all shadow-lg shadow-rp-iris/25"
                                >
                                    Start Chatting
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
