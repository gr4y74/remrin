"use client"

import { useContext, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"
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
 * SidebarRecentChats - Talkie-AI inspired recent chats list
 * 
 * Shows avatars of recent chat sessions when collapsed,
 * and full names when expanded.
 */
export function SidebarRecentChats({ isExpanded, maxChats = 8, showDemo = false }: SidebarRecentChatsProps) {
    const { chats, personas } = useContext(RemrinContext)

    // Get recent chats sorted by updated_at, with persona info
    const recentChats = useMemo(() => {
        // If showDemo is true, return demo data
        if (showDemo) {
            return DEMO_CHATS.slice(0, maxChats)
        }

        if (!chats || chats.length === 0) return []

        // Sort by updated_at (most recent first)
        const sorted = [...chats].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime()
            const dateB = new Date(b.updated_at || b.created_at).getTime()
            return dateB - dateA
        })

        // Map to include persona info for avatars
        return sorted.slice(0, maxChats).map(chat => {
            // Try to find persona by matching chat name or assistant_id
            const persona = personas?.find(p =>
                p.name === chat.name || p.id === chat.assistant_id
            )
            return {
                id: chat.id,
                name: chat.name,
                imageUrl: persona?.image_url || null,
                href: `/chat/${chat.id}`
            }
        })
    }, [chats, personas, maxChats, showDemo])

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
                            "shrink-0 overflow-hidden rounded-lg transition-transform",
                            "group-hover:scale-105",
                            isExpanded ? "size-8" : "size-9"
                        )}>
                            {chat.imageUrl ? (
                                <Image
                                    src={chat.imageUrl}
                                    alt={chat.name}
                                    className="object-cover"
                                    fill
                                    sizes="36px"
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
