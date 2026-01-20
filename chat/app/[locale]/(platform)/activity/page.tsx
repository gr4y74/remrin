"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { IconBell, IconCheck, IconTrash } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function ActivityPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMarkingAll, setIsMarkingAll] = useState(false)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const LIMIT = 20

    const fetchNotifications = async (newOffset = 0) => {
        try {
            const response = await fetch(`/api/notifications?limit=${LIMIT}&offset=${newOffset}`)
            const data = await response.json()
            if (data.notifications) {
                if (newOffset === 0) {
                    setNotifications(data.notifications)
                } else {
                    setNotifications(prev => [...prev, ...data.notifications])
                }
                setHasMore(data.notifications.length === LIMIT)
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

    const handleLoadMore = () => {
        const nextOffset = offset + LIMIT
        setOffset(nextOffset)
        fetchNotifications(nextOffset)
    }

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_read: true })
            })
            if (response.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, is_read: true } : n
                ))
            }
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const handleMarkAllRead = async () => {
        setIsMarkingAll(true)
        try {
            const response = await fetch("/api/notifications/read-all", {
                method: "PUT"
            })
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            }
        } catch (error) {
            console.error("Error marking all read:", error)
        } finally {
            setIsMarkingAll(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-rp-text">Activity</h1>
                    <p className="text-rp-muted text-sm mt-1">Stay updated with your latest interactions</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-rp-text hover:bg-rp-overlay"
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAll || notifications.every(n => n.is_read)}
                    >
                        <IconCheck size={18} className="mr-2" />
                        Mark all as read
                    </Button>
                </div>
            </div>

            <div className="bg-rp-surface rounded-2xl border border-rp-highlight-med shadow-sm overflow-hidden">
                {isLoading && notifications.length === 0 ? (
                    <div className="divide-y divide-rp-highlight-low">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 flex gap-4">
                                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-rp-overlay rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconBell size={32} className="text-rp-muted/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-rp-text">No notifications yet</h3>
                        <p className="text-rp-muted max-w-xs mx-auto mt-2">
                            When someone interacts with you or your Souls, you&apos;ll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-rp-highlight-low">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 sm:p-6 hover:bg-rp-overlay/50 transition-colors flex gap-4 relative group",
                                    !notification.is_read && "bg-rp-iris/5"
                                )}
                            >
                                <div className="shrink-0">
                                    {notification.actor?.avatar_url ? (
                                        <Image
                                            src={notification.actor.avatar_url}
                                            alt={notification.actor.username}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover w-12 h-12"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-rp-highlight-med flex items-center justify-center">
                                            <IconBell size={20} className="text-rp-muted" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-rp-text">
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-rp-muted">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-rp-subtle mt-1 leading-relaxed">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center gap-4 mt-3">
                                        {notification.action_url && (
                                            <Button asChild variant="secondary" size="sm">
                                                <Link href={notification.action_url}>
                                                    View Details
                                                </Link>
                                            </Button>
                                        )}
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-8 text-rp-iris hover:text-rp-iris active:bg-rp-iris/10"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                Mark as read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {hasMore && notifications.length > 0 && (
                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="px-8 border-rp-highlight-med text-rp-text hover:bg-rp-overlay"
                    >
                        {isLoading ? "Loading..." : "Load more activity"}
                    </Button>
                </div>
            )}
        </div>
    )
}
