"use client"

import { useState, useEffect, useRef, useContext } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    IconX,
    IconSparkles,
    IconLogin,
    IconBabyCarriage,
    IconDeviceGamepad2,
    IconMoon,
    IconBook,
    IconBriefcase,
    IconMovie,
    IconHeart,
    IconPalette,
    IconWallet,
    IconPlus,
    IconUser,
    IconLogout,
    IconMenu2,
    IconBell
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FloatingPillNav } from "./FloatingPillNav"

const CATEGORIES = [
    { id: "kids", label: "Kids", icon: IconBabyCarriage, bgColor: "bg-pink-500/90", textColor: "text-white" },
    { id: "gaming", label: "Gaming", icon: IconDeviceGamepad2, bgColor: "bg-purple-500/90", textColor: "text-white" },
    { id: "religion", label: "Religion", icon: IconMoon, bgColor: "bg-amber-500/90", textColor: "text-white" },
    { id: "education", label: "Education", icon: IconBook, bgColor: "bg-blue-500/90", textColor: "text-white" },
    { id: "productivity", label: "Productivity", icon: IconBriefcase, bgColor: "bg-green-500/90", textColor: "text-white" },
    { id: "entertainment", label: "Entertainment", icon: IconMovie, bgColor: "bg-rose-500/90", textColor: "text-white" },
    { id: "wellness", label: "Wellness", icon: IconHeart, bgColor: "bg-cyan-500/90", textColor: "text-white" },
    { id: "creative", label: "Creative", icon: IconPalette, bgColor: "bg-violet-500/90", textColor: "text-white" }
]

interface FrontPageHeaderProps {
    onSearchResultClick: (personaId: string) => void
    onCategoryClick?: (category: string) => void
}

export function FrontPageHeader({
    onSearchResultClick,
    onCategoryClick
}: FrontPageHeaderProps) {
    const router = useRouter()
    const { profile } = useContext(RemrinContext)
    const [showMobileDrawer, setShowMobileDrawer] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const isLoggedIn = !!profile

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (showMobileDrawer) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [showMobileDrawer])

    // Poll for unread notifications
    useEffect(() => {
        if (!isLoggedIn) return

        const fetchUnreadCount = async () => {
            try {
                const response = await fetch("/api/notifications/count")
                const data = await response.json()
                if (typeof data.unreadCount === "number") {
                    setUnreadCount(data.unreadCount)
                }
            } catch (error) {
                console.error("Error fetching unread count:", error)
            }
        }

        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(interval)
    }, [isLoggedIn])

    const handleCategoryClick = (categoryId: string) => {
        if (onCategoryClick) {
            onCategoryClick(categoryId)
        } else {
            // Try to find a section with this specific ID (slug)
            const sectionId = categoryId.toLowerCase()
            const section = document.getElementById(sectionId)

            if (section) {
                section.scrollIntoView({ behavior: "smooth" })
            } else {
                // Fallback to explore section if specific category not found
                const exploreSection = document.querySelector('[data-section="explore-souls"]')
                if (exploreSection) {
                    exploreSection.scrollIntoView({ behavior: "smooth" })
                }
            }
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    return (
        <>
            {/* Mobile Navigation Drawer - Hidden on desktop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
                    showMobileDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowMobileDrawer(false)}
                />

                {/* Drawer */}
                <div
                    className={cn(
                        "absolute right-0 top-0 h-full w-[280px] bg-rp-surface border-l border-rp-highlight-med shadow-2xl transition-transform duration-300 ease-out flex flex-col",
                        showMobileDrawer ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-4 border-b border-rp-highlight-med">
                        <span className="text-lg font-semibold text-rp-text">Menu</span>
                        <button
                            onClick={() => setShowMobileDrawer(false)}
                            className="p-2 rounded-lg hover:bg-rp-overlay transition-colors"
                            aria-label="Close menu"
                        >
                            <IconX size={20} className="text-rp-text" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        {/* Categories */}
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-rp-muted uppercase tracking-wider mb-2">Categories</p>
                            {CATEGORIES.map((category) => {
                                const Icon = category.icon
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            handleCategoryClick(category.id)
                                            setShowMobileDrawer(false)
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-rp-text hover:bg-rp-overlay transition-colors"
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        <span className="text-sm font-medium">{category.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Quick Actions */}
                        <div className="border-t border-rp-highlight-med pt-4">
                            <p className="text-xs font-semibold text-rp-muted uppercase tracking-wider mb-2">Quick Actions</p>
                            <Link
                                href="/pricing"
                                onClick={() => setShowMobileDrawer(false)}
                                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg bg-gradient-to-r from-rp-iris to-rp-rose text-white font-medium hover:shadow-lg transition-all"
                            >
                                <IconSparkles size={20} />
                                <span className="text-sm">Subscribe</span>
                            </Link>
                            {isLoggedIn && (
                                <Link
                                    href="/studio"
                                    onClick={() => setShowMobileDrawer(false)}
                                    className="flex items-center gap-3 w-full px-3 py-3 mt-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg transition-all"
                                >
                                    <IconPlus size={20} />
                                    <span className="text-sm">Create Soul</span>
                                </Link>
                            )}
                        </div>
                    </nav>

                    {/* User Section at Bottom */}
                    <div className="p-4 border-t border-rp-highlight-med bg-rp-overlay/50">
                        {isLoggedIn ? (
                            <div className="space-y-2">
                                <Link
                                    href={`/profile/${profile?.user_id}`}
                                    onClick={() => setShowMobileDrawer(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-rp-surface transition-colors"
                                >
                                    {profile?.hero_image_url ? (
                                        <Image
                                            src={profile.hero_image_url}
                                            alt="Profile"
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-rp-iris flex items-center justify-center">
                                            <IconUser size={16} className="text-white" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-rp-text">View Profile</span>
                                </Link>
                                <Link
                                    href="/wallet"
                                    onClick={() => setShowMobileDrawer(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rp-surface transition-colors text-rp-text"
                                >
                                    <IconWallet size={18} />
                                    <span className="text-sm">Wallet</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setShowMobileDrawer(false)
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-rp-surface transition-colors text-red-400"
                                >
                                    <IconLogout size={18} />
                                    <span className="text-sm">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Link
                                    href="/login"
                                    onClick={() => setShowMobileDrawer(false)}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-rp-overlay hover:bg-rp-base font-medium text-rp-text transition-all"
                                >
                                    <IconLogin size={18} />
                                    <span className="text-sm">Login</span>
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setShowMobileDrawer(false)}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-rp-overlay hover:bg-rp-base font-medium text-rp-text transition-all"
                                >
                                    <IconUser size={18} />
                                    <span className="text-sm">Sign Up</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop: Floating Pill Navigation */}
            <div className="hidden md:block">
                <FloatingPillNav
                    onSearchResultClick={onSearchResultClick}
                    isLoggedIn={isLoggedIn}
                    profile={profile}
                />
            </div>

            {/* Mobile: Hamburger Button (Fixed Top Right) */}
            <button
                onClick={() => setShowMobileDrawer(true)}
                className="md:hidden fixed top-4 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-rp-surface/95 backdrop-blur-xl border border-white/10 shadow-lg hover:bg-rp-overlay transition-all"
                aria-label="Open menu"
            >
                <IconMenu2 size={24} className="text-rp-text" />
            </button>
        </>
    )
}
