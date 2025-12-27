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
            className="bg-rp-surface border-rp-muted/20 fixed left-0 top-0 z-40 hidden h-screen flex-col justify-between border-r md:flex"
            initial={false}
            animate={{ width: isExpanded ? SIDEBAR.expanded : SIDEBAR.collapsed }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Top Section: Logo + Nav */}
            <div className="flex shrink-0 flex-col">
                {/* Logo */}
                <div className="border-rp-muted/20 flex h-16 shrink-0 items-center justify-center border-b">
                    <div className="from-rp-iris to-rp-rose flex size-10 items-center justify-center rounded-lg bg-gradient-to-br">
                        <span className="text-rp-base text-lg font-bold">R</span>
                    </div>
                </div>

                {/* Nav Items */}
                <div className="space-y-1 overflow-y-auto p-2">
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
            </div>

            {/* Bottom Section: Profile */}
            <div className="border-rp-muted/20 shrink-0 border-t px-2">
                <button
                    onClick={() => setShowProfileSettings(true)}
                    className="text-rp-subtle hover:bg-rp-overlay hover:text-rp-text flex w-full items-center gap-3 rounded-lg px-3 pb-3 transition-all"
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
