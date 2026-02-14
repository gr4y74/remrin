"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    IconShoppingCart,
    IconMenu2,
    IconX,
    IconSparkles,
    IconPlus,
    IconWallet,
    IconLogin,
    IconUser,
    IconLogout,
    IconBell,
    IconBrandDiscord,
    IconBrandReddit,
    IconBrandTiktok,
    IconBrandX,
    IconBrandInstagram
} from "@tabler/icons-react"
import { SearchSouls } from "@/components/ui/SearchSouls"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import { useRecentChats } from "@/hooks/useRecentChats"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FloatingPillNavProps {
    onSearchResultClick: (personaId: string) => void
    isLoggedIn: boolean
    profile?: {
        user_id: string
        hero_image_url?: string | null
        username?: string | null
    } | null
}

interface RecentChat {
    id: string
    persona_id: string
    persona_name: string
    persona_image: string | null
    last_message_at: string
}

interface TrendingTag {
    id: string
    label: string
    color: string
    count?: number
}

export function FloatingPillNav({
    onSearchResultClick,
    isLoggedIn,
    profile
}: FloatingPillNavProps) {
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const pillRef = useRef<HTMLDivElement>(null)
    const { recentChats: recentChatsData } = useRecentChats()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Fetch recent chats and trending tags when expanded
    useEffect(() => {
        if (!isExpanded) return

        // Fetch trending tags
        const fetchTrendingTags = async () => {
            try {
                const response = await fetch("/api/discovery/trending-tags")
                const data = await response.json()
                if (data.tags && Array.isArray(data.tags)) {
                    setTrendingTags(data.tags)
                } else {
                    // Fallback to default tags if API fails
                    setTrendingTags([
                        { id: "1", label: "AI Companions", color: "bg-rp-iris" },
                        { id: "2", label: "Fantasy", color: "bg-rp-rose" },
                        { id: "3", label: "Roleplay", color: "bg-rp-foam" },
                        { id: "4", label: "Gaming", color: "bg-purple-500" },
                        { id: "5", label: "Anime", color: "bg-pink-500" },
                        { id: "6", label: "Creative Writing", color: "bg-rp-gold" },
                    ])
                }
            } catch (error) {
                console.error("Error fetching trending tags:", error)
                // Fallback to default tags
                setTrendingTags([
                    { id: "1", label: "AI Companions", color: "bg-rp-iris" },
                    { id: "2", label: "Fantasy", color: "bg-rp-rose" },
                    { id: "3", label: "Roleplay", color: "bg-rp-foam" },
                    { id: "4", label: "Gaming", color: "bg-purple-500" },
                    { id: "5", label: "Anime", color: "bg-pink-500" },
                    { id: "6", label: "Creative Writing", color: "bg-rp-gold" },
                ])
            }
        }

        fetchTrendingTags()
    }, [isExpanded])

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

    // Click outside to close
    useEffect(() => {
        if (!isExpanded) return

        const handleClickOutside = (event: MouseEvent) => {
            if (pillRef.current && !pillRef.current.contains(event.target as Node)) {
                setIsExpanded(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isExpanded])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    const handleChatClick = (chatId: string) => {
        router.push(`/chat/${chatId}`)
        setIsExpanded(false)
    }

    return (
        <div
            ref={pillRef}
            className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none"
        >
            {/* Collapsed Pill */}
            <div
                className={cn(
                    "bg-rp-surface/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all duration-300 w-fit max-w-[300px] pointer-events-auto",
                    isExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                <div className="flex items-center gap-3 px-4 py-1.5 min-h-[48px]">
                    {/* Logo */}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="transition-transform hover:scale-[1.02] focus:outline-none flex-shrink-0"
                        aria-label="Expand navigation"
                    >
                        {mounted && (
                            <Image
                                src={resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"}
                                alt="Remrin"
                                width={100}
                                height={26}
                                className="h-[26px] w-auto flex-shrink-0"
                                priority
                            />
                        )}
                    </button>

                    {/* Shopping Cart */}
                    <Link
                        href="/wallet"
                        className="p-2 rounded-full hover:bg-rp-overlay transition-colors"
                        aria-label="Wallet"
                    >
                        <IconShoppingCart size={20} className="text-rp-text" />
                    </Link>

                    {/* Hamburger Menu */}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="p-2 rounded-full hover:bg-rp-overlay transition-colors"
                        aria-label="Open menu"
                    >
                        <IconMenu2 size={20} className="text-rp-text" />
                    </button>
                </div>
            </div>

            {/* Expanded Dropdown */}
            <div
                className={cn(
                    "bg-rp-surface/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-300 w-[90vw] max-w-[650px]",
                    isExpanded ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
                )}
            >
                <div className="p-5 space-y-4">
                    {/* Header Row: Logo + Close */}
                    <div className="flex items-center justify-between">
                        <Link href="/" onClick={() => setIsExpanded(false)}>
                            {mounted && (
                                <Image
                                    src={resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"}
                                    alt="Remrin"
                                    width={140}
                                    height={35}
                                    className="h-8 w-auto"
                                    priority
                                />
                            )}
                        </Link>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-2 rounded-full hover:bg-rp-overlay transition-colors"
                            aria-label="Close menu"
                        >
                            <IconX size={20} className="text-rp-text" />
                        </button>
                    </div>

                    {/* Section 1: Search Box */}
                    <div className="w-full">
                        <SearchSouls onResultClick={(id) => {
                            onSearchResultClick(id)
                            setIsExpanded(false)
                        }} />
                    </div>

                    {/* Section 2: Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/pricing"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rp-iris to-rp-rose text-white text-sm font-medium hover:shadow-lg transition-all"
                            onClick={() => setIsExpanded(false)}
                        >
                            <IconSparkles size={16} />
                            <span>Subscribe</span>
                        </Link>

                        {isLoggedIn ? (
                            <>
                                <Link
                                    href="/studio"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-lg transition-all"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <IconPlus size={16} />
                                    <span>Create Soul</span>
                                </Link>

                                <Link
                                    href="/wallet"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text text-sm font-medium transition-all"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <IconWallet size={16} />
                                    <span>Wallet</span>
                                </Link>

                                {/* Notifications */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text text-sm font-medium transition-all">
                                            <IconBell size={16} />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                    {unreadCount > 9 ? "9+" : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="p-0 border-none bg-transparent shadow-none">
                                        <NotificationDropdown onMarkAsRead={() => setUnreadCount(prev => Math.max(0, prev - 1))} />
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* User Profile */}
                                <Link
                                    href={`/profile/${profile?.user_id}`}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text text-sm font-medium transition-all"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    {profile?.hero_image_url ? (
                                        <Image
                                            src={profile.hero_image_url}
                                            alt="Profile"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 rounded-full object-cover"
                                        />
                                    ) : (
                                        <IconUser size={16} />
                                    )}
                                    <span>Profile</span>
                                </Link>

                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setIsExpanded(false)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-overlay hover:bg-rp-base text-red-400 text-sm font-medium transition-all"
                                >
                                    <IconLogout size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text text-sm font-medium transition-all"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <IconLogin size={16} />
                                    <span>Login</span>
                                </Link>

                                <Link
                                    href="/signup"
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rp-overlay hover:bg-rp-base text-rp-text text-sm font-medium transition-all"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <IconUser size={16} />
                                    <span>Sign Up</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Section 3: Trending Tags */}
                    <div>
                        <p className="text-xs font-semibold text-rp-muted uppercase tracking-wider mb-2">
                            Trending Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {trendingTags.map((tag) => (
                                <button
                                    key={tag.id}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:scale-105",
                                        tag.color
                                    )}
                                    onClick={() => {
                                        // TODO: Navigate to tag search
                                        setIsExpanded(false)
                                    }}
                                >
                                    {tag.label}
                                    {tag.count && (
                                        <span className="ml-1.5 opacity-75">({tag.count})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Recent Chats */}
                    {isLoggedIn && recentChatsData.length > 0 && (
                        <>
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div>
                                <p className="text-xs font-semibold text-rp-muted uppercase tracking-wider mb-2">
                                    Recent Chats
                                </p>
                                <div className="space-y-2">
                                    {recentChatsData.slice(0, 3).map((chat) => (
                                        <button
                                            key={chat.personaId}
                                            onClick={() => handleChatClick(chat.personaId)}
                                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-rp-overlay transition-colors"
                                        >
                                            {chat.personaImage ? (
                                                <Image
                                                    src={chat.personaImage}
                                                    alt={chat.personaName}
                                                    width={32}
                                                    height={32}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-rp-iris flex items-center justify-center">
                                                    <IconUser size={16} className="text-white" />
                                                </div>
                                            )}
                                            <span className="text-sm text-rp-text font-medium">
                                                {chat.personaName}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer: Remrin Socials and Logo */}
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex flex-col items-center gap-3 pt-2">
                        {/* Remrin Logo */}
                        {mounted && (
                            <Image
                                src={resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"}
                                alt="Remrin"
                                width={100}
                                height={25}
                                className="h-6 w-auto opacity-60"
                            />
                        )}

                        {/* Social Icons */}
                        <div className="flex items-center gap-3">
                            <a
                                href="https://discord.gg/remrin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rp-muted hover:text-rp-text transition-colors"
                                aria-label="Discord"
                            >
                                <IconBrandDiscord size={18} />
                            </a>
                            <a
                                href="https://reddit.com/r/remrin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rp-muted hover:text-rp-text transition-colors"
                                aria-label="Reddit"
                            >
                                <IconBrandReddit size={18} />
                            </a>
                            <a
                                href="https://tiktok.com/@remrin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rp-muted hover:text-rp-text transition-colors"
                                aria-label="TikTok"
                            >
                                <IconBrandTiktok size={18} />
                            </a>
                            <a
                                href="https://x.com/remrin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rp-muted hover:text-rp-text transition-colors"
                                aria-label="X (Twitter)"
                            >
                                <IconBrandX size={18} />
                            </a>
                            <a
                                href="https://instagram.com/remrin"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rp-muted hover:text-rp-text transition-colors"
                                aria-label="Instagram"
                            >
                                <IconBrandInstagram size={18} />
                            </a>
                        </div>

                        {/* Date, Copyright, AI Warning */}
                        <div className="text-center">
                            <p className="text-[10px] text-rp-muted">
                                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                            <p className="text-[10px] text-rp-muted">
                                © {new Date().getFullYear()} Remrin AI
                            </p>
                            <p className="text-[10px] text-rp-muted italic">
                                AI-generated content may be inaccurate
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
