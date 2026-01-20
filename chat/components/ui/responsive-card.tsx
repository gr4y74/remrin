import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
    clickable?: boolean
}

const ResponsiveCard = React.forwardRef<HTMLDivElement, ResponsiveCardProps>(
    ({ className, clickable, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "bg-rp-surface text-rp-text rounded-2xl border border-rp-muted/20 shadow-sm transition-all duration-200",
                "p-3 md:p-4 lg:p-6",
                clickable && "cursor-pointer hover:bg-rp-overlay active:scale-[0.98] min-h-[44px]",
                className
            )}
            {...props}
        />
    )
)
ResponsiveCard.displayName = "ResponsiveCard"

const ResponsiveCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-4", className)}
        {...props}
    />
))
ResponsiveCardHeader.displayName = "ResponsiveCardHeader"

const ResponsiveCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg md:text-xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
ResponsiveCardTitle.displayName = "ResponsiveCardTitle"

const ResponsiveCardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-rp-subtle text-sm", className)}
        {...props}
    />
))
ResponsiveCardDescription.displayName = "ResponsiveCardDescription"

const ResponsiveCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
))
ResponsiveCardContent.displayName = "ResponsiveCardContent"

const ResponsiveCardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center pt-4", className)}
        {...props}
    />
))
ResponsiveCardFooter.displayName = "ResponsiveCardFooter"

export {
    ResponsiveCard,
    ResponsiveCardHeader,
    ResponsiveCardFooter,
    ResponsiveCardTitle,
    ResponsiveCardDescription,
    ResponsiveCardContent
}
