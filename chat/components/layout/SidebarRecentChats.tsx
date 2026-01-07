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

interface ChatItem {
    id: string
    name: string
    imageUrl: string
    href: string
    lastChatAt?: string
}

interface GroupedChats {
    label: string
    chats: ChatItem[]
}

// Demo data for preview purposes
const DEMO_CHATS = [
    { id: "demo-1", name: "Rem", imageUrl: "/images/rem_hero.webp", href: "#", lastChatAt: new Date().toISOString() },
    { id: "demo-2", name: "Marcus", imageUrl: "https://picsum.photos/seed/marcus/200", href: "#", lastChatAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "demo-3", name: "Aria", imageUrl: "https://picsum.photos/seed/aria/200", href: "#", lastChatAt: new Date(Date.now() - 172800000).toISOString() },
    { id: "demo-4", name: "Rex", imageUrl: "https://picsum.photos/seed/rex/200", href: "#", lastChatAt: new Date(Date.now() - 259200000).toISOString() },
    { id: "demo-5", name: "Celeste", imageUrl: "https://picsum.photos/seed/celeste/200", href: "#", lastChatAt: new Date(Date.now() - 604800000).toISOString() },
    { id: "demo-6", name: "Drake", imageUrl: "https://picsum.photos/seed/drake/200", href: "#", lastChatAt: new Date(Date.now() - 1209600000).toISOString() },
    { id: "demo-7", name: "Sophia", imageUrl: "https://picsum.photos/seed/sophia/200", href: "#", lastChatAt: new Date(Date.now() - 2592000000).toISOString() },
    { id: "demo-8", name: "Atlas", imageUrl: "https://picsum.photos/seed/atlas/200", href: "#", lastChatAt: new Date(Date.now() - 5184000000).toISOString() },
]

/**
 * Get time range label for a given date
 */
function getTimeRangeLabel(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Today
    if (diffDays === 0 && now.getDate() === date.getDate()) {
        return "Today"
    }

    // Yesterday
    if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
        return "Yesterday"
    }

    // This Week (within 7 days)
    if (diffDays < 7) {
        return "This Week"
    }

    // This Month (within 30 days)
    if (diffDays < 30) {
        return "This Month"
    }

    // Before
    return "Before"
}

/**
 * Group chats by time ranges
 */
function groupChatsByTime(chats: ChatItem[]): GroupedChats[] {
    const groups: Record<string, ChatItem[]> = {
        "Today": [],
        "Yesterday": [],
        "This Week": [],
        "This Month": [],
        "Before": []
    }

    chats.forEach(chat => {
        if (chat.lastChatAt) {
            const label = getTimeRangeLabel(new Date(chat.lastChatAt))
            groups[label].push(chat)
        } else {
            groups["Before"].push(chat)
        }
    })

    // Return only non-empty groups in order
    const orderedLabels = ["Today", "Yesterday", "This Week", "This Month", "Before"]
    return orderedLabels
        .filter(label => groups[label].length > 0)
        .map(label => ({ label, chats: groups[label] }))
}

/**
 * SidebarRecentChats - Recent chats list with time-based grouping
 * 
 * Shows avatars of recent chat sessions when collapsed,
 * and full names when expanded. Groups chats by time periods.
 */
export function SidebarRecentChats({ isExpanded, maxChats = 20, showDemo = false }: SidebarRecentChatsProps) {
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

    // Get recent chats and group them
    const groupedChats = useMemo(() => {
        let chats: ChatItem[] = []

        // If showDemo is true, use demo data
        if (showDemo) {
            chats = DEMO_CHATS.slice(0, maxChats)
        } else {
            // Don't render until mounted to prevent hydration errors
            if (!mounted) return []

            // Sort by most recent
            const sorted = [...recentChatsData].sort((a, b) =>
                new Date(b.lastChatAt).getTime() - new Date(a.lastChatAt).getTime()
            )

            // Map to sidebar format
            chats = sorted.slice(0, maxChats).map(chat => ({
                id: chat.personaId,
                name: chat.personaName,
                imageUrl: chat.personaImage,
                href: `/${chat.workspaceId}/chat?persona=${chat.personaId}`,
                lastChatAt: chat.lastChatAt
            }))
        }

        return groupChatsByTime(chats)
    }, [maxChats, showDemo, mounted, recentChatsData])

    // Don't render if no recent chats (and not in demo mode)
    if (groupedChats.length === 0) {
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

            {/* Chat List - Limited to 4 visible items (~176px), scrollable with hidden scrollbar */}
            <div className="flex flex-col gap-0.5 max-h-[176px] overflow-y-auto scrollbar-hide">
                {groupedChats.map((group) => (
                    <div key={group.label} className="flex flex-col">
                        {/* Time Range Label - only show when expanded */}
                        {isExpanded && (
                            <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-rp-muted">
                                {group.label}
                            </div>
                        )}

                        {/* Chats in this time range */}
                        {group.chats.map((chat) => (
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
                ))}
            </div>
        </div>
    )
}
