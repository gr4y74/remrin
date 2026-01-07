import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Users, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedFilterSidebarProps {
    currentFilter: string
    onFilterChange: (filter: string) => void
}

export function FeedFilterSidebar({
    currentFilter,
    onFilterChange
}: FeedFilterSidebarProps) {
    const filters = [
        { id: 'for-you', label: 'For You', icon: Sparkles },
        { id: 'trending', label: 'Trending', icon: TrendingUp },
        { id: 'following', label: 'Following', icon: Users },
        { id: 'saved', label: 'Saved', icon: Bookmark },
    ]

    return (
        <div className="flex flex-col gap-4 py-8 items-center h-full max-h-[85vh] justify-center">
            {filters.map((filter) => {
                const Icon = filter.icon
                const isActive = currentFilter === filter.id

                return (
                    <div key={filter.id} className="group relative flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onFilterChange(filter.id)}
                            className={cn(
                                "w-12 h-12 rounded-full transition-all duration-200",
                                isActive
                                    ? "bg-rp-iris text-white shadow-lg shadow-rp-iris/20 scale-110"
                                    : "bg-rp-surface/50 text-rp-muted hover:bg-rp-surface hover:text-rp-text hover:scale-105 border border-white/5"
                            )}
                            title={filter.label}
                        >
                            <Icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
                        </Button>

                        {/* Tooltip on hover */}
                        <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {filter.label}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
