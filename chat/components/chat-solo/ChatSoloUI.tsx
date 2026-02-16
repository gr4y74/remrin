"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { ChatSoloEngineProvider, useChatSolo } from './ChatSoloEngine'
import { useAuth } from '@/hooks/useAuth'
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile'
import { ChatSoloHeader } from './ChatSoloHeader'
import { ChatSoloSidebar } from './ChatSoloSidebar'
import { ChatSoloMessage } from './ChatSoloMessage'
import { ChatSoloInput } from './ChatSoloInput'
import { ArtifactsPanel } from './ArtifactsPanel'
import { SettingsModal } from './SettingsModal'
import { cn } from '@/lib/utils'
import { UserTier } from '@/lib/chat-engine/types'
import { LottieLoader } from "@/components/ui/lottie-loader"

interface ChatSoloUIProps {
    personaId: string
    personaName?: string
    personaIntroMessage?: string
    userTier?: UserTier
}

const ChatSoloUIInner: React.FC<{ personaName?: string }> = ({ personaName }) => {
    const { messages, isLoadingHistory, isGenerating, error, activeArtifact } = useChatSolo()
    const { user } = useAuth()
    const { profile } = useUnifiedProfile(user?.id)
    const { setTheme, resolvedTheme } = useTheme()

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isArtifactsOpen, setIsArtifactsOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isGenerating])

    // Sync theme with profile preference
    useEffect(() => {
        if (profile?.cockpit_theme) {
            setTheme(profile.cockpit_theme)
        }
    }, [profile?.cockpit_theme, setTheme])

    return (
        <div className={cn(
            "flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-300",
            resolvedTheme === 'light' ? 'light' : 'dark'
        )}>
            {/* Sidebar Overlay for mobile */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />
            )}

            <ChatSoloSidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                openSettings={() => setIsSettingsOpen(true)}
            />

            <main className={cn(
                "flex-1 flex flex-col h-full transition-all duration-300 ease-in-out relative",
                isSidebarOpen ? "md:ml-64" : "ml-0",
                isArtifactsOpen ? "md:mr-[600px]" : "mr-0"
            )}>
                <ChatSoloHeader
                    personaName={personaName}
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isArtifactsOpen={isArtifactsOpen}
                    toggleArtifacts={() => setIsArtifactsOpen(!isArtifactsOpen)}
                    openSettings={() => setIsSettingsOpen(true)}
                />

                {/* Message Canvas */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <div className="max-w-3xl mx-auto w-full px-6">
                        {isLoadingHistory ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                                <LottieLoader size={48} className="text-primary opacity-50" />
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Syncing Archive...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center py-20">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                                    <span className="text-primary font-bold text-2xl">R</span>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Rem Solo Cockpit</h2>
                                <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                                    Professional standalone engine with persistent memory and high-precision extraction.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {messages.map((msg, i) => (
                                    <ChatSoloMessage
                                        key={i}
                                        message={msg}
                                        isStreaming={isGenerating && i === messages.length - 1}
                                        statusLabel={isGenerating && i === messages.length - 1 ? "Processing Neural Links..." : "Cockpit Console Active"}
                                    />
                                ))}
                                <div ref={messagesEndRef} className="h-32 shrink-0" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center text-xs font-medium animate-in slide-in-from-bottom-2">
                        {error}
                    </div>
                )}

                {/* Input Area */}
                <div className="sticky bottom-0 bg-background pt-4 pb-6 border-t border-border/50">
                    <div className="absolute top-0 left-0 right-0 h-20 -translate-y-full bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    <ChatSoloInput />
                </div>
            </main>

            <ArtifactsPanel
                isOpen={isArtifactsOpen}
                onClose={() => setIsArtifactsOpen(false)}
                content={activeArtifact}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    )
}

export const ChatSoloUI: React.FC<ChatSoloUIProps> = (props) => {
    return (
        <ChatSoloEngineProvider
            personaId={props.personaId}
            personaIntroMessage={props.personaIntroMessage}
            userTier={props.userTier}
        >
            <ChatSoloUIInner personaName={props.personaName} />
        </ChatSoloEngineProvider>
    )
}
