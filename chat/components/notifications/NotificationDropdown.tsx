"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { IconBell, IconCircleFilled } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface Notification {
    id: string
    actor_id: string
    notification_type: string
    title: string
    message: string
    action_url: string
    is_read: boolean
    created_at: string
    actor?: {
        username: string
        display_name: string
        avatar_url: string
    }
}

interface NotificationDropdownProps {
    onMarkAsRead?: () => void
}

export function NotificationDropdown({ onMarkAsRead }: NotificationDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications?limit=10")
            const data = await response.json()
            if (data.notifications) {
                setNotifications(data.notifications)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_read: true })
            })
            if (response.ok) {
                setNotifications(notifications.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ))
                if (onMarkAsRead) onMarkAsRead()
            }
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    return (
        <div className="w-80 sm:w-96 bg-rp-surface border border-rp-highlight-med rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-4 border-b border-rp-highlight-med flex items-center justify-between">
                <h3 className="text-sm font-bold text-rp-text uppercase tracking-wider">Notifications</h3>
                <Link
                    href="/activity"
                    className="text-xs text-rp-iris hover:underline font-medium"
                >
                    See all
                </Link>
            </div>

            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rp-iris border-t-transparent" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-rp-muted">
                        <IconBell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-rp-highlight-low">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-3 hover:bg-rp-overlay transition-colors flex gap-3 relative group",
                                    !notification.is_read && "bg-rp-iris/5"
                                )}
                            >
                                <div className="shrink-0 pt-1">
                                    {notification.actor?.avatar_url ? (
                                        <Image
                                            src={notification.actor.avatar_url}
                                            alt={notification.actor.username}
                                            width={32}
                                            height={32}
                                            className="rounded-full object-cover w-8 h-8"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-rp-highlight-med flex items-center justify-center">
                                            <IconBell size={14} className="text-rp-muted" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <p className="text-xs font-semibold text-rp-text truncate">
                                            {notification.title}
                                        </p>
                                        <span className="text-[10px] text-rp-muted whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-rp-subtle line-clamp-2 mt-0.5 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    {notification.action_url && (
                                        <Link
                                            href={notification.action_url}
                                            className="text-xs text-rp-iris hover:underline mt-1 inline-block"
                                        >
                                            View
                                        </Link>
                                    )}
                                </div>
                                {!notification.is_read && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="absolute right-2 top-11 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Mark as read"
                                    >
                                        <IconCircleFilled size={8} className="text-rp-iris" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-2 border-t border-rp-highlight-med bg-rp-overlay/20">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-rp-muted hover:text-rp-text"
                    onClick={() => {
                        // Mark all as read logic could go here
                        window.location.href = "/activity"
                    }}
                >
                    View All Activity
                </Button>
            </div>
        </div>
    )
}
