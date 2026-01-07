'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Users, Bookmark, Settings, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleFilterMenuProps {
    currentFilter: string
    onFilterChange: (filter: string) => void
    isUIVisible: boolean
}

export function CollapsibleFilterMenu({
    currentFilter,
    onFilterChange,
    isUIVisible
}: CollapsibleFilterMenuProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const filters = [
        { id: 'for-you', label: 'For You', icon: Sparkles },
        { id: 'trending', label: 'Trending', icon: TrendingUp },
        { id: 'following', label: 'Following', icon: Users },
        { id: 'saved', label: 'Saved', icon: Bookmark },
    ]

    const currentFilterData = filters.find(f => f.id === currentFilter) || filters[0]
    const CurrentIcon = currentFilterData.icon

    return (
        <div className={cn(
            "relative transition-opacity duration-300",
            isUIVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-12 h-12 rounded-full transition-all duration-200",
                    "bg-rp-surface/50 text-rp-text hover:bg-rp-surface hover:scale-105 border border-white/5"
                )}
                title="Filters"
            >
                <Settings className="w-6 h-6" />
            </Button>

            {/* Expanded Menu */}
            {isExpanded && (
                <div className="absolute left-full ml-3 top-0 bg-rp-surface/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 min-w-[160px] animate-in fade-in slide-in-from-left-2 duration-200">
                    {filters.map((filter) => {
                        const Icon = filter.icon
                        const isActive = currentFilter === filter.id

                        return (
                            <button
                                key={filter.id}
                                onClick={() => {
                                    onFilterChange(filter.id)
                                    setIsExpanded(false)
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left",
                                    isActive
                                        ? "bg-rp-iris text-white shadow-md"
                                        : "text-rp-text hover:bg-rp-overlay"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                                <span className="text-sm font-medium">{filter.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
