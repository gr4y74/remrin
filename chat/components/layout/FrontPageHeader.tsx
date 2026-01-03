"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPuzzle, IconX, IconSparkles, IconLogin } from "@tabler/icons-react"
import { SearchSouls } from "@/components/ui/SearchSouls"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    { id: "kids", label: "Kids", color: "text-pink-400" },
    { id: "gaming", label: "Gaming", color: "text-purple-400" },
    { id: "religion", label: "Religion", color: "text-amber-400" },
    { id: "education", label: "Education", color: "text-blue-400" },
    { id: "productivity", label: "Productivity", color: "text-green-400" },
    { id: "entertainment", label: "Entertainment", color: "text-rose-400" },
    { id: "wellness", label: "Wellness", color: "text-cyan-400" },
    { id: "creative", label: "Creative", color: "text-violet-400" }
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
    const [showBanner, setShowBanner] = useState(true)

    // Check localStorage for banner dismissal
    useEffect(() => {
        const dismissed = localStorage.getItem("remrin_extension_banner_dismissed")
        if (dismissed === "true") {
            setShowBanner(false)
        }
    }, [])

    const handleDismissBanner = () => {
        localStorage.setItem("remrin_extension_banner_dismissed", "true")
        setShowBanner(false)
    }

    const handleCategoryClick = (categoryId: string) => {
        if (onCategoryClick) {
            onCategoryClick(categoryId)
        } else {
            // Default: scroll to Explore All Souls section
            const exploreSection = document.querySelector('[data-section="explore-souls"]')
            if (exploreSection) {
                exploreSection.scrollIntoView({ behavior: "smooth" })
            }
        }
    }

    return (
        <header className="sticky top-0 z-40 w-full bg-rp-base/95 backdrop-blur-sm">
            {/* Extension Banner */}
            {showBanner && (
                <div className="relative border-b border-blue-500/30 bg-blue-500/10 px-4 py-3">
                    <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
                        <IconPuzzle size={20} className="flex-shrink-0 text-blue-400" />
                        <p className="text-center text-sm text-rp-text">
                            <span className="font-medium">Bring your Souls everywhere</span> - Get the{" "}
                            <Link
                                href="/extension"
                                className="font-semibold text-blue-400 underline decoration-blue-400/30 underline-offset-2 hover:decoration-blue-400"
                            >
                                Remrin Locket Extension
                            </Link>{" "}
                            for Chrome, Gemini, Claude, ChatGPT & more!
                        </p>
                        <button
                            onClick={handleDismissBanner}
                            className="flex-shrink-0 text-rp-muted transition-colors hover:text-rp-text"
                            aria-label="Dismiss banner"
                        >
                            <IconX size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Header Content */}
            <div className="px-4 py-4">
                <div className="mx-auto max-w-7xl space-y-4">
                    {/* Top Row: Search + Auth Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                        {/* Search Bar */}
                        <div className="flex-1 sm:max-w-md">
                            <SearchSouls onResultClick={onSearchResultClick} />
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/pricing"
                                className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
                            >
                                <IconSparkles size={18} className="transition-transform group-hover:rotate-12" />
                                Subscribe
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center gap-2 rounded-lg border border-rp-highlight-med bg-rp-surface px-4 py-2 text-sm font-medium text-rp-text transition-colors hover:border-rp-iris hover:bg-rp-base"
                            >
                                <IconLogin size={18} />
                                Login
                            </Link>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs font-medium text-rp-muted">Browse:</span>
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={cn(
                                    "rounded-full border border-rp-highlight-med bg-rp-surface px-3 py-1.5 text-xs font-medium transition-all hover:scale-105",
                                    category.color,
                                    "hover:border-current hover:bg-rp-base hover:shadow-lg hover:shadow-current/20"
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    )
}
