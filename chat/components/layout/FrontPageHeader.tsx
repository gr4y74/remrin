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
    IconLogout
} from "@tabler/icons-react"
import { SearchSouls } from "@/components/ui/SearchSouls"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"

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
        <header
            className="sticky top-0 z-40 w-full px-4 py-2 transition-all duration-300"
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
                    "bg-rp-surface/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-[1400px] mx-auto transition-all duration-300 ease-out",
                    showExpanded ? "p-4 md:p-5" : "p-2 md:p-3"
                )}
            >
                {/* Top Row - Always visible */}
                <div className={cn(
                    "flex items-center justify-between gap-4 transition-all duration-300",
                    showExpanded ? "mb-4" : "mb-0"
                )}>
                    {/* Left: Wallet + Search */}
                    <div className="flex items-center gap-4 flex-1">
                        {/* Wallet Icon (replaces S logo) */}
                        <Link href={isLoggedIn ? "/wallet" : "/login"} className="shrink-0">
                            <div className={cn(
                                "bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-all cursor-pointer",
                                showExpanded ? "w-10 h-10" : "w-8 h-8"
                            )}>
                                <IconWallet size={showExpanded ? 22 : 18} />
                            </div>
                        </Link>

                        {/* Search Bar - collapses to icon when mini */}
                        {showExpanded ? (
                            <div className="flex-1 max-w-[500px] transition-all duration-300">
                                <SearchSouls onResultClick={onSearchResultClick} />
                            </div>
                        ) : (
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rp-overlay/50 hover:bg-rp-overlay text-rp-subtle text-sm transition-all"
                                onClick={() => setIsHovered(true)}
                            >
                                <IconSearch size={16} />
                                <span className="hidden sm:inline">Search Souls...</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Subscribe Button - Always visible */}
                        <Link
                            href="/pricing"
                            className={cn(
                                "group hidden sm:flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rp-iris to-rp-rose font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rp-iris/30",
                                showExpanded ? "h-10 px-5 text-sm" : "h-8 px-3 text-xs"
                            )}
                        >
                            <IconSparkles size={showExpanded ? 16 : 14} className="transition-transform group-hover:rotate-12" />
                            <span className="hidden md:inline">Subscribe</span>
                        </Link>

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
                                    <span className="hidden md:inline">Create Soul</span>
                                </Link>

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
                                    <span className="hidden md:inline">Login</span>
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
                                    <span className="hidden md:inline">Sign Up</span>
                                </Link>
                            </>
                        )}

                        {/* Expand indicator when collapsed */}
                        {isCollapsed && !isHovered && (
                            <div className="text-rp-muted animate-pulse">
                                <IconChevronDown size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Divider + Categories - Only show when expanded */}
                {showExpanded && (
                    <>
                        <div className="h-px bg-gradient-to-r from-transparent via-rp-highlight-med to-transparent -mx-5 mb-3"></div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
    )
}
