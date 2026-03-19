"use client"

import React, { useState, useMemo } from 'react'
import {
    MessageSquarePlus,
    History,
    Settings,
    Search,
    MessageSquare,
    PanelLeftClose,
    Star,
    MoreVertical,
    Clock,
    Pencil,
    Check,
    X,
    Bookmark // Added Bookmark icon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSolo } from './ChatSoloEngine'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { getRecoveredToken } from '@/lib/supabase/token-recovery'

interface ChatSoloSidebarProps {
    isOpen: boolean
    toggleSidebar?: () => void
    openSettings?: () => void
}

export const ChatSoloSidebar: React.FC<ChatSoloSidebarProps> = ({ isOpen, toggleSidebar, openSettings }) => {
    const {
        createNewChat,
        messages,
        isLoadingHistory,
        threads,
        currentThreadName,
        setCurrentThreadName,
        switchThread,
        toggleStar,
        renameChat,
        bookmarks // Destructured bookmarks from useChatSolo
    } = useChatSolo()
    const { session } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    const hasActiveLink = !!session?.access_token || !!getRecoveredToken()

    const filteredThreads = useMemo(() => {
        return threads.filter((t: any) =>
            !searchQuery ||
            (t.title || t.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [threads, searchQuery])

    const starredThreads = useMemo(() => filteredThreads.filter((t: any) => t.is_starred), [filteredThreads])
    const recentThreads = useMemo(() => filteredThreads.filter((t: any) => !t.is_starred), [filteredThreads])

    const renderThreadItem = (thread: any, isActive: boolean) => {
        const isEditing = editingId === thread.id
        const displayName = thread.title || thread.name.replace('solo-cockpit-', 'Session ').replace('persona-chat-', 'Chat ')

        const handleSave = (e: React.MouseEvent | React.KeyboardEvent) => {
            e.stopPropagation()
            if (editValue.trim() && editValue !== (thread.title || '')) {
                renameChat(thread.id, editValue.trim())
            }
            setEditingId(null)
        }

        const handleCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
            e.stopPropagation()
            setEditingId(null)
        }

        const startEditing = (e: React.MouseEvent) => {
            e.stopPropagation()
            setEditingId(thread.id)
            setEditValue(thread.title || '')
        }

        return (
            <div
                key={thread.id}
                className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer select-none",
                    isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    isEditing && "bg-muted/30 ring-1 ring-white/10"
                )}
                onClick={() => {
                    if (!isEditing) {
                        console.log(`Navigation: Switching to thread ${thread.name}`)
                        switchThread(thread.name)
                    }
                }}
            >
                <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
                    {isEditing ? (
                        <Pencil size={12} className="text-primary animate-pulse" />
                    ) : (
                        <MessageSquare size={14} className={cn("transition-transform group-hover:scale-110", isActive ? "text-primary" : "opacity-40")} />
                    )}
                </div>

                {isEditing ? (
                    <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(e)
                            if (e.key === 'Escape') handleCancel(e)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-[12.5px] font-medium text-foreground p-0 focus:ring-0"
                        placeholder="Enter chat name..."
                        aria-label="Rename chat"
                    />
                ) : (
                    <span className="flex-1 truncate text-[12.5px] font-medium tracking-tight">
                        {displayName}
                    </span>
                )}

                {/* Message count badge */}
                {!isEditing && thread.message_count && thread.message_count > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/60 border border-white/5">
                        {thread.message_count}
                    </span>
                )}

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="p-1.5 rounded-lg hover:bg-primary/20 text-primary transition-colors"
                                title="Save"
                                aria-label="Save name"
                            >
                                <Check size={12} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors"
                                title="Cancel"
                                aria-label="Cancel renaming"
                            >
                                <X size={12} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={startEditing}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Rename chat"
                            >
                                <Pencil size={12} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleStar(thread.id, !thread.is_starred)
                                }}
                                aria-label={thread.is_starred ? "Unstar chat" : "Star chat"}
                                className={cn(
                                    "p-1.5 rounded-lg hover:bg-muted transition-colors",
                                    thread.is_starred ? "text-yellow-500 opacity-100" : "text-muted-foreground"
                                )}
                            >
                                <Star size={12} fill={thread.is_starred ? "currentColor" : "none"} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 bg-[#0d1117]/80 backdrop-blur-2xl border-r border-white/5 transition-transform duration-300 ease-in-out transform flex flex-col shadow-2xl",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* Header / New Thread */}
            <div className="p-5 flex items-center justify-between gap-3">
                <Button
                    onClick={createNewChat}
                    variant="ghost"
                    className="flex-1 flex items-center justify-start gap-3 px-4 h-12 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 font-bold text-sm transition-all shadow-inner group font-tiempos"
                >
                    <MessageSquarePlus size={20} className="text-primary group-hover:rotate-12 transition-transform" />
                    New Chat
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-10 w-10 rounded-xl hover:bg-white/5 md:hidden"
                >
                    <PanelLeftClose size={18} className="text-muted-foreground" />
                </Button>
            </div>

            {/* History Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-8 py-2">

                {/* Starred Section */}
                {starredThreads.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 font-outfit">
                            <Star size={10} className="text-yellow-500/50" />
                            Starred
                        </div>
                        <div className="space-y-0.5">
                            {starredThreads.map(t => renderThreadItem(t, t.name === currentThreadName))}
                        </div>
                    </div>
                )}

                {/* Bookmarks Section */}
                {bookmarks.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 font-outfit">
                            <Bookmark size={10} />
                            Bookmarks
                        </div>
                        <div className="space-y-0.5">
                            {bookmarks.map(bookmark => (
                                <button
                                    key={bookmark.id}
                                    onClick={() => {
                                        // Switch chat
                                        const thread = threads.find(t => t.id === bookmark.chat_id)
                                        if (thread) {
                                            switchThread(thread.name)
                                        }
                                    }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-all group flex flex-col gap-1 border border-transparent hover:border-white/5"
                                >
                                    <span className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2">
                                        {bookmark.content_preview}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-medium">
                                        {new Date(bookmark.created_at).toLocaleDateString()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recents Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 font-outfit">
                        <Clock size={10} />
                        Recent Sessions
                    </div>

                    <div className="space-y-0.5">
                        {isLoadingHistory && threads.length === 0 ? (
                            <div className="px-3 py-4 text-center">
                                <p className="text-[11px] text-muted-foreground/40 animate-pulse italic">Connecting to archive...</p>
                            </div>
                        ) : recentThreads.length === 0 && starredThreads.length === 0 ? (
                            <div className="px-3 py-6 text-center">
                                <p className="text-[11px] text-muted-foreground/30 font-medium">No active sessions found.</p>
                            </div>
                        ) : (
                            recentThreads.map(t => renderThreadItem(t, t.name === currentThreadName))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-[#0d1117]/95 border-t border-white/5 space-y-4">
                <div className="relative group">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/30 focus:bg-white/[0.04] text-[12px] transition-all outline-none placeholder:text-muted-foreground/30 font-medium"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        onClick={() => openSettings?.()}
                        className="justify-start gap-3 h-11 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all text-[12px] font-bold w-full group font-outfit"
                    >
                        <Settings size={18} className="text-muted-foreground/40 group-hover:rotate-45 transition-transform" />
                        Settings
                    </Button>
                </div>

                {/* Connection Status */}
                <div className="px-3 py-1 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]",
                            hasActiveLink ? "bg-emerald-500 text-emerald-500" : "bg-rose-500 text-rose-500"
                        )} />
                        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground font-outfit">
                            {hasActiveLink ? "Sync Active" : "Link Severed"}
                        </span>
                    </div>
                    {session?.user?.email && (
                        <span className="text-[8px] font-medium text-muted-foreground/40 max-w-[80px] truncate">
                            {session.user.email}
                        </span>
                    )}
                </div>
            </div>
        </aside>
    )
}
