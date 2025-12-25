"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { FC, useEffect, useState } from "react"

interface VisionLoadingProps {
    /** Current status of portrait generation */
    status: "loading" | "complete"
    /** URL of the generated portrait image */
    imageUrl?: string
    /** Additional CSS classes */
    className?: string
}

/**
 * VisionLoading - Portrait generation loading state with reveal animation
 * Shows animated smoke/orb effect during loading, morphs to reveal image when complete
 */
export const VisionLoading: FC<VisionLoadingProps> = ({
    status,
    imageUrl,
    className
}) => {
    const [showImage, setShowImage] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Handle status transition
    useEffect(() => {
        if (status === "complete" && imageUrl) {
            // Slight delay before revealing to ensure smooth transition
            const timer = setTimeout(() => {
                setShowImage(true)
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setShowImage(false)
            setImageLoaded(false)
        }
    }, [status, imageUrl])

    return (
        <div
            className={cn(
                "relative mx-auto size-64",
                className
            )}
        >
            {/* Outer glow ring */}
            <div
                className={cn(
                    "absolute inset-0 rounded-full",
                    "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500",
                    "animate-gradient-rotate opacity-50 blur-xl",
                    status === "complete" && showImage && "opacity-0 transition-opacity duration-1000"
                )}
            />

            {/* Main circular container */}
            <div
                className={cn(
                    "relative size-full overflow-hidden rounded-full",
                    "bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900",
                    "border-2 border-white/10",
                    "shadow-2xl shadow-purple-500/20"
                )}
            >
                {/* Animated orb background */}
                <div
                    className={cn(
                        "absolute inset-0",
                        "bg-gradient-conic from-violet-600 via-purple-500 to-pink-500",
                        "animate-orb-pulse",
                        status === "complete" && showImage && "opacity-0 transition-opacity duration-700"
                    )}
                    style={{
                        backgroundSize: "200% 200%"
                    }}
                />

                {/* Smoke particles */}
                {status === "loading" && (
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="smoke-particle animate-smoke-rise absolute rounded-full bg-white/20 blur-sm"
                                style={{
                                    width: `${20 + Math.random() * 30}px`,
                                    height: `${20 + Math.random() * 30}px`,
                                    left: `${10 + Math.random() * 80}%`,
                                    bottom: "-20%",
                                    animationDelay: `${i * 0.3}s`,
                                    animationDuration: `${2 + Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Loading state */}
                    {status === "loading" && (
                        <div className="animate-fade-in px-6 text-center">
                            <p className="mb-3 text-sm font-medium text-white/80">
                                Your companion takes form
                            </p>
                            <div className="flex items-center justify-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="size-2 animate-pulse rounded-full bg-white/60"
                                        style={{
                                            animationDelay: `${i * 200}ms`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generated image */}
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt="Soul portrait"
                            fill
                            className={cn(
                                "absolute inset-0 size-full object-cover",
                                "transition-all duration-1000 ease-out",
                                showImage && imageLoaded
                                    ? "scale-100 opacity-100"
                                    : "scale-110 opacity-0"
                            )}
                            onLoad={() => setImageLoaded(true)}
                            unoptimized={imageUrl.startsWith("data:")}
                        />
                    )}
                </div>

                {/* Inner vignette */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-radial-gradient from-transparent via-transparent to-black/40",
                        "pointer-events-none"
                    )}
                />
            </div>
        </div>
    )
}

export default VisionLoading
