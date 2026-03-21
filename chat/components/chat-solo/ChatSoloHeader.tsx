"use client"

import React from 'react'
import {
    Cpu,
    ChevronDown,
    PanelLeft,
    PanelRight,
    Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSolo } from './ChatSoloEngine'
import { ModelSelector } from '../rem/ModelSelector'
import { Button } from '@/components/ui/button'
import { UserMenu } from './UserMenu'

interface ChatSoloHeaderProps {
    personaName?: string
    isSidebarOpen: boolean
    toggleSidebar: () => void
    isArtifactsOpen?: boolean
    toggleArtifacts?: () => void
    openSettings?: () => void
}

export const ChatSoloHeader: React.FC<ChatSoloHeaderProps> = ({
    personaName = "Rem",
    isSidebarOpen,
    toggleSidebar,
    isArtifactsOpen,
    toggleArtifacts,
    openSettings
}) => {
    const { llmProvider, setLLMConfig, isGenerating } = useChatSolo()

    return (
        <header className="flex h-16 items-center justify-between px-4 border-b border-transparent bg-background/95 backdrop-blur-md sticky top-0 z-50 transition-all">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="h-9 w-9 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl"
                    title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <PanelLeft size={20} className={cn("transition-transform duration-300", !isSidebarOpen && "rotate-180")} />
                </Button>

                <div className="flex items-center gap-3">
                    <div className="relative group/avatar cursor-help">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shadow-inner">
                            <span className="text-primary font-bold text-xs">R</span>
                        </div>
                        {isGenerating && (
                            <div className="absolute -inset-0.5 bg-primary/20 rounded-full animate-ping opacity-40" />
                        )}
                        <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-background rounded-full shadow-sm transition-colors duration-500",
                            isGenerating ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
                        )} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-bold text-foreground tracking-tight leading-none font-tiempos-headline">{personaName}</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Sparkles size={8} className="text-primary opacity-60" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em] font-outfit">
                                {isGenerating ? "Thinking..." : "Cockpit Direct"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ModelSelector />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleArtifacts}
                    className={cn(
                        "h-9 w-9 rounded-xl transition-all",
                        isArtifactsOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                    )}
                    title="Toggle Artifacts"
                >
                    <PanelRight size={20} />
                </Button>

                <div className="h-4 w-px bg-white/5 mx-1" />

                <UserMenu openSettings={openSettings} />
            </div>
        </header>
    )
}
