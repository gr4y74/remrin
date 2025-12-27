"use client"

import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { cn } from "@/lib/utils"

interface LottieLoaderProps {
    className?: string
    size?: number
}

export function LottieLoader({ className, size = 96 }: LottieLoaderProps) {
    return (
        <div
            className={cn("inline-flex items-center justify-center", className)}
            style={{ width: size, height: size }}
        >
            <DotLottieReact
                src="/dragon.lottie"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    )
}
