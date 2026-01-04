"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SIDEBAR } from "@/lib/design-system"
import { SidebarUserSection } from "./SidebarUserSection"
import { SidebarRecentChats } from "./SidebarRecentChats"
import { SidebarCreateButton } from "./SidebarCreateButton"
import { SidebarThemeToggle } from "./SidebarThemeToggle"
import { toast } from "sonner"
import {
    IconHome,
    IconSparkles,
    IconDice,
    IconBooks,
    IconShoppingBag,
    IconBrush,
    IconWallet,
    IconDatabase,
} from "@tabler/icons-react"
import { useContext } from "react"
import { RemrinContext } from "@/context/context"

const NAV_ITEMS = [
    { icon: IconHome, label: "Home", href: "/" },
    { icon: IconSparkles, label: "Discover", href: "/discover" },
    { icon: IconDice, label: "Summon", href: "/summon" },
    { icon: IconBooks, label: "Collection", href: "/collection" },
    { icon: IconDatabase, label: "Vault", href: "/knowledge", isWorkspaceSpecific: true },
    { icon: IconShoppingBag, label: "Marketplace", href: "/marketplace" },
    { icon: IconBrush, label: "Studio", href: "/studio" },
    { icon: IconWallet, label: "Wallet", href: "/wallet" },
]

/**
 * MinimalSidebar - Talkie-AI inspired sidebar with:
 * - Craft a Soul button
 * - Recent chats list
 * - User section with avatar + Subscribe CTA
 */
export function MinimalSidebar() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [showProfileSettings, setShowProfileSettings] = useState(false)
    const pathname = usePathname()
    const { selectedWorkspace } = useContext(RemrinContext)

    useEffect(() => {
        setMounted(true)
    }, [])

    const logoSrc = resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"

    return (
        <motion.nav
            className="bg-rp-surface border-rp-muted/20 fixed left-0 top-0 z-40 hidden h-screen flex-col border-r md:flex"
            initial={false}
            animate={{ width: isExpanded ? SIDEBAR.expanded : SIDEBAR.collapsed }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo Container - Dual-logo crossfade */}
            <div className="border-rp-muted/20 relative flex h-16 shrink-0 items-center justify-center overflow-hidden border-b">
                <Link href="/" className="flex items-center justify-center transition-transform duration-300 ease-out hover:rotate-[-5deg] hover:scale-105">
                    {/* Small logo - visible when collapsed */}
                    <Image
                        src="/logo_sm.svg"
                        alt="Remrin"
                        width={40}
                        height={40}
                        className={cn(
                            "transition-all duration-300",
                            isExpanded ? "absolute opacity-0 scale-75" : "opacity-100 scale-100"
                        )}
                    />
                    {/* Full wordmark - visible when expanded */}
                    {mounted && (
                        <Image
                            src={logoSrc}
                            alt="Remrin.ai"
                            width={120}
                            height={32}
                            className={cn(
                                "h-8 w-auto transition-all duration-300",
                                isExpanded ? "opacity-100 scale-100" : "absolute opacity-0 scale-90"
                            )}
                        />
                    )}
                </Link>
            </div>

            {/* Craft a Soul Button */}
            <SidebarCreateButton isExpanded={isExpanded} />

            {/* All Items Container */}
            <div className="flex flex-1 flex-col p-2">
                {/* Nav Items */}
                <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        let href = item.href
                        let isDisabled = false

                        if (item.isWorkspaceSpecific) {
                            if (selectedWorkspace) {
                                href = `/${pathname.split("/")[1]}/${selectedWorkspace.id}${item.href}`
                            } else {
                                // If workspace-specific but no workspace selected, disable it or point to home
                                isDisabled = true
                                href = "#"
                            }
                        }
                        const isActive = href !== "#" && (pathname === href || pathname.startsWith(href + "/"))

                        return (
                            <Link
                                key={item.label}
                                href={href}
                                onClick={(e) => {
                                    if (isDisabled) {
                                        e.preventDefault()
                                        toast.info("Please select or create a workspace first.")
                                    }
                                }}
                                className={cn(
                                    "group relative flex min-h-[44px] items-center rounded-lg py-3 transition-all",
                                    isActive
                                        ? "bg-rp-iris/20 text-rp-iris"
                                        : "text-rp-subtle hover:bg-rp-overlay hover:text-rp-text",
                                    isDisabled && "opacity-50 cursor-not-allowed",
                                    // Center icons when collapsed, left align when expanded
                                    isExpanded ? "justify-start gap-3 px-4" : "justify-center px-0"
                                )}
                            >
                                {/* Icon container - fixed width for centering */}
                                <div className={cn(
                                    "flex shrink-0 items-center justify-center",
                                    !isExpanded && "w-full"
                                )}>
                                    <Icon size={22} />
                                </div>
                                <motion.span
                                    className="font-tiempos-text whitespace-nowrap text-sm font-medium overflow-hidden"
                                    initial={false}
                                    animate={{
                                        opacity: isExpanded ? 1 : 0,
                                        width: isExpanded ? "auto" : 0
                                    }}
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

                {/* Separator Line */}
                <div className="border-rp-muted/20 -mx-2 my-2 border-t" />

                {/* Recent Chats Section */}
                <SidebarRecentChats isExpanded={isExpanded} maxChats={8} showDemo={false} />

                {/* Spacer pushes user section to bottom */}
                <div className="flex-1" />

                {/* Separator Line */}
                <div className="border-rp-muted/20 -mx-2 border-t" />

                {/* Theme Toggle */}
                <div className="px-2 py-1">
                    <SidebarThemeToggle isExpanded={isExpanded} />
                </div>

                {/* Separator Line */}
                <div className="border-rp-muted/20 -mx-2 border-t" />

                {/* User Section with Avatar + Subscribe CTA */}
                <SidebarUserSection
                    isExpanded={isExpanded}
                    onProfileClick={() => setShowProfileSettings(true)}
                />
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
