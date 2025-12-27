import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ResponsiveGridProps {
    children: ReactNode
    className?: string
}

export function ResponsiveGrid({ children, className }: ResponsiveGridProps) {
    return (
        <div
            className={cn(
                "grid gap-4",
                "grid-cols-2",
                "sm:grid-cols-3",
                "lg:grid-cols-4",
                "xl:grid-cols-5",
                className
            )}
        >
            {children}
        </div>
    )
}
