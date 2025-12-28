"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { IconSun, IconMoon } from "@tabler/icons-react"

interface SidebarThemeToggleProps {
    isExpanded: boolean
}

/**
 * SidebarThemeToggle - Dark/Light mode toggle for sidebar
 * 
 * Shows icon-only when collapsed, full toggle when expanded
 */
export function SidebarThemeToggle({ isExpanded }: SidebarThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = resolvedTheme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    // Render placeholder during SSR to avoid hydration mismatch
    if (!mounted) {
        return (
            <div
                className={cn(
                    "flex min-h-[44px] items-center rounded-lg",
                    "text-rp-subtle",
                    isExpanded ? "gap-3 px-3 py-2 justify-start w-full" : "justify-center p-2"
                )}
            >
                <div className="size-5" /> {/* Placeholder for icon */}
            </div>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "flex min-h-[44px] items-center rounded-lg transition-all",
                "text-rp-subtle hover:bg-rp-overlay hover:text-rp-text",
                isExpanded ? "gap-3 px-3 py-2 justify-start w-full" : "justify-center p-2"
            )}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {/* Icon with rotation animation */}
            <motion.div
                className="shrink-0"
                initial={false}
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
            >
                {isDark ? (
                    <IconMoon size={20} />
                ) : (
                    <IconSun size={20} />
                )}
            </motion.div>

            {/* Label - only when expanded */}
            <motion.span
                className="font-tiempos-text whitespace-nowrap text-sm font-medium overflow-hidden"
                initial={false}
                animate={{
                    opacity: isExpanded ? 1 : 0,
                    width: isExpanded ? "auto" : 0
                }}
                transition={{ duration: 0.2 }}
            >
                {isDark ? "Dark Mode" : "Light Mode"}
            </motion.span>
        </button>
    )
}
