"use client"

import { useContext, useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"
import { IconCrown, IconLogin, IconUser, IconLogout, IconSettings, IconUserCircle } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import i18nConfig from "@/i18nConfig"
import { getUserProfileUrl, getUserDisplayName, getUserAvatarUrl } from "@/lib/user-profile-utils"

interface SidebarUserSectionProps {
    isExpanded: boolean
    onProfileClick?: () => void
    initialUser?: User | null
}

/**
 * SidebarUserSection - Talkie-AI inspired user section for sidebar
 * 
 * Shows different states:
 * - Logged out: Sign In button
 * - Logged in: Avatar + Subscribe/Upgrade CTA (or Pro badge if subscribed)
 */
export function SidebarUserSection({ isExpanded, onProfileClick, initialUser }: SidebarUserSectionProps) {
    const { profile, setProfile } = useContext(RemrinContext)
    const [user, setUser] = useState<User | null>(initialUser ?? null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [imageKey, setImageKey] = useState(Date.now()) // For forcing image reload
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    // Check auth status directly from Supabase
    useEffect(() => {
        // Only fetch if we didn't receive an initial user or to update
        if (!initialUser) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) setUser(session.user)
            })
        }

        // Listen for auth changes
        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    // Listen for profile image updates
    useEffect(() => {
        const handleProfileImageUpdate = (event: CustomEvent) => {
            // Force image reload by updating key
            setImageKey(Date.now())
            // Update profile in context if needed
            if (profile && event.detail) {
                setProfile(prev => prev ? { ...prev, ...event.detail } : prev)
            }
        }

        window.addEventListener('profile-image-updated' as any, handleProfileImageUpdate as any)
        return () => window.removeEventListener('profile-image-updated' as any, handleProfileImageUpdate as any)
    }, [profile, setProfile])

    // Check if user is logged in (use Supabase user as source of truth)
    const isLoggedIn = !!user

    // For now, we'll assume all users can see the subscribe CTA
    // This can be connected to a subscription status later
    const isSubscribed = false // TODO: Connect to actual subscription status
    const discountPercent = 50 // Promotional discount

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showDropdown])

    const pathname = usePathname()
    const firstSegment = pathname.split("/")[1]
    const locale = i18nConfig.locales.includes(firstSegment) ? firstSegment : i18nConfig.defaultLocale

    const handleSignOut = async () => {
        try {
            // Call server-side signout API to properly clear cookies
            await fetch('/api/auth/signout', { method: 'POST' })

            await supabase.auth.signOut({ scope: 'global' })

            // Hard reset to clear all in-memory states
            window.location.href = `/${locale}`
        } catch (error) {
            console.error('Error signing out:', error)
            window.location.href = `/${locale}`
        }
    }

    if (!isLoggedIn) {
        // Logged out state - show Sign In button
        return (
            <div className="p-2">
                <Link
                    href={`/${locale}/login`}
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

    // Get display info from profile or user metadata
    const displayName = getUserDisplayName(profile)
    const avatarUrl = getUserAvatarUrl(profile)

    // Logged in state - show avatar + subscribe/upgrade CTA
    return (
        <div className="space-y-2 p-2">
            {/* User Info Row with Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={cn(
                        "flex w-full min-h-[48px] items-center rounded-xl transition-all",
                        "text-rp-subtle hover:bg-rp-overlay hover:text-rp-text",
                        isExpanded ? "gap-3 px-3 py-2" : "justify-center px-2 py-2",
                        showDropdown && "bg-rp-overlay text-rp-text"
                    )}
                >
                    {/* Avatar */}
                    <div className={cn(
                        "relative shrink-0",
                        !isExpanded && "-translate-x-[2.5px]"
                    )}>
                        {avatarUrl ? (
                            <div className="relative size-9">
                                <Image
                                    key={imageKey}
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="rounded-full object-cover ring-2 ring-rp-highlight-med"
                                    fill
                                    sizes="36px"
                                    unoptimized
                                />
                            </div>
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
                            {displayName}
                        </p>
                    </motion.div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-rp-highlight-med bg-rp-surface shadow-xl",
                                !isExpanded && "left-auto right-auto w-48"
                            )}
                        >
                            <div className="p-1">
                                <Link
                                    href={`/${locale}${getUserProfileUrl(profile?.username || "")}`}
                                    onClick={() => setShowDropdown(false)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-rp-text transition-colors hover:bg-rp-overlay"
                                >
                                    <IconUserCircle size={18} />
                                    <span>View Profile</span>
                                </Link>
                                <div className="my-1 h-px bg-rp-highlight-med" />
                                <button
                                    onClick={() => {
                                        setShowDropdown(false)
                                        handleSignOut()
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                                >
                                    <IconLogout size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* Subscribe/Upgrade CTA - Compact size matching profile avatar */}
            {!isSubscribed && (
                <Link
                    href="/pricing"
                    className={cn(
                        "flex items-center rounded-xl transition-all overflow-hidden",
                        "bg-gradient-to-r from-amber-600/90 to-orange-600/90",
                        "hover:from-amber-500 hover:to-orange-500",
                        "shadow-lg shadow-amber-500/20",
                        isExpanded ? "gap-2 px-3 py-1.5" : "justify-center p-1.5"
                    )}
                >
                    {/* Crown Icon - same size as profile avatar icon */}
                    <div className={cn(
                        "shrink-0 flex items-center justify-center",
                        "size-7"
                    )}>
                        <IconCrown size={18} className="text-amber-100" />
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
