"use client"

import { useState, useEffect, useRef, useContext } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    IconPuzzle,
    IconX,
    IconSparkles,
    IconLogin,
    IconSearch,
    IconBabyCarriage,
    IconDeviceGamepad2,
    IconMoon,
    IconBook,
    IconBriefcase,
    IconMovie,
    IconHeart,
    IconPalette,
    IconWallet,
    IconChevronDown,
    IconPlus,
    IconUser,
    IconLogout,
    IconMenu2,
    IconBell
} from "@tabler/icons-react"
import { SearchSouls } from "@/components/ui/SearchSouls"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    const [showBanner, setShowBanner] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showMobileDrawer, setShowMobileDrawer] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const lastScrollY = useRef(0)
    const userMenuRef = useRef<HTMLDivElement>(null)

    const isLoggedIn = !!profile

    // Check localStorage for banner dismissal
    useEffect(() => {
        const dismissed = localStorage.getItem("remrin_extension_banner_dismissed")
        if (dismissed === "true") {
            setShowBanner(false)
        }
    }, [])

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

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

    // Handle scroll to collapse/expand header
    useEffect(() => {
        const findScrollableParent = (): HTMLElement | null => {
            const scrollContainer = document.querySelector('main > div.overflow-x-auto') as HTMLElement
            if (scrollContainer) return scrollContainer

            const elements = document.querySelectorAll('*')
            for (const el of elements) {
                const style = window.getComputedStyle(el as Element)
                const htmlEl = el as HTMLElement
                if (
                    (style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                        style.overflow === 'auto' || style.overflow === 'scroll') &&
                    htmlEl.scrollHeight > htmlEl.clientHeight
                ) {
                    return htmlEl
                }
            }
            return null
        }

        let scrollTarget: HTMLElement | Window = window
        const container = findScrollableParent()
        if (container) {
            scrollTarget = container
        }

        const handleScroll = () => {
            const currentScrollY = scrollTarget === window
                ? window.scrollY
                : (scrollTarget as HTMLElement).scrollTop

            const scrollThreshold = 150

            if (currentScrollY < scrollThreshold) {
                setIsCollapsed(false)
            } else {
                setIsCollapsed(true)
            }

            lastScrollY.current = currentScrollY
        }

        scrollTarget.addEventListener("scroll", handleScroll, { passive: true })
        return () => scrollTarget.removeEventListener("scroll", handleScroll)
    }, [])

    const handleDismissBanner = () => {
        localStorage.setItem("remrin_extension_banner_dismissed", "true")
        setShowBanner(false)
    }

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

    const showExpanded = !isCollapsed || isHovered

    return (
        <>
            {/* Mobile Navigation Drawer */}
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

            <header
                className="sticky top-0 z-40 w-full px-2 sm:px-4 py-2 transition-all duration-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Extension Banner - only show when expanded */}
                {showBanner && showExpanded && (
                    <div className="relative flex justify-center items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl mb-3 max-w-fit mx-auto transition-all duration-300">
                        <IconPuzzle size={18} className="shrink-0 text-blue-400" />
                        <span className="text-sm text-rp-text">
                            <span className="font-medium">Bring your Souls everywhere</span> - Get the{" "}
                            <Link
                                href="/extension"
                                className="font-semibold text-blue-400 underline decoration-blue-400/30 underline-offset-2 hover:decoration-blue-400"
                            >
                                Remrin Locket Extension
                            </Link>
                        </span>
                        <button
                            onClick={handleDismissBanner}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rp-muted transition-colors hover:text-rp-text"
                            aria-label="Dismiss banner"
                        >
                            <IconX size={16} />
                        </button>
                    </div>
                )}

                {/* Glassmorphic Nav Container */}
                <div
                    className={cn(
                        "bg-rp-surface/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-[1400px] mx-auto transition-all duration-300 ease-out",
                        showExpanded ? "p-3 sm:p-4 md:p-5" : "p-2 md:p-3"
                    )}
                >
                    {/* Top Row - Always visible */}
                    <div className={cn(
                        "flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300",
                        showExpanded ? "mb-4" : "mb-0"
                    )}>
                        {/* Left: Wallet + Search */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            {/* Wallet Icon (replaces S logo) */}
                            <Link href={isLoggedIn ? "/wallet" : "/login"} className="shrink-0">
                                <div className={cn(
                                    "bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-all cursor-pointer",
                                    showExpanded ? "w-8 h-8 sm:w-10 sm:h-10" : "w-7 h-7 sm:w-8 sm:h-8"
                                )}>
                                    <IconWallet size={showExpanded ? 18 : 16} className="sm:w-[22px] sm:h-[22px]" />
                                </div>
                            </Link>

                            {/* Search Bar - collapses to icon when mini or on mobile */}
                            {showExpanded ? (
                                <div className="hidden sm:flex flex-1 max-w-[500px] transition-all duration-300">
                                    <SearchSouls onResultClick={onSearchResultClick} />
                                </div>
                            ) : (
                                <button
                                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rp-overlay/50 hover:bg-rp-overlay text-rp-subtle text-sm transition-all"
                                    onClick={() => setIsHovered(true)}
                                >
                                    <IconSearch size={16} />
                                    <span className="hidden sm:inline">Search Souls...</span>
                                </button>
                            )}

                            {/* Mobile Search Icon */}
                            <button
                                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-rp-overlay/50 hover:bg-rp-overlay text-rp-subtle transition-all"
                                onClick={() => setIsHovered(true)}
                            >
                                <IconSearch size={18} />
                            </button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Subscribe Button - Hidden on mobile */}
                            <Link
                                href="/pricing"
                                className={cn(
                                    "group hidden md:flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rp-iris to-rp-rose font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rp-iris/30",
                                    showExpanded ? "h-10 px-5 text-sm" : "h-8 px-3 text-xs"
                                )}
                            >
                                <IconSparkles size={showExpanded ? 16 : 14} className="transition-transform group-hover:rotate-12" />
                                <span className="hidden lg:inline">Subscribe</span>
                            </Link>

                            {/* Desktop User Actions */}
                            <div className="hidden md:flex items-center gap-2">
                                {isLoggedIn ? (
                                    <>
                                        {/* Create Soul Button (replaces Settings) */}
                                        <Link
                                            href="/studio"
                                            className={cn(
                                                "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30",
                                                showExpanded ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs"
                                            )}
                                        >
                                            <IconPlus size={showExpanded ? 16 : 14} />
                                            <span className="hidden lg:inline">Create Soul</span>
                                        </Link>

                                        {/* Notification Bell */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "relative flex items-center justify-center rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text transition-all",
                                                        showExpanded ? "w-10 h-10" : "w-8 h-8"
                                                    )}
                                                >
                                                    <IconBell size={showExpanded ? 20 : 16} />
                                                    {unreadCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-rp-surface">
                                                            {unreadCount > 99 ? "99+" : unreadCount}
                                                        </span>
                                                    )}
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="p-0 border-none bg-transparent shadow-none">
                                                <NotificationDropdown onMarkAsRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* User Avatar with Dropdown (replaces Login) */}
                                        <div className="relative" ref={userMenuRef}>
                                            <button
                                                onClick={() => setShowUserMenu(!showUserMenu)}
                                                className={cn(
                                                    "rounded-full bg-rp-overlay hover:bg-rp-base flex items-center justify-center transition-all shrink-0 overflow-hidden border-2 border-transparent hover:border-rp-iris",
                                                    showExpanded ? "w-10 h-10" : "w-8 h-8"
                                                )}
                                            >
                                                {profile?.hero_image_url ? (
                                                    <Image
                                                        src={profile.hero_image_url}
                                                        alt="Profile"
                                                        width={40}
                                                        height={40}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <IconUser size={showExpanded ? 20 : 16} className="text-rp-text" />
                                                )}
                                            </button>

                                            {/* Dropdown Menu */}
                                            {showUserMenu && (
                                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-rp-surface border border-rp-highlight-med shadow-xl overflow-hidden z-50">
                                                    <Link
                                                        href={`/profile/${profile?.user_id}`}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm text-rp-text hover:bg-rp-overlay transition-colors"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <IconUser size={18} />
                                                        View Profile
                                                    </Link>
                                                    <Link
                                                        href="/studio"
                                                        className="flex items-center gap-3 px-4 py-3 text-sm text-rp-text hover:bg-rp-overlay transition-colors"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <IconPlus size={18} />
                                                        Soul Studio
                                                    </Link>
                                                    <Link
                                                        href="/wallet"
                                                        className="flex items-center gap-3 px-4 py-3 text-sm text-rp-text hover:bg-rp-overlay transition-colors"
                                                        onClick={() => setShowUserMenu(false)}
                                                    >
                                                        <IconWallet size={18} />
                                                        Wallet
                                                    </Link>
                                                    <div className="h-px bg-rp-highlight-med" />
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-rp-overlay transition-colors w-full"
                                                    >
                                                        <IconLogout size={18} />
                                                        Logout
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Login Button (when not logged in) */}
                                        <Link
                                            href="/login"
                                            className={cn(
                                                "flex items-center justify-center gap-2 rounded-xl bg-rp-overlay hover:bg-rp-base font-medium text-rp-text transition-all",
                                                showExpanded ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs"
                                            )}
                                        >
                                            <IconLogin size={showExpanded ? 16 : 14} />
                                            <span className="hidden lg:inline">Login</span>
                                        </Link>

                                        {/* Sign Up Button (replaces Settings when logged out) */}
                                        <Link
                                            href="/signup"
                                            className={cn(
                                                "flex items-center justify-center gap-2 rounded-xl bg-rp-overlay hover:bg-rp-base font-medium text-rp-text transition-all",
                                                showExpanded ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs"
                                            )}
                                        >
                                            <IconUser size={showExpanded ? 16 : 14} />
                                            <span className="hidden lg:inline">Sign Up</span>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile Hamburger Menu */}
                            <div className="md:hidden flex items-center gap-1.5">
                                {isLoggedIn && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text transition-all active:scale-95"
                                                aria-label="Notifications"
                                            >
                                                <IconBell size={20} />
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-rp-surface">
                                                        {unreadCount > 99 ? "99+" : unreadCount}
                                                    </span>
                                                )}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="p-0 border-none bg-transparent shadow-none">
                                            <NotificationDropdown onMarkAsRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                <button
                                    onClick={() => setShowMobileDrawer(true)}
                                    className="flex items-center justify-center w-11 h-11 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text transition-all active:scale-95"
                                    aria-label="Open menu"
                                >
                                    <IconMenu2 size={22} />
                                </button>
                            </div>

                            {/* Expand indicator when collapsed - Desktop only */}
                            {isCollapsed && !isHovered && (
                                <div className="hidden md:block text-rp-muted animate-pulse">
                                    <IconChevronDown size={16} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider + Categories - Only show when expanded on desktop */}
                    {showExpanded && (
                        <>
                            <div className="hidden md:block h-px bg-gradient-to-r from-transparent via-rp-highlight-med to-transparent -mx-5 mb-3"></div>
                            <div className="hidden md:flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORIES.map((category) => {
                                    const Icon = category.icon
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => handleCategoryClick(category.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-rp-overlay hover:bg-rp-base hover:-translate-y-0.5 text-rp-text border-0"
                                        >
                                            <Icon size={14} className="shrink-0" />
                                            {category.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            </header>
        </>
    )
}
