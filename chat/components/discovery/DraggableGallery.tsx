"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"
import { EtherealCard } from "./EtherealCard"
import { cn } from "@/lib/utils"

// Register GSAP plugins
if (typeof window !== "undefined") {
    gsap.registerPlugin(Draggable)
}

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

export function DraggableGallery({
    items,
    onItemClick,
    className
}: DraggableGalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const gridRef = useRef<HTMLDivElement>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const draggableRef = useRef<Draggable[]>([])

    // Configuration
    const config = {
        itemSize: 280,
        gap: 24,
        cols: Math.ceil(Math.sqrt(items.length * 1.5)),
        zoom: 0.7
    }

    const calculateGridDimensions = useCallback(() => {
        const rows = Math.ceil(items.length / config.cols)
        const width = config.cols * (config.itemSize + config.gap)
        const height = rows * (config.itemSize * 1.33 + config.gap) // 3:4 aspect ratio
        return { width, height, rows }
    }, [items.length, config.cols, config.itemSize, config.gap])

    // Initialize draggable
    useEffect(() => {
        if (!wrapperRef.current || !containerRef.current || items.length === 0) return

        const { width, height } = calculateGridDimensions()

        // Set wrapper size
        gsap.set(wrapperRef.current, {
            width: width,
            height: height,
            scale: config.zoom
        })

        // Center initially
        const viewportWidth = containerRef.current.offsetWidth
        const viewportHeight = containerRef.current.offsetHeight
        const scaledWidth = width * config.zoom
        const scaledHeight = height * config.zoom

        gsap.set(wrapperRef.current, {
            x: (viewportWidth - scaledWidth) / 2,
            y: (viewportHeight - scaledHeight) / 2
        })

        // Create draggable
        draggableRef.current = Draggable.create(wrapperRef.current, {
            type: "x,y",
            inertia: true,
            bounds: {
                minX: viewportWidth - scaledWidth - 100,
                maxX: 100,
                minY: viewportHeight - scaledHeight - 100,
                maxY: 100
            },
            edgeResistance: 0.8,
            throwResistance: 0.3,
            cursor: "grab",
            activeCursor: "grabbing",
            onDrag: function () {
                updateItemVisibility()
            },
            onThrowUpdate: function () {
                updateItemVisibility()
            }
        })

        // Animate items in
        const gridItems = gridRef.current?.children
        if (gridItems) {
            gsap.fromTo(
                gridItems,
                {
                    opacity: 0,
                    scale: 0.8,
                    y: 50
                },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: {
                        from: "center",
                        amount: 0.5
                    },
                    ease: "back.out(1.4)",
                    onComplete: () => setIsLoaded(true)
                }
            )
        }

        return () => {
            draggableRef.current.forEach(d => d.kill())
        }
    }, [items, calculateGridDimensions, config.zoom])

    // Update visibility based on viewport
    const updateItemVisibility = useCallback(() => {
        if (!containerRef.current || !gridRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()
        const items = gridRef.current.children

        Array.from(items).forEach((item) => {
            const rect = item.getBoundingClientRect()
            const isVisible =
                rect.right > containerRect.left - 100 &&
                rect.left < containerRect.right + 100 &&
                rect.bottom > containerRect.top - 100 &&
                rect.top < containerRect.bottom + 100

            gsap.to(item, {
                opacity: isVisible ? 1 : 0.2,
                scale: isVisible ? 1 : 0.9,
                duration: 0.3,
                ease: "power2.out"
            })
        })
    }, [])

    // Handle wheel zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault()
        if (!wrapperRef.current) return

        const delta = e.deltaY > 0 ? -0.05 : 0.05
        const currentScale = gsap.getProperty(wrapperRef.current, "scale") as number
        const newScale = Math.max(0.3, Math.min(1.2, currentScale + delta))

        gsap.to(wrapperRef.current, {
            scale: newScale,
            duration: 0.3,
            ease: "power2.out",
            onUpdate: () => updateItemVisibility()
        })
    }, [updateItemVisibility])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener("wheel", handleWheel, { passive: false })
        return () => container.removeEventListener("wheel", handleWheel)
    }, [handleWheel])

    const { width: gridWidth, rows } = calculateGridDimensions()

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-[80vh] overflow-hidden",
                "bg-gradient-to-b from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]",
                className
            )}
        >
            {/* Ethereal background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-ethereal-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-500/10 blur-3xl animate-ethereal-float" style={{ animationDelay: "-2s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
            </div>

            {/* Draggable wrapper */}
            <div
                ref={wrapperRef}
                className="absolute origin-center will-change-transform"
                style={{
                    width: gridWidth,
                    transformOrigin: "center center"
                }}
            >
                {/* Grid container */}
                <div
                    ref={gridRef}
                    className="grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${config.cols}, ${config.itemSize}px)`,
                        gap: config.gap,
                        padding: config.gap
                    }}
                >
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="transition-shadow duration-300 hover:z-10"
                            style={{
                                opacity: 0 // Will be animated in
                            }}
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
                                onClick={() => onItemClick(item)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Instructions overlay */}
            {isLoaded && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/40 text-sm pointer-events-none">
                    <span className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded bg-white/10 text-xs">Drag</kbd>
                        to explore
                    </span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-2 py-1 rounded bg-white/10 text-xs">Scroll</kbd>
                        to zoom
                    </span>
                </div>
            )}
        </div>
    )
}
