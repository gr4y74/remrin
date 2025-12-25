"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Category {
    id: string
    name: string
    slug: string
    icon: string | null
    color: string | null
}

interface CategoryTabsProps {
    categories: Category[]
    selectedCategory: string | null
    onSelectCategory: (slug: string | null) => void
}

export function CategoryTabs({
    categories,
    selectedCategory,
    onSelectCategory
}: CategoryTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftGradient, setShowLeftGradient] = useState(false)
    const [showRightGradient, setShowRightGradient] = useState(true)

    const handleScroll = () => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setShowLeftGradient(scrollLeft > 0)
        setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
        handleScroll()
    }, [categories])

    const allCategories = [
        { id: "all", name: "All", slug: "", icon: "✨", color: null },
        ...categories
    ]

    return (
        <div className="relative">
            {/* Left Gradient */}
            {showLeftGradient && (
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-rp-base to-transparent" />
            )}

            {/* Scrollable Tabs */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="scrollbar-hide flex gap-2 overflow-x-auto px-1 py-2"
            >
                {allCategories.map((category) => {
                    const isActive =
                        category.slug === "" ? selectedCategory === null : selectedCategory === category.slug

                    return (
                        <button
                            key={category.id}
                            onClick={() => onSelectCategory(category.slug === "" ? null : category.slug)}
                            className={cn(
                                "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-rp-overlay text-rp-text"
                                    : "text-rp-subtle hover:bg-rp-surface hover:text-rp-text"
                            )}
                        >
                            {/* Icon */}
                            {category.icon && <span className="text-base">{category.icon}</span>}

                            {/* Name */}
                            <span>{category.name}</span>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute -bottom-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-rp-iris to-rp-foam" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Right Gradient */}
            {showRightGradient && (
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-rp-base to-transparent" />
            )}
        </div>
    )
}
