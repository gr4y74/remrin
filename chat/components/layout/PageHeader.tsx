"use client"

import { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
    /** Optional title to display */
    title?: string
    /** Action buttons or other elements to show on the right */
    actions?: ReactNode
    /** Additional className for the header */
    className?: string
    /** Show the logo (default: true) */
    showLogo?: boolean
    /** Show back button instead of logo */
    showBackButton?: boolean
    /** Back button href (default: "/") */
    backHref?: string
}

/**
 * PageHeader - Standardized header component
 * 
 * Features:
 * - Theme-aware logo (light/dark mode)
 * - Optional title display
 * - Actions slot for buttons/links
 * - Proper z-index to stay above sidebar
 * - Consistent styling across all pages
 */
export function PageHeader({
    title,
    actions,
    className,
    showLogo = true,
    showBackButton = false,
    backHref = "/",
}: PageHeaderProps) {
    const { resolvedTheme } = useTheme()

    return (
        <header
            className={cn(
                // Base styles
                "relative z-50 flex items-center justify-between",
                // Border and background
                "border-b border-rp-highlight-med bg-rp-base/95 backdrop-blur-sm",
                // Padding - consistent across all pages
                "px-4 py-4 md:px-6",
                className
            )}
        >
            {/* Left section: Logo or Back button */}
            <div className="flex items-center gap-4">
                {showBackButton ? (
                    <Link
                        href={backHref}
                        className="flex items-center gap-2 text-rp-subtle hover:text-rp-text transition-colors"
                    >
                        <svg
                            className="size-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back</span>
                    </Link>
                ) : showLogo ? (
                    <Link href="/" className="flex items-center">
                        <Image
                            src={resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"}
                            alt="Remrin"
                            width={128}
                            height={40}
                            className="h-8 w-auto drop-shadow-[0_0_12px_rgba(235,188,186,0.4)] transition-transform duration-300 ease-out hover:rotate-[-5deg] hover:scale-105"
                            priority
                        />
                    </Link>
                ) : null}

                {/* Optional title */}
                {title && (
                    <h1 className="font-tiempos-headline text-xl font-semibold text-rp-text">
                        {title}
                    </h1>
                )}
            </div>

            {/* Right section: Actions */}
            {actions && (
                <div className="flex items-center gap-4">
                    {actions}
                </div>
            )}
        </header>
    )
}
