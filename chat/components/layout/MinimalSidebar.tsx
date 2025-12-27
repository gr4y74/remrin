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
    IconMessage,
    IconDice,
    IconBooks,
    IconShoppingBag,
    IconBrush,
    IconUser,
    IconSettings,
    IconWallet,
} from "@tabler/icons-react"

const NAV_ITEMS = [
    { icon: IconHome, label: "Home", href: "/" },
    { icon: IconSparkles, label: "Discover", href: "/discover" },
    { icon: IconMessage, label: "Chats", href: "/en/chat" },
    { icon: IconDice, label: "Summon", href: "/summon" },
    { icon: IconBooks, label: "Collection", href: "/collection" },
    { icon: IconShoppingBag, label: "Marketplace", href: "/marketplace" },
    { icon: IconBrush, label: "Studio", href: "/studio" },
    { icon: IconWallet, label: "Wallet", href: "/wallet" },
    { icon: IconUser, label: "Profile", href: "/en/profile" },
]

export function MinimalSidebar() {
    const [isExpanded, setIsExpanded] = useState(false)
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
            {/* Logo */}
            <div className="border-rp-muted/20 flex h-16 items-center justify-center border-b">
                <div className="from-rp-iris to-rp-rose flex size-10 items-center justify-center rounded-lg bg-gradient-to-br">
                    <span className="text-rp-base text-lg font-bold">R</span>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
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

            {/* Settings */}
            <div className="border-rp-muted/20 border-t p-2">
                <Link
                    href="/en/settings"
                    className="text-rp-subtle hover:bg-rp-overlay hover:text-rp-text flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 transition-all"
                >
                    <IconSettings size={22} className="shrink-0" />
                    <motion.span
                        className="font-tiempos-text whitespace-nowrap text-sm font-medium"
                        initial={false}
                        animate={{ opacity: isExpanded ? 1 : 0 }}
                    >
                        Settings
                    </motion.span>
                </Link>
            </div>
        </motion.nav>
    )
}
