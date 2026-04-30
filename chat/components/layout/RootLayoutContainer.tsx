/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ROOT LAYOUT CONTAINER — PROJECT ISOLATION ARCHITECTURE        ║
 * ║                                                                ║
 * ║  This component controls which UI shell wraps each sub-project.║
 * ║  It is the SINGLE source of truth for route isolation.         ║
 * ║                                                                ║
 * ║  ⚠️  DO NOT apply theme-romrin to non-Rem routes.              ║
 * ║  ⚠️  DO NOT add global CSS imports here.                       ║
 * ║  ⚠️  DO NOT use broad pattern matching (e.g. '/sudo' catches  ║
 * ║      '/sudodo'). Always use exact route segments.              ║
 * ║                                                                ║
 * ║  ISOLATION MAP:                                                ║
 * ║    /aol/messenger → Standalone, theme-romrin dark              ║
 * ║    /rem           → Separate root layout (app/rem/layout.tsx)   ║
 * ║    /sudodo        → Separate root layout (app/sudodo/layout.tsx)║
 * ║    /game          → Separate root layout (app/game/layout.tsx)  ║
 * ║    Everything else → Standard platform (sidebar + nav)         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
"use client"

import { usePathname } from "next/navigation"
import { MinimalSidebar } from "./MinimalSidebar"
import { MobileNav } from "./MobileNav"
import { GlobalState } from "@/components/utility/global-state"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

import { BackgroundManager } from "./BackgroundManager"

interface RootLayoutContainerProps {
    children: ReactNode
    user: any
}

export function RootLayoutContainer({ children, user }: RootLayoutContainerProps) {
    const pathname = usePathname()

    // ── ISOLATION PATH: AOL Messenger ──
    // This remains in the platform tree but needs standalone UI.
    const isAolMessenger = pathname?.includes('/aol/messenger')
    const isDeveloperPortal = pathname?.includes('/developers')

    if (isAolMessenger || isDeveloperPortal) {
        return (
            <div className={cn(
                "flex min-h-screen w-full overflow-x-hidden",
                isAolMessenger ? "theme-romrin dark" : "bg-[#191724]"
            )}>
                <GlobalState>
                    <main className="flex-1 w-full overflow-hidden">
                        {children}
                    </main>
                </GlobalState>
            </div>
        )
    }

    // ── STANDARD PLATFORM PATH ──
    // Full Remrin platform UI: sidebar, mobile nav, background effects.
    // Detect chat pages to hide bottom padding
    const isChatPage =
        pathname?.includes('/character/') ||
        pathname?.includes('/chat-v2/') ||
        pathname?.includes('/chat/') ||
        pathname?.endsWith('/chat') ||
        pathname?.includes('/aol/messenger')

    return (
        <div className="flex min-h-screen">
            <GlobalState>
                <BackgroundManager />
                {/* Desktop Sidebar - Hidden on mobile */}
                <MinimalSidebar user={user} />

                {/* Main Content - Offset by sidebar on desktop, full width on mobile */}
                <main className={cn(
                    "flex-1 md:ml-20 md:pb-0 max-w-full overflow-x-hidden",
                    isChatPage ? "pb-0" : "pb-20"
                )}>
                    <div className="flex h-dvh flex-col items-center w-full max-w-full">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Navigation - Hidden on desktop */}
                <MobileNav />
            </GlobalState>
        </div>
    )
}
