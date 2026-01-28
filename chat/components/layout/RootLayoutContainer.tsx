"use client"

import { usePathname } from "next/navigation"
import { MinimalSidebar } from "./MinimalSidebar"
import { MobileNav } from "./MobileNav"
import { GlobalState } from "@/components/utility/global-state"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RootLayoutContainerProps {
    children: ReactNode
    user: any
}

export function RootLayoutContainer({ children, user }: RootLayoutContainerProps) {
    const pathname = usePathname()
    const isStandalone = pathname?.includes('/aol/messenger')

    if (isStandalone) {
        return (
            <div className="flex min-h-screen w-full">
                <GlobalState>
                    <main className="flex-1 w-full overflow-hidden">
                        {children}
                    </main>
                </GlobalState>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            <GlobalState>
                {/* Desktop Sidebar - Hidden on mobile */}
                <MinimalSidebar user={user} />

                {/* Main Content - Offset by sidebar on desktop, full width on mobile */}
                <main className="flex-1 md:ml-20 pb-20 md:pb-0 max-w-full overflow-x-hidden">
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
