"use client"

import { FC, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Bell,
    Users,
    Link as LinkIcon,
    Heart,
    MessageSquare,
    X,
    CheckCircle2,
    Info,
    AlertTriangle,
    Loader2,
    UserPlus
} from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { supabase } from "@/lib/supabase/browser-client"

interface NotificationsSidebarProps {
    userId: string
    isOpen: boolean
    onClose: () => void
}

export const NotificationsSidebar: FC<NotificationsSidebarProps> = ({
    userId,
    isOpen,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState("interactions")
    const [activeSubTab, setActiveSubTab] = useState("subscribers")

    // Hooks for different notification types
    const subscribers = useNotifications(userId, "subscribers")
    const connectors = useNotifications(userId, "connectors")
    const likes = useNotifications(userId, "likes")
    const comments = useNotifications(userId, "comments")
    const system = useNotifications(userId, "system")

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from("system_notifications")
            .update({ is_read: true })
            .eq("id", notificationId)
        system.refetch()
    }

    const markAllAsRead = async () => {
        await supabase
            .from("system_notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false)
        system.refetch()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="bg-rp-surface border-rp-muted/20 fixed right-0 top-0 z-[60] flex h-full w-full flex-col border-l shadow-2xl md:w-[400px]"
                    >
                        {/* Header */}
                        <div className="border-rp-muted/10 flex items-center justify-between border-b p-4">
                            <div className="flex items-center gap-2">
                                <Bell className="text-rp-iris size-5" />
                                <h2 className="font-tiempos-text text-xl font-bold text-white">Notifications</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="hover:bg-rp-overlay rounded-full p-2 text-gray-400 transition-colors hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Main Tabs */}
                        <Tabs defaultValue="interactions" className="flex flex-1 flex-col overflow-hidden" onValueChange={setActiveTab}>
                            <div className="px-4 pt-2">
                                <TabsList className="bg-rp-overlay w-full">
                                    <TabsTrigger value="interactions" className="flex-1">Interactions</TabsTrigger>
                                    <TabsTrigger value="system" className="flex-1">System</TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Interactions Content */}
                            <TabsContent value="interactions" className="mt-0 flex flex-1 flex-col overflow-hidden">
                                <div className="border-rp-muted/10 border-b px-4 py-2">
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        <SubTabButton
                                            active={activeSubTab === "subscribers"}
                                            onClick={() => setActiveSubTab("subscribers")}
                                            icon={<Users size={14} />}
                                            label="Subscribers"
                                        />
                                        <SubTabButton
                                            active={activeSubTab === "connectors"}
                                            onClick={() => setActiveSubTab("connectors")}
                                            icon={<LinkIcon size={14} />}
                                            label="Connectors"
                                        />
                                        <SubTabButton
                                            active={activeSubTab === "likes"}
                                            onClick={() => setActiveSubTab("likes")}
                                            icon={<Heart size={14} />}
                                            label="Likes"
                                        />
                                        <SubTabButton
                                            active={activeSubTab === "comments"}
                                            onClick={() => setActiveSubTab("comments")}
                                            icon={<MessageSquare size={14} />}
                                            label="Comments"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {renderInteractionList(activeSubTab, { subscribers, connectors, likes, comments })}
                                </div>
                            </TabsContent>

                            {/* System Content */}
                            <TabsContent value="system" className="mt-0 flex flex-1 flex-col overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2">
                                    <span className="text-rp-subtle text-xs uppercase tracking-wider font-semibold">System Updates</span>
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-rp-iris hover:underline text-xs"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {system.loading ? (
                                        <LoadingState />
                                    ) : system.notifications.length === 0 ? (
                                        <EmptyState
                                            icon={<CheckCircle2 size={48} className="text-gray-600" />}
                                            title="All clear!"
                                            message="You don't have any system notifications yet."
                                        />
                                    ) : (
                                        system.notifications.map((n) => (
                                            <SystemNotificationItem
                                                key={n.id}
                                                notification={n}
                                                onRead={() => markAsRead(n.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Helper Components

const SubTabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
            active
                ? "bg-rp-iris text-white shadow-lg shadow-rp-iris/20"
                : "bg-rp-overlay text-rp-subtle hover:text-white"
        )}
    >
        {icon}
        {label}
    </button>
)

const LoadingState = () => (
    <div className="flex h-40 flex-col items-center justify-center gap-3">
        <Loader2 className="text-rp-iris animate-spin" size={32} />
        <span className="text-rp-subtle text-sm">Loading notifications...</span>
    </div>
)

const EmptyState = ({ icon, title, message }: any) => (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center px-6">
        <div className="bg-rp-overlay rounded-full p-6">{icon}</div>
        <div>
            <h3 className="text-white font-bold">{title}</h3>
            <p className="text-rp-subtle text-sm mt-1">{message}</p>
        </div>
    </div>
)

const renderInteractionList = (type: string, data: any) => {
    const current = data[type]

    if (current.loading) return <LoadingState />
    if (current.notifications.length === 0) {
        return (
            <EmptyState
                icon={<Users size={48} className="text-gray-600" />}
                title="No activity yet"
                message={`When people ${type === 'subscribers' ? 'subscribe to' : type === 'likes' ? 'like' : type === 'comments' ? 'comment on' : 'connect with'} you, they'll show up here.`}
            />
        )
    }

    return current.notifications.map((n: any) => (
        <InteractionItem key={n.id} type={type} data={n} />
    ))
}

const InteractionItem = ({ type, data }: any) => {
    const user = type === 'subscribers' ? data.subscriber :
        type === 'connectors' ? data.connector :
            type === 'likes' ? data.liker :
                type === 'comments' ? data.commenter : null

    return (
        <div className="bg-rp-overlay/50 border-rp-muted/10 flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-rp-overlay">
            <div className="relative shrink-0">
                <Image
                    src={user?.avatar_url || "/images/default_avatar.png"}
                    alt={user?.username || "User"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-rp-muted/20"
                />
                <div className="bg-rp-iris absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-rp-surface">
                    {getIconForType(type)}
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white truncate">
                        {user?.display_name || user?.username || "Someone"}
                    </span>
                    <span className="text-rp-subtle text-[10px]">
                        {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-rp-subtle text-xs truncate">
                    {getMessageForType(type, data)}
                </p>
            </div>
        </div>
    )
}

const SystemNotificationItem = ({ notification, onRead }: any) => {
    const Icon = notification.type === 'error' ? AlertTriangle :
        notification.type === 'warning' ? AlertTriangle :
            notification.type === 'success' ? CheckCircle2 : Info

    const colorClass = notification.type === 'error' ? 'text-red-400' :
        notification.type === 'warning' ? 'text-yellow-400' :
            notification.type === 'success' ? 'text-green-400' : 'text-rp-iris'

    return (
        <div
            className={cn(
                "flex gap-3 p-4 rounded-xl border transition-all cursor-pointer relative group",
                notification.is_read
                    ? "bg-rp-overlay/30 border-rp-muted/5 opacity-70"
                    : "bg-rp-overlay border-rp-iris/20 shadow-lg shadow-rp-iris/5"
            )}
            onClick={() => !notification.is_read && onRead()}
        >
            {!notification.is_read && (
                <div className="bg-rp-iris absolute left-0 top-1/2 -ml-0.5 h-8 w-1 -translate-y-1/2 rounded-r shadow-[0_0_8px_rgba(156,138,255,0.5)]" />
            )}

            <div className={cn("p-2 rounded-lg bg-black/20 shrink-0 h-fit", colorClass)}>
                <Icon size={18} />
            </div>

            <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                    <h4 className={cn("text-sm font-bold", notification.is_read ? "text-rp-text/80" : "text-white")}>
                        {notification.title}
                    </h4>
                    <span className="text-[10px] text-rp-subtle shrink-0">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-rp-subtle text-xs mt-1 leading-relaxed">
                    {notification.message}
                </p>
            </div>
        </div>
    )
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'subscribers': return <Users size={10} className="text-white" />
        case 'connectors': return <UserPlus size={10} className="text-white" />
        case 'likes': return <Heart size={10} className="fill-white text-white" />
        case 'comments': return <MessageSquare size={10} className="text-white" />
        default: return null
    }
}

const getMessageForType = (type: string, data: any) => {
    switch (type) {
        case 'subscribers': return "subscribed to your profile"
        case 'connectors': return "sent you a connection request"
        case 'likes': return `liked your ${data.content_type || 'content'}`
        case 'comments': return `commented: "${data.comment_text}"`
        default: return "interacted with you"
    }
}
