"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    IconHome,
    IconSparkles,
    IconMessage,
    IconBooks,
    IconUser,
} from "@tabler/icons-react"

const MOBILE_NAV = [
    { icon: IconHome, label: "Home", href: "/" },
    { icon: IconSparkles, label: "Discover", href: "/discover" },
    { icon: IconMessage, label: "Chat", href: "/chat" },
    { icon: IconBooks, label: "Collection", href: "/collection" },
    { icon: IconUser, label: "Profile", href: "/profile" },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="bg-rp-surface/95 border-rp-muted/20 fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg md:hidden">
            <div className="flex items-center justify-around">
                {MOBILE_NAV.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 py-3 transition-colors min-h-[44px]",
                                isActive ? "text-rp-iris" : "text-rp-subtle active:text-rp-text"
                            )}
                        >
                            <Icon size={24} className="shrink-0" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
            <div className="h-safe-area-inset-bottom" />
        </nav>
    )
}
