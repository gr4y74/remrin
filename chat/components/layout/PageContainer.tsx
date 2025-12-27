import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageContainerProps {
    children: ReactNode
    className?: string
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full"
}

const MAX_WIDTHS = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
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
                "mx-auto w-full px-4 py-6 md:px-8 md:py-8",
                MAX_WIDTHS[maxWidth],
                className
            )}
        >
            {children}
        </div>
    )
}
