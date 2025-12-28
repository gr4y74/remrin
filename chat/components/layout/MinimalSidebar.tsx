"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SIDEBAR } from "@/lib/design-system"
import {
    IconHome,
    IconSparkles,
    IconDice,
    IconBooks,
    IconShoppingBag,
    IconBrush,
    IconUser,
    IconWallet,
} from "@tabler/icons-react"

const NAV_ITEMS = [
    { icon: IconHome, label: "Home", href: "/" },
    { icon: IconSparkles, label: "Discover", href: "/discover" },
    { icon: IconDice, label: "Summon", href: "/summon" },
    { icon: IconBooks, label: "Collection", href: "/collection" },
    { icon: IconShoppingBag, label: "Marketplace", href: "/marketplace" },
    { icon: IconBrush, label: "Studio", href: "/studio" },
    { icon: IconWallet, label: "Wallet", href: "/wallet" },
]

export function MinimalSidebar() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showProfileSettings, setShowProfileSettings] = useState(false)
    const pathname = usePathname()

    return (
        <motion.nav
            className="bg-rp-surface border-rp-muted/20 fixed left-0 top-0 z-40 hidden h-screen flex-col border-r md:flex"
            initial={false}
            animate={{ width: isExpanded ? SIDEBAR.expanded : SIDEBAR.collapsed }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo Container - Dual-logo crossfade like Talkie-AI */}
            <div className="border-rp-muted/20 relative flex h-16 shrink-0 items-center justify-center overflow-hidden border-b">
                {/* Small logo - visible when collapsed */}
                <img
                    src="/logo_sm.svg"
                    alt="Remrin"
                    className={cn(
                        "size-10 transition-all duration-300",
                        isExpanded ? "absolute opacity-0 scale-75" : "opacity-100 scale-100"
                    )}
                />
                {/* Full wordmark - visible when expanded */}
                <img
                    src="/remrin_dark.svg"
                    alt="Remrin.ai"
                    className={cn(
                        "h-8 transition-all duration-300",
                        isExpanded ? "opacity-100 scale-100" : "absolute opacity-0 scale-90"
                    )}
                />
            </div>

            {/* All Items Container - flex-1 to fill, then Profile uses mt-auto */}
            <div className="flex flex-1 flex-col p-2">
                {/* Nav Items */}
                <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 transition-all",
                                    isActive
                                        ? "bg-rp-iris/20 text-rp-iris"
                                        : "text-rp-subtle hover:bg-rp-overlay hover:text-rp-text"
                                )}
                            >
                                <Icon size={22} className="shrink-0" />
                                <motion.span
                                    className="font-tiempos-text whitespace-nowrap text-sm font-medium"
                                    initial={false}
                                    animate={{ opacity: isExpanded ? 1 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {item.label}
                                </motion.span>
                                {isActive && (
                                    <motion.div
                                        className="bg-rp-iris absolute left-0 h-full w-1 rounded-r"
                                        layoutId="activeIndicator"
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Spacer pushes profile to bottom */}
                <div className="flex-1" />

                {/* Separator Line - pure visual, no container */}
                <div className="border-rp-muted/20 -mx-2 border-t" />

                {/* Profile Button - same styling as nav items */}
                <button
                    onClick={() => setShowProfileSettings(true)}
                    className="text-rp-subtle hover:bg-rp-overlay hover:text-rp-text group relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 transition-all"
                >
                    <IconUser size={22} className="shrink-0" />
                    <motion.span
                        className="font-tiempos-text whitespace-nowrap text-sm font-medium"
                        initial={false}
                        animate={{ opacity: isExpanded ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        Profile
                    </motion.span>
                </button>
            </div>

            {/* Profile Settings Modal */}
            {showProfileSettings && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowProfileSettings(false)}
                >
                    <div
                        className="bg-rp-surface border-rp-muted rounded-lg border p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-rp-text mb-4 text-xl font-bold">Profile Settings</h2>
                        <p className="text-rp-subtle mb-4">Profile settings modal - to be implemented with full functionality</p>
                        <button
                            onClick={() => setShowProfileSettings(false)}
                            className="bg-rp-iris hover:bg-rp-iris/80 rounded px-4 py-2 text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </motion.nav>
    )
}
