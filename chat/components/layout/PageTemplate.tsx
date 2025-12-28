"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Footer } from "./Footer"
import { PageHeader } from "./PageHeader"
import { SIDEBAR } from "@/lib/design-system"

const MAX_WIDTHS = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
} as const

interface PageTemplateProps {
    children: ReactNode
    /** Custom header content - if provided, replaces default PageHeader */
    header?: ReactNode
    /** Show the default header (default: true) - ignored if custom header is provided */
    showHeader?: boolean
    /** Show the footer (default: true) */
    showFooter?: boolean
    /** Maximum width of the content area */
    maxWidth?: keyof typeof MAX_WIDTHS
    /** Additional className for the main wrapper */
    className?: string
    /** Additional className for the content area */
    contentClassName?: string
    /** Header title (used with default header) */
    title?: string
    /** Header action buttons slot (used with default header) */
    headerActions?: ReactNode
    /** Whether the page has a full-bleed background (no padding) */
    fullBleed?: boolean
}

/**
 * PageTemplate - Standardized page layout component
 * 
 * Provides consistent layout with:
 * - Proper sidebar offset (handled by root layout - this component just provides content structure)
 * - Optional header with logo and actions
 * - Main content area with configurable max-width
 * - Optional footer
 * 
 * Usage:
 * ```tsx
 * <PageTemplate title="My Page" headerActions={<Button>Action</Button>}>
 *   <YourContent />
 * </PageTemplate>
 * ```
 * 
 * Or with custom header:
 * ```tsx
 * <PageTemplate header={<CustomHeader />} showFooter={false}>
 *   <YourContent />
 * </PageTemplate>
 * ```
 */
export function PageTemplate({
    children,
    header,
    showHeader = true,
    showFooter = true,
    maxWidth = "xl",
    className,
    contentClassName,
    title,
    headerActions,
    fullBleed = false,
}: PageTemplateProps) {
    const renderHeader = () => {
        // Custom header provided
        if (header) {
            return header
        }

        // Default header
        if (showHeader) {
            return <PageHeader title={title} actions={headerActions} />
        }

        return null
    }

    return (
        <div className={cn("bg-rp-base min-h-screen flex flex-col", className)}>
            {/* Header Section */}
            {renderHeader()}

            {/* Main Content Area */}
            <main
                className={cn(
                    "flex-1",
                    !fullBleed && "px-4 py-6 md:px-8 md:py-8",
                    !fullBleed && MAX_WIDTHS[maxWidth],
                    !fullBleed && "mx-auto w-full",
                    contentClassName
                )}
            >
                {children}
            </main>

            {/* Footer Section */}
            {showFooter && <Footer />}
        </div>
    )
}

// Re-export for convenience
export { PageHeader } from "./PageHeader"
