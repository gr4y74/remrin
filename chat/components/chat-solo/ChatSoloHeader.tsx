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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
        <header className="flex h-16 items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50 transition-all">
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
                        <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">{personaName}</h1>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Sparkles size={8} className="text-primary opacity-60" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">
                                {isGenerating ? "Thinking..." : "Cockpit Direct"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 gap-2 rounded-xl bg-muted/30 border-border hover:bg-muted font-bold text-[10px] uppercase tracking-wider group">
                            <Cpu size={14} className="text-primary group-hover:rotate-12 transition-transform" />
                            <span>
                                {llmProvider === 'claude' ? 'Claude 3.5' :
                                    llmProvider === 'gemini' ? 'Gemini 1.5' :
                                        llmProvider === 'openrouter' ? 'Free (OpenRouter)' :
                                            llmProvider === 'gpt' ? 'GPT-4o' : 'DeepSeek V3'}
                            </span>
                            <ChevronDown size={12} className="text-muted-foreground opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border shadow-2xl p-1.5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                        <DropdownMenuItem
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold",
                                (!llmProvider || llmProvider === 'deepseek') ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            )}
                            onClick={() => setLLMConfig('deepseek', 'deepseek-chat')}
                        >
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <div className="flex flex-col">
                                <span>DeepSeek V3</span>
                                <span className="text-[10px] opacity-60 font-medium">Precision Efficiency</span>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold mt-1",
                                llmProvider === 'claude' ? "bg-blue-500/10 text-blue-500" : "hover:bg-muted"
                            )}
                            onClick={() => setLLMConfig('claude', 'claude-3-5-sonnet-20241022')}
                        >
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <div className="flex flex-col">
                                <span>Claude 3.5 Sonnet</span>
                                <span className="text-[10px] opacity-60 font-medium">Artifacts Protocol</span>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold mt-1",
                                llmProvider === 'openrouter' ? "bg-amber-500/10 text-amber-500" : "hover:bg-muted"
                            )}
                            onClick={() => setLLMConfig('openrouter', 'openrouter/auto')}
                        >
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <div className="flex flex-col">
                                <span>Free Models</span>
                                <span className="text-[10px] opacity-60 font-medium">OpenRouter Provider</span>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold mt-1",
                                llmProvider === 'gemini' ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-muted"
                            )}
                            onClick={() => setLLMConfig('gemini', 'gemini-1.5-pro')}
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div className="flex flex-col">
                                <span>Gemini 1.5 Pro</span>
                                <span className="text-[10px] opacity-60 font-medium">Long Context Brain</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

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

                <div className="h-4 w-px bg-border/50 mx-1" />

                <UserMenu openSettings={openSettings} />
            </div>
        </header>
    )
}
