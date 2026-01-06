"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { IconMessage } from "@tabler/icons-react"

interface SidebarRecentChatsProps {
    isExpanded: boolean
    maxChats?: number
    showDemo?: boolean // Set to true to show demo content
}

// Demo data for preview purposes
const DEMO_CHATS = [
    { id: "demo-1", name: "Rem", imageUrl: "/images/rem_hero.webp", href: "#" },
    { id: "demo-2", name: "Marcus", imageUrl: "https://picsum.photos/seed/marcus/200", href: "#" },
    { id: "demo-3", name: "Aria", imageUrl: "https://picsum.photos/seed/aria/200", href: "#" },
    { id: "demo-4", name: "Rex", imageUrl: "https://picsum.photos/seed/rex/200", href: "#" },
    { id: "demo-5", name: "Celeste", imageUrl: "https://picsum.photos/seed/celeste/200", href: "#" },
    { id: "demo-6", name: "Drake", imageUrl: "https://picsum.photos/seed/drake/200", href: "#" },
    { id: "demo-7", name: "Sophia", imageUrl: "https://picsum.photos/seed/sophia/200", href: "#" },
    { id: "demo-8", name: "Atlas", imageUrl: "https://picsum.photos/seed/atlas/200", href: "#" },
]

/**
 * SidebarRecentChats - Recent chats list
 * 
 * Shows avatars of recent chat sessions when collapsed,
 * and full names when expanded.
 */
export function SidebarRecentChats({ isExpanded, maxChats = 8, showDemo = false }: SidebarRecentChatsProps) {
    // Use state to prevent hydration errors
    const [mounted, setMounted] = useState(false)
    const [recentChatsData, setRecentChatsData] = useState<Array<{
        personaId: string
        personaName: string
        personaImage: string
        lastChatAt: string
        workspaceId: string
    }>>([])

    // Load recent chats from localStorage only on client side
    useEffect(() => {
        setMounted(true)

        if (showDemo) return

        try {
            const stored = localStorage.getItem('recentChats')
            if (stored) {
                setRecentChatsData(JSON.parse(stored))
            }
        } catch (error) {
            console.error('Error loading recent chats:', error)
        }
    }, [showDemo])

    // Get recent chats
    const recentChats = useMemo(() => {
        // If showDemo is true, return demo data
        if (showDemo) {
            return DEMO_CHATS.slice(0, maxChats)
        }

        // Don't render until mounted to prevent hydration errors
        if (!mounted) return []

        // Sort by most recent
        const sorted = [...recentChatsData].sort((a, b) =>
            new Date(b.lastChatAt).getTime() - new Date(a.lastChatAt).getTime()
        )

        // Map to sidebar format
        return sorted.slice(0, maxChats).map(chat => ({
            id: chat.personaId,
            name: chat.personaName,
            imageUrl: chat.personaImage,
            href: `/${chat.workspaceId}/chat?persona=${chat.personaId}`
        }))
    }, [maxChats, showDemo, mounted, recentChatsData])

    // Don't render if no recent chats (and not in demo mode)
    if (recentChats.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className={cn(
                "flex items-center px-3 py-2 text-xs font-medium uppercase tracking-wider text-rp-subtle",
                isExpanded ? "justify-start" : "justify-center"
            )}>
                <motion.span
                    initial={false}
                    animate={{
                        opacity: isExpanded ? 1 : 0,
                        width: isExpanded ? "auto" : 0
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                >
                    Chats
                </motion.span>
                {!isExpanded && (
                    <IconMessage size={16} className="text-rp-subtle" />
                )}
            </div>

            {/* Chat List - Compact layout, scrollable, max ~6 visible */}
            <div className="flex flex-col gap-0.5 max-h-[264px] overflow-y-auto scrollbar-hide">
                {recentChats.map((chat) => (
                    <Link
                        key={chat.id}
                        href={chat.href}
                        className={cn(
                            "group flex items-center rounded-lg transition-all",
                            "hover:bg-rp-overlay",
                            // Always center when collapsed, align left when expanded
                            isExpanded ? "gap-3 px-3 py-1.5 justify-start" : "justify-center py-1"
                        )}
                        title={chat.name}
                    >
                        {/* Avatar - centered */}
                        <div className={cn(
                            "relative shrink-0 overflow-hidden rounded-lg transition-transform",
                            "group-hover:scale-105",
                            isExpanded ? "size-8" : "size-9"
                        )}>
                            {chat.imageUrl ? (
                                <Image
                                    src={chat.imageUrl}
                                    alt={chat.name}
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center bg-rp-iris/20 text-rp-iris">
                                    <IconMessage size={14} />
                                </div>
                            )}
                        </div>

                        {/* Name - only render when expanded */}
                        {isExpanded && (
                            <span className="flex-1 truncate text-sm text-rp-text">
                                {chat.name}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    )
}
