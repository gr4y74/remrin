"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { IconPlus, IconSparkles } from "@tabler/icons-react"

interface SidebarCreateButtonProps {
    isExpanded: boolean
}

/**
 * SidebarCreateButton - Talkie-AI inspired "Create a Talkie" button
 * 
 * Links to the "Mother of Souls" character creation flow
 */
export function SidebarCreateButton({ isExpanded }: SidebarCreateButtonProps) {
    return (
        <div className="p-2">
            <Link
                href="/summon"
                className={cn(
                    "flex min-h-[44px] items-center rounded-xl transition-all",
                    "border border-rp-muted/30 bg-rp-surface",
                    "hover:border-rp-iris/50 hover:bg-rp-overlay",
                    isExpanded ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
                )}
            >
                {/* Icon */}
                <div className={cn(
                    "shrink-0 flex items-center justify-center",
                    "size-6 rounded-lg bg-rp-iris/10 text-rp-iris"
                )}>
                    <IconPlus size={16} strokeWidth={2.5} />
                </div>

                {/* Text - only when expanded */}
                <motion.span
                    className="font-tiempos-text text-sm font-medium text-rp-text whitespace-nowrap overflow-hidden"
                    initial={false}
                    animate={{
                        opacity: isExpanded ? 1 : 0,
                        width: isExpanded ? "auto" : 0
                    }}
                    transition={{ duration: 0.2 }}
                >
                    Craft a Soul
                </motion.span>
            </Link>
        </div>
    )
}
