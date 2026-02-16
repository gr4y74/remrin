"use client"

import React, { useState } from 'react'
import {
    MessageSquarePlus,
    History,
    Settings,
    Search,
    MessageSquare,
    PanelLeftClose
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSolo } from './ChatSoloEngine'
import { useAuth } from '@/hooks/useAuth'
import { getRecoveredToken } from '@/lib/supabase/token-recovery'
import { Button } from '@/components/ui/button'

interface ChatSoloSidebarProps {
    isOpen: boolean
    toggleSidebar?: () => void
    openSettings?: () => void
}

export const ChatSoloSidebar: React.FC<ChatSoloSidebarProps> = ({ isOpen, toggleSidebar, openSettings }) => {
    const { createNewChat, messages, isLoadingHistory, threads, currentThreadName, setCurrentThreadName } = useChatSolo()
    const { session } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')

    const hasActiveLink = !!session?.access_token || !!getRecoveredToken()

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-card/50 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ease-in-out transform flex flex-col shadow-2xl",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* Header / New Thread */}
            <div className="p-4 flex items-center justify-between gap-2">
                <Button
                    onClick={createNewChat}
                    variant="ghost"
                    className="flex-1 flex items-center justify-start gap-3 px-4 h-11 rounded-xl bg-white/5 border-none hover:bg-white/10 font-semibold text-sm transition-all shadow-sm group"
                >
                    <MessageSquarePlus size={18} className="text-primary group-hover:scale-110 transition-transform" />
                    New Chat
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-11 w-11 rounded-xl hover:bg-muted md:hidden"
                >
                    <PanelLeftClose size={18} className="text-muted-foreground" />
                </Button>
            </div>

            {/* History Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                <div>
                    <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em] leading-none mb-2">
                        Today
                    </div>

                    <div className="space-y-1">
                        {isLoadingHistory ? (
                            <div className="px-3 py-4 text-center">
                                <p className="text-[11px] text-muted-foreground animate-pulse italic">Retrieving archive...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="px-3 py-4 text-center">
                                <p className="text-[11px] text-muted-foreground opacity-50">No threads found in this cockpit.</p>
                            </div>
                        ) : (
                            <button className="w-full px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/10 text-primary font-medium text-xs flex items-center gap-3 text-left transition-all">
                                <MessageSquare size={14} className="flex-shrink-0" />
                                <span className="flex-1 truncate">V3 Precision Sync</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Previous Threads Category */}
                <div>
                    <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground uppercase text-[10px] font-bold tracking-[0.15em] leading-none mb-2">
                        Previous 7 Days
                    </div>
                    <div className="space-y-1">
                        {threads
                            .filter((t: any) =>
                                t.name !== currentThreadName &&
                                (!searchQuery || (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                            )
                            .slice(0, 8)
                            .map((thread: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentThreadName(thread.name)}
                                    className="w-full px-3 py-2 rounded-xl hover:bg-muted text-muted-foreground transition-all text-xs flex items-center gap-3 text-left truncate"
                                >
                                    <History size={14} className="opacity-50" />
                                    <span className="truncate">{thread.name.replace('solo-cockpit-', 'Session ')}</span>
                                </button>
                            ))
                        }
                        {threads.length <= 1 && (
                            <div className="px-3 py-2 text-[11px] text-muted-foreground/40 italic">
                                Empty
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border flex flex-col gap-3 bg-card/80 backdrop-blur-md">
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search sessions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-xl bg-muted/30 border border-border/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/20 text-[11px] font-medium transition-all outline-none placeholder:text-muted-foreground/40"
                    />
                </div>
                <Button
                    variant="ghost"
                    onClick={() => {
                        console.log('⚙️ [Sidebar] Opening settings...')
                        openSettings?.()
                    }}
                    className="justify-start gap-4 h-11 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all text-xs font-bold w-full border border-transparent hover:border-white/5 active:scale-95"
                >
                    <Settings size={18} className="text-muted-foreground/60" />
                    Cockpit Settings
                </Button>

                {/* Neural Link Status */}
                <div className="mt-2 px-3 py-2 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            hasActiveLink ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                        )} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                            Neural Link: {hasActiveLink ? "Active" : "Desynced"}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
