import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageContainerProps {
    children: ReactNode
    className?: string
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const MAX_WIDTHS = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
}

export function PageContainer({
    children,
    className,
    maxWidth = "xl",
}: PageContainerProps) {
    return (
        <div
            className={cn(
                "mx-auto w-full",
                // Responsive padding: mobile (px-4), tablet (px-6), desktop (px-8)
                "px-4 sm:px-6 lg:px-8",
                // Responsive vertical padding
                "py-4 sm:py-6 lg:py-8",
                MAX_WIDTHS[maxWidth],
                className
            )}
        >
            {children}
        </div>
    )
}
