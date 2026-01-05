"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
    IconPalette
} from "@tabler/icons-react"
import { SearchSouls } from "@/components/ui/SearchSouls"
import { cn } from "@/lib/utils"

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
        <header className="sticky top-0 z-40 w-full px-4 py-4">
            {/* Extension Banner */}
            {showBanner && (
                <div className="relative flex justify-center items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl mb-4 max-w-fit mx-auto">
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
            <div className="bg-rp-surface/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-[1400px] mx-auto p-4 md:p-6">
                {/* Top Row */}
                <div className="flex items-center justify-between gap-6 mb-4">
                    {/* Left: Logo + Search */}
                    <div className="flex items-center gap-6 flex-1">
                        {/* Logo */}
                        <Link href="/" className="shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-rp-iris to-rp-rose rounded-xl flex items-center justify-center text-white font-bold text-xl hover:scale-105 transition-transform cursor-pointer">
                                S
                            </div>
                        </Link>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-[500px]">
                            <SearchSouls onResultClick={onSearchResultClick} />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/pricing"
                            className="group hidden sm:flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rp-iris to-rp-rose px-5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rp-iris/30"
                        >
                            <IconSparkles size={16} className="transition-transform group-hover:rotate-12" />
                            <span className="hidden md:inline">Subscribe</span>
                        </Link>
                        <Link
                            href="/login"
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-rp-overlay hover:bg-rp-base px-4 text-sm font-medium text-rp-text transition-all"
                        >
                            <IconLogin size={16} />
                            <span className="hidden md:inline">Login</span>
                        </Link>
                        <button className="w-10 h-10 rounded-xl bg-rp-overlay hover:bg-rp-base flex items-center justify-center transition-all shrink-0">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-rp-text">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-rp-highlight-med to-transparent -mx-6 mb-4"></div>

                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map((category) => {
                        const Icon = category.icon
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-rp-overlay hover:bg-rp-base hover:-translate-y-0.5 text-rp-text border-0"
                            >
                                <Icon size={14} className="shrink-0" />
                                {category.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </header>
    )
}
