"use client"

import { usePathname } from "next/navigation"
import { WaveBackground } from "@/components/backgrounds/WaveBackground"
import { useMemo } from "react"

export function BackgroundManager() {
    const pathname = usePathname()

    // Define color palettes for different sections
    const themes = useMemo(() => ({
        // Default Purple (Home, Collection, Profile)
        default: [
            'hsl(189 43% 73% / 0.4)',  // Foam
            'hsl(2 55% 83% / 0.5)',    // Rose
            'hsl(267 57% 78% / 0.6)',  // Iris
            'hsl(343 76% 68% / 0.7)',  // Love
            'hsl(267 57% 48% / 0.8)',  // Deep Purple
            'hsl(267 57% 28% / 0.9)'   // Dark Base
        ],
        // Feed - Blue/Neutral/Info
        feed: [
            'hsl(189 43% 73% / 0.4)',  // Foam (Light)
            'hsl(197 49% 38% / 0.4)',  // Pine (Medium)
            'hsl(248 15% 55% / 0.5)',  // Muted
            'hsl(249 22% 52% / 0.6)',  // Iris Muted
            'hsl(249 19% 25% / 0.7)',  // Surface
            'hsl(249 22% 18% / 0.8)'   // Base
        ],
        // Summon - Gold/Orange/Creation
        summon: [
            'hsl(35 88% 72% / 0.4)',   // Gold
            'hsl(2 55% 83% / 0.5)',    // Rose
            'hsl(35 80% 60% / 0.6)',   // Gold Dark
            'hsl(343 76% 58% / 0.7)',  // Love Dark
            'hsl(20 50% 30% / 0.8)',   // Earthy
            'hsl(267 57% 28% / 0.9)'   // Dark Base
        ],
        // Marketplace - Green/Foam/Commerce
        marketplace: [
            'hsl(150 60% 70% / 0.4)',  // Fresh Green
            'hsl(189 43% 73% / 0.5)',  // Foam
            'hsl(197 49% 38% / 0.6)',  // Pine
            'hsl(150 40% 40% / 0.7)',  // Dark Green
            'hsl(197 30% 25% / 0.8)',  // Dark Pine
            'hsl(267 57% 28% / 0.9)'   // Dark Base
        ],
        // Studio - Rose/Pink/Creativity
        studio: [
            'hsl(2 55% 83% / 0.4)',    // Rose
            'hsl(343 76% 68% / 0.5)',  // Love
            'hsl(343 70% 50% / 0.6)',  // Deep Love
            'hsl(267 57% 78% / 0.7)',  // Iris
            'hsl(280 40% 30% / 0.8)',  // Dark Purple
            'hsl(267 57% 28% / 0.9)'   // Dark Base
        ],
        // Wallet - Gold/Pine/Finance
        wallet: [
            'hsl(35 88% 72% / 0.4)',   // Gold
            'hsl(150 60% 70% / 0.5)',  // Green
            'hsl(197 49% 38% / 0.6)',  // Pine
            'hsl(35 60% 40% / 0.7)',   // Bronze
            'hsl(197 30% 25% / 0.8)',  // Dark Pine
            'hsl(267 57% 28% / 0.9)'   // Dark Base
        ],
        // Discover - Geode Palette (from geode.html)
        discover: [
            'hsl(41 83% 76% / 0.4)',   // Yellowish/Tan (#f4d48e)
            'hsl(24 85% 72% / 0.5)',   // Orange/Peach (#f5ae7d)
            'hsl(6 81% 62% / 0.6)',    // Red/Coral (#EC5F4F)
            'hsl(356 64% 54% / 0.7)',  // Crimson (#D5404A)
            'hsl(345 57% 43% / 0.8)',  // Dark Red/Wine (#AD2F4F)
            'hsl(344 59% 31% / 0.9)'   // Deep Berry (#7F213A)
        ]
    }), [])

    const getTheme = () => {
        if (!pathname) return themes.default

        const isHome = pathname === '/' || /^\/[a-z]{2}(\/)?$/.test(pathname)
        if (isHome) return themes.discover

        if (pathname.includes('/feed')) return themes.feed
        if (pathname.includes('/summon')) return themes.summon
        if (pathname.includes('/marketplace')) return themes.marketplace
        if (pathname.includes('/studio')) return themes.studio
        if (pathname.includes('/wallet')) return themes.wallet
        if (pathname.includes('/discover.old')) return themes.discover

        // Chat pages usually want less distraction, maybe keep default or specific?
        // Staying with default for now as it's the brand identity

        return themes.default
    }

    const activeColors = getTheme()
    const isCustomTheme = activeColors !== themes.default

    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -9999 }}>
            {/* Base Background Color Layer - ensures content is readable if body is transparent */}
            <div className="absolute inset-0 bg-rp-base" />

            <WaveBackground
                className="absolute inset-0"
                colorScheme={isCustomTheme ? 'custom' : 'purple'}
                customColors={isCustomTheme ? activeColors : undefined}
            />
        </div>
    )
}
