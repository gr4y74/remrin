"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export interface Banner {
    id: string
    title: string
    image_url: string
    link_url: string | null
    sort_order: number
    is_active: boolean
}

interface RotatingBannerProps {
    banners: Banner[]
    autoRotateInterval?: number
}

export function RotatingBanner({ banners, autoRotateInterval = 5000 }: RotatingBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    // Only show active banners
    const activeBanners = banners.filter(b => b.is_active)

    useEffect(() => {
        if (activeBanners.length <= 1 || isHovered) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
        }, autoRotateInterval)

        return () => clearInterval(timer)
    }, [activeBanners.length, isHovered, autoRotateInterval])

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
    }

    if (activeBanners.length === 0) return null

    return (
        <div
            className="relative w-full aspect-[21/6] md:aspect-[21/5] lg:aspect-[21/4] overflow-hidden rounded-2xl group shadow-2xl bg-rp-base my-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    <Image
                        src={activeBanners[currentIndex].image_url}
                        alt={activeBanners[currentIndex].title}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 pointer-events-none">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl md:text-4xl font-black uppercase text-white drop-shadow-lg max-w-2xl leading-tight"
                        >
                            {activeBanners[currentIndex].title}
                        </motion.h2>
                    </div>

                    {/* Clickable Area */}
                    {activeBanners[currentIndex].link_url && (
                        <Link
                            href={activeBanners[currentIndex].link_url!}
                            className="absolute inset-0 z-10"
                            aria-label={`Visit ${activeBanners[currentIndex].title}`}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            {activeBanners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prevSlide() }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/50"
                    >
                        <IconChevronLeft size={24} />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextSlide() }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/50"
                    >
                        <IconChevronRight size={24} />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-4 right-6 z-20 flex gap-2">
                        {activeBanners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.preventDefault(); setCurrentIndex(idx) }}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all shadow-sm",
                                    idx === currentIndex
                                        ? "bg-white w-6"
                                        : "bg-white/50 hover:bg-white/80"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
