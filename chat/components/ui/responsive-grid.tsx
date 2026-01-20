import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
    cols?: {
        mobile?: number
        tablet?: number
        desktop?: number
        lg?: number
        xl?: number
    }
    gap?: string | number
}

export function ResponsiveGrid({
    children,
    cols = { mobile: 1, tablet: 2, desktop: 3, lg: 4 },
    gap = 4,
    className,
    ...props
}: ResponsiveGridProps) {
    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
        9: "grid-cols-9",
        10: "grid-cols-10",
        11: "grid-cols-11",
        12: "grid-cols-12",
    }

    const gapClasses = {
        1: "gap-1",
        2: "gap-2",
        3: "gap-3",
        4: "gap-4",
        5: "gap-5",
        6: "gap-6",
        8: "gap-8",
        10: "gap-10",
        12: "gap-12",
    }

    return (
        <div
            className={cn(
                "grid w-full",
                gridCols[(cols.mobile || 1) as keyof typeof gridCols],
                cols.tablet && `md:${gridCols[cols.tablet as keyof typeof gridCols]}`,
                cols.desktop && `lg:${gridCols[cols.desktop as keyof typeof gridCols]}`,
                cols.lg && `xl:${gridCols[cols.lg as keyof typeof gridCols]}`,
                cols.xl && `2xl:${gridCols[cols.xl as keyof typeof gridCols]}`,
                typeof gap === "number" ? gapClasses[gap as keyof typeof gapClasses] : gap,
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
