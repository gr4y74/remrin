"use client"

import { useContext } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"
import { IconCrown, IconLogin, IconUser } from "@tabler/icons-react"

interface SidebarUserSectionProps {
    isExpanded: boolean
    onProfileClick?: () => void
}

/**
 * SidebarUserSection - Talkie-AI inspired user section for sidebar
 * 
 * Shows different states:
 * - Logged out: Sign In button
 * - Logged in: Avatar + Subscribe/Upgrade CTA (or Pro badge if subscribed)
 */
export function SidebarUserSection({ isExpanded, onProfileClick }: SidebarUserSectionProps) {
    const { profile } = useContext(RemrinContext)

    // Check if user is logged in
    const isLoggedIn = !!profile

    // For now, we'll assume all users can see the subscribe CTA
    // This can be connected to a subscription status later
    const isSubscribed = false // TODO: Connect to actual subscription status
    const discountPercent = 50 // Promotional discount

    if (!isLoggedIn) {
        // Logged out state - show Sign In button
        return (
            <div className="p-2">
                <Link
                    href="/login"
                    className={cn(
                        "flex min-h-[48px] items-center justify-center gap-3 rounded-xl px-3 py-3 transition-all",
                        "bg-gradient-to-r from-rp-iris to-rp-love text-white",
                        "hover:opacity-90 hover:shadow-lg hover:shadow-rp-iris/20"
                    )}
                >
                    <IconLogin size={22} className="shrink-0" />
                    <motion.span
                        className="font-tiempos-text whitespace-nowrap text-sm font-medium"
                        initial={false}
                        animate={{
                            opacity: isExpanded ? 1 : 0,
                            width: isExpanded ? "auto" : 0
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        Sign In
                    </motion.span>
                </Link>
            </div>
        )
    }

    // Logged in state - show avatar + subscribe/upgrade CTA
    return (
        <div className="space-y-2 p-2">
            {/* User Info Row */}
            <button
                onClick={onProfileClick}
                className={cn(
                    "flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 transition-all",
                    "text-rp-subtle hover:bg-rp-overlay hover:text-rp-text",
                    !isExpanded && "justify-center"
                )}
            >
                {/* Avatar */}
                <div className="relative shrink-0">
                    {profile.image_url ? (
                        <img
                            src={profile.image_url}
                            alt={profile.display_name || "User"}
                            className="size-9 rounded-full object-cover ring-2 ring-rp-highlight-med"
                        />
                    ) : (
                        <div className="flex size-9 items-center justify-center rounded-full bg-rp-iris/20 text-rp-iris ring-2 ring-rp-highlight-med">
                            <IconUser size={18} />
                        </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 ring-2 ring-rp-surface" />
                </div>

                {/* Username - only show when expanded */}
                <motion.div
                    className="flex-1 overflow-hidden text-left"
                    initial={false}
                    animate={{
                        opacity: isExpanded ? 1 : 0,
                        width: isExpanded ? "auto" : 0
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="font-tiempos-text truncate text-sm font-medium text-rp-text">
                        {profile.display_name || profile.username || "User"}
                    </p>
                </motion.div>
            </button>

            {/* Subscribe/Upgrade CTA - Compact size matching profile avatar */}
            {!isSubscribed && (
                <Link
                    href="/pricing"
                    className={cn(
                        "flex items-center rounded-xl transition-all overflow-hidden",
                        "bg-gradient-to-r from-amber-600/90 to-orange-600/90",
                        "hover:from-amber-500 hover:to-orange-500",
                        "shadow-lg shadow-amber-500/20",
                        isExpanded ? "gap-2 px-3 py-1.5" : "justify-center p-2"
                    )}
                >
                    {/* Crown Icon - same size as profile avatar icon */}
                    <div className={cn(
                        "shrink-0 flex items-center justify-center",
                        isExpanded ? "size-7" : "size-9"
                    )}>
                        <IconCrown size={isExpanded ? 18 : 20} className="text-amber-100" />
                    </div>

                    {/* Subscribe Text + Discount Badge - only when expanded */}
                    {isExpanded && (
                        <div className="flex flex-1 items-center justify-between gap-2">
                            <span className="font-tiempos-text text-sm font-semibold text-white whitespace-nowrap">
                                Subscribe
                            </span>
                            {discountPercent > 0 && (
                                <span className="rounded-full bg-rp-love px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    -{discountPercent}%
                                </span>
                            )}
                        </div>
                    )}
                </Link>
            )}

            {/* If subscribed, show Pro badge instead */}
            {isSubscribed && (
                <div
                    className={cn(
                        "flex min-h-[48px] items-center rounded-xl",
                        "bg-gradient-to-r from-amber-600/30 to-orange-600/30",
                        "border border-amber-500/30",
                        isExpanded ? "gap-3 px-4 py-3" : "justify-center px-3 py-3"
                    )}
                >
                    <IconCrown size={24} className="shrink-0 text-amber-400" />
                    <motion.span
                        className="font-tiempos-text text-sm font-semibold text-amber-400 whitespace-nowrap"
                        initial={false}
                        animate={{
                            opacity: isExpanded ? 1 : 0,
                            width: isExpanded ? "auto" : 0
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        Pro Member
                    </motion.span>
                </div>
            )}
        </div>
    )
}
