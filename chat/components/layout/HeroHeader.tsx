"use client"

import { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type HeroHeaderVariant = "default" | "minimal" | "transparent"

interface HeroHeaderProps {
    /** Header variant affects background and border styling */
    variant?: HeroHeaderVariant
    /** Show the logo (default: true) */
    showLogo?: boolean
    /** Optional title to display alongside or instead of logo */
    title?: string
    /** Optional subtitle below the title */
    subtitle?: string
    /** Action elements (buttons, links) for the right side */
    actions?: ReactNode
    /** Additional content to render below the main header row */
    children?: ReactNode
    /** Additional className for the header */
    className?: string
    /** Whether the header should be sticky */
    sticky?: boolean
}

const VARIANT_STYLES: Record<HeroHeaderVariant, string> = {
    default: "border-b border-rp-highlight-med bg-rp-base/95 backdrop-blur-sm",
    minimal: "bg-transparent",
    transparent: "bg-transparent border-b border-transparent",
}

/**
 * HeroHeader - Unified header component for all pages
 * 
 * Features:
 * - Theme-aware logo (light/dark mode)
 * - Configurable variants (default, minimal, transparent)
 * - Actions slot for buttons/links
 * - Optional title/subtitle
 * - Sticky positioning option
 * - Consistent styling across all pages
 * 
 * Usage:
 * ```tsx
 * <HeroHeader
 *   showLogo
 *   actions={
 *     <>
 *       <Link href="/summon">Soul Summons</Link>
 *       <Link href="/login">Sign In</Link>
 *     </>
 *   }
 * />
 * ```
 * 
 * With title:
 * ```tsx
 * <HeroHeader
 *   title="Discover"
 *   subtitle="Explore AI companions"
 *   actions={<Button>Create</Button>}
 * />
 * ```
 */
export function HeroHeader({
    variant = "default",
    showLogo = true,
    title,
    subtitle,
    actions,
    children,
    className,
    sticky = false,
}: HeroHeaderProps) {
    const { theme } = useTheme()

    return (
        <header
            className={cn(
                // Base styles
                "relative z-50 flex flex-col",
                // Variant styles
                VARIANT_STYLES[variant],
                // Sticky positioning
                sticky && "sticky top-0",
                className
            )}
        >
            {/* Main header row */}
            <div className="flex items-center justify-between px-4 py-4 md:px-6">
                {/* Left section: Logo and/or Title */}
                <div className="flex items-center gap-4">
                    {showLogo && (
                        <Link href="/" className="flex items-center">
                            <Image
                                src={theme === "light" ? "/logo_dark.svg" : "/logo.svg"}
                                alt="Remrin"
                                width={128}
                                height={40}
                                className="h-8 w-auto drop-shadow-[0_0_12px_rgba(235,188,186,0.4)] transition-transform duration-300 ease-out hover:rotate-[-5deg] hover:scale-105"
                                priority
                            />
                        </Link>
                    )}

                    {/* Title/Subtitle section */}
                    {(title || subtitle) && (
                        <div className={cn(showLogo && "border-l border-rp-highlight-med pl-4")}>
                            {title && (
                                <h1 className="font-tiempos-headline text-xl font-semibold text-rp-text">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-sm text-rp-subtle">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right section: Actions */}
                {actions && (
                    <div className="flex items-center gap-4">
                        {actions}
                    </div>
                )}
            </div>

            {/* Optional additional content (search bars, tabs, etc.) */}
            {children}
        </header>
    )
}
