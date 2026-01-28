"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    IconSearch,
    IconBell,
    IconMenu2,
    IconWallet,
    IconSparkles,
    IconPlus,
    IconX,
    IconBabyCarriage,
    IconDeviceGamepad2,
    IconMoon,
    IconBook,
    IconBriefcase,
    IconMovie,
    IconHeart,
    IconPalette,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    { id: "kids", label: "Kids", icon: IconBabyCarriage },
    { id: "gaming", label: "Gaming", icon: IconDeviceGamepad2 },
    { id: "religion", label: "Religion", icon: IconMoon },
    { id: "education", label: "Education", icon: IconBook },
    { id: "productivity", label: "Productivity", icon: IconBriefcase },
    { id: "entertainment", label: "Entertainment", icon: IconMovie },
    { id: "wellness", label: "Wellness", icon: IconHeart },
    { id: "creative", label: "Creative", icon: IconPalette },
]

export default function HeaderDemoPage() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const lastScrollY = useRef(0)
    const scrollThreshold = 100

    useEffect(() => {
        // Find the actual scrollable parent (could be the RootLayoutContainer)
        const findScrollableParent = (): HTMLElement | Window => {
            const scrollContainer = document.querySelector('main.flex-1 > div.overflow-x-hidden') as HTMLElement
            if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                return scrollContainer
            }

            // Also check for any element with overflow-auto or overflow-scroll
            const elements = document.querySelectorAll('*')
            for (const el of elements) {
                const style = window.getComputedStyle(el as Element)
                const htmlEl = el as HTMLElement
                if (
                    (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                    htmlEl.scrollHeight > htmlEl.clientHeight
                ) {
                    return htmlEl
                }
            }
            return window
        }

        const scrollTarget = findScrollableParent()

        const handleScroll = () => {
            const currentScrollY = scrollTarget === window
                ? window.scrollY
                : (scrollTarget as HTMLElement).scrollTop

            if (currentScrollY < scrollThreshold) {
                // Near top - always show full header
                setIsCollapsed(false)
            } else if (currentScrollY > lastScrollY.current + 10) {
                // Scrolling down - collapse to logo
                setIsCollapsed(true)
            } else if (currentScrollY < lastScrollY.current - 10) {
                // Scrolling up - expand header
                setIsCollapsed(false)
            }

            lastScrollY.current = currentScrollY
        }

        scrollTarget.addEventListener("scroll", handleScroll, { passive: true })

        // Also listen on window as fallback
        if (scrollTarget !== window) {
            window.addEventListener("scroll", handleScroll, { passive: true })
        }

        return () => {
            scrollTarget.removeEventListener("scroll", handleScroll)
            if (scrollTarget !== window) {
                window.removeEventListener("scroll", handleScroll)
            }
        }
    }, [])

    const showExpanded = !isCollapsed || isHovered

    return (
        <div className="min-h-[300vh] bg-rp-base">
            {/* Sticky Header Container */}
            <header
                className="sticky top-0 z-50 w-full px-4 py-3 transition-all duration-300"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Expanded Header */}
                <div
                    className={cn(
                        "mx-auto max-w-[1400px] w-full overflow-hidden transition-all duration-500 ease-out",
                        showExpanded
                            ? "opacity-100 max-h-[200px]"
                            : "opacity-0 max-h-0 pointer-events-none"
                    )}
                >
                    {/* Main Header Container */}
                    <div className="bg-rp-surface/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4">
                        {/* Top Row - Logo centered, actions on sides */}
                        <div className="flex items-center justify-between gap-4 mb-4">
                            {/* Left: Wallet + Search */}
                            <div className="flex items-center gap-3">
                                <Link href="/wallet" className="shrink-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white hover:scale-105 transition-all">
                                        <IconWallet size={20} />
                                    </div>
                                </Link>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rp-overlay/50 hover:bg-rp-overlay text-rp-subtle text-sm transition-all">
                                    <IconSearch size={16} />
                                    <span className="hidden sm:inline">Search Souls...</span>
                                </button>
                            </div>

                            {/* Center: Large Logo */}
                            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                                <Image
                                    src="/logo.svg"
                                    alt="Remrin"
                                    width={120}
                                    height={40}
                                    className="h-10 w-auto"
                                    priority
                                />
                            </Link>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/pricing"
                                    className="hidden md:flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-rp-iris to-rp-rose font-medium text-white text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all"
                                >
                                    <IconSparkles size={16} />
                                    <span className="hidden lg:inline">Subscribe</span>
                                </Link>
                                <Link
                                    href="/studio"
                                    className="hidden md:flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-medium text-white text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all"
                                >
                                    <IconPlus size={16} />
                                    <span className="hidden lg:inline">Create</span>
                                </Link>
                                <button className="w-10 h-10 rounded-xl bg-rp-overlay hover:bg-rp-base flex items-center justify-center text-rp-text transition-all">
                                    <IconBell size={20} />
                                </button>
                                <button className="md:hidden w-10 h-10 rounded-xl bg-rp-overlay hover:bg-rp-base flex items-center justify-center text-rp-text transition-all">
                                    <IconMenu2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-rp-highlight-med to-transparent mb-3" />

                        {/* Categories Row */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {CATEGORIES.map((category) => {
                                const Icon = category.icon
                                return (
                                    <button
                                        key={category.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap bg-rp-overlay hover:bg-rp-base hover:-translate-y-0.5 text-rp-text transition-all"
                                    >
                                        <Icon size={14} />
                                        {category.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Collapsed State - Logo Only */}
                <div
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 transition-all duration-500 ease-out",
                        showExpanded
                            ? "opacity-0 scale-75 pointer-events-none top-2"
                            : "opacity-100 scale-100 top-3"
                    )}
                >
                    <button
                        onClick={() => {
                            setIsCollapsed(false)
                            setIsHovered(true)
                        }}
                        className="group relative"
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-rp-iris/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Logo pill container */}
                        <div className="relative bg-rp-surface/90 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg border border-rp-highlight-med/50 hover:border-rp-iris/50 transition-all hover:shadow-rp-iris/20 hover:shadow-xl">
                            <Image
                                src="/logo.svg"
                                alt="Remrin"
                                width={80}
                                height={28}
                                className="h-7 w-auto"
                            />
                        </div>

                        {/* Expand indicator */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-0.5 bg-rp-iris/50 rounded-full" />
                        </div>
                    </button>
                </div>
            </header>

            {/* Demo Content */}
            <main className="px-4 py-8 max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-rp-text mb-4">Header Demo</h1>
                    <p className="text-rp-subtle">
                        Scroll down to see the header collapse into a floating logo.<br />
                        Scroll up or hover over the logo to expand it back.
                    </p>
                </div>

                {/* Fake content cards */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="mb-6 p-6 rounded-2xl bg-rp-surface border border-rp-highlight-med"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rp-iris to-rp-rose" />
                            <div>
                                <div className="h-4 w-32 bg-rp-overlay rounded mb-2" />
                                <div className="h-3 w-24 bg-rp-overlay/50 rounded" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-rp-overlay/30 rounded" />
                            <div className="h-3 w-5/6 bg-rp-overlay/30 rounded" />
                            <div className="h-3 w-4/6 bg-rp-overlay/30 rounded" />
                        </div>
                    </div>
                ))}
            </main>
        </div>
    )
}
