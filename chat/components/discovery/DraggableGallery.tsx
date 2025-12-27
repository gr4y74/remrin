"use client"

import { useState } from "react"
import { EtherealCard } from "./EtherealCard"
import { cn } from "@/lib/utils"
import { IconSettings, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { TYPOGRAPHY } from "@/lib/design-system"

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
                        "fixed bottom-6 right-6 z-40 rounded-full p-3 shadow-lg transition-all",
                        showControls
                            ? "bg-rp-iris text-rp-base"
                            : "bg-rp-base/60 border-rp-muted text-rp-subtle hover:text-rp-text border backdrop-blur-md"
                    )}
                    title="Grid Settings"
                >
                    <IconSettings size={20} />
                </button>

                {/* Settings panel */}
                {showControls && (
                    <div className="bg-rp-surface border-rp-muted fixed bottom-20 right-6 z-40 w-64 rounded-xl border p-4 shadow-xl backdrop-blur-md">
                        <h4 className={`${TYPOGRAPHY.body.normal} text-rp-text mb-3 font-medium`}>Grid Settings</h4>
                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="text-rp-muted mb-1 block">Gap</label>
                                <input
                                    type="range"
                                    min="8"
                                    max="32"
                                    value={config.gap}
                                    onChange={(e) => handleConfigChange('gap', parseInt(e.target.value))}
                                    className="accent-rp-iris w-full"
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
                    className="bg-rp-base/90 fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
                    onClick={handleCloseExpanded}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div
                        className="animate-fade-in-scale relative mx-4 w-full max-w-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCloseExpanded}
                            className="text-rp-subtle hover:text-rp-text absolute -top-12 right-0 z-10 p-2 transition-colors"
                            title="Close"
                        >
                            <IconX size={28} />
                        </button>

                        {/* Expanded card */}
                        <div className="bg-rp-surface border-rp-highlight-med flex flex-col gap-6 overflow-hidden rounded-2xl border shadow-2xl md:flex-row">
                            {/* Large image */}
                            <div className="relative aspect-square min-h-[300px] w-full md:aspect-[3/4] md:w-1/2">
                                {expandedItem.imageUrl ? (
                                    <Image
                                        src={expandedItem.imageUrl}
                                        alt={expandedItem.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="from-rp-iris/50 to-rp-rose/50 flex size-full items-center justify-center bg-gradient-to-br">
                                        <span className="text-rp-text/30 text-6xl font-bold">
                                            {expandedItem.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                                {/* Rarity badge */}
                                {expandedItem.rarity && expandedItem.rarity !== "common" && (
                                    <span className={cn(
                                        "mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase",
                                        expandedItem.rarity === "rare" && "bg-rp-iris text-rp-base",
                                        expandedItem.rarity === "epic" && "bg-rp-rose text-rp-base",
                                        expandedItem.rarity === "legendary" && "from-rp-gold to-rp-love text-rp-base bg-gradient-to-r"
                                    )}>
                                        {expandedItem.rarity}
                                    </span>
                                )}

                                <h2 className={`${TYPOGRAPHY.heading.h2} text-rp-text mb-4`}>
                                    {expandedItem.name}
                                </h2>

                                <p className="text-rp-subtle mb-6 text-sm leading-relaxed md:text-base">
                                    {expandedItem.description || "A mysterious soul waiting to be discovered..."}
                                </p>

                                {/* Stats */}
                                <div className="text-rp-muted mb-6 flex gap-4 text-sm">
                                    <span>💬 {(expandedItem.messageCount || 0).toLocaleString()}</span>
                                    <span>❤️ {(expandedItem.followersCount || 0).toLocaleString()}</span>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={handleExpandedClick}
                                    className="from-rp-iris to-rp-rose text-rp-base hover:from-rp-iris/80 hover:to-rp-rose/80 shadow-rp-iris/25 w-full rounded-xl bg-gradient-to-r py-3 font-semibold shadow-lg transition-all md:py-4"
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
