/**
 * Chat UI v2 - Main Component
 * 
 * Complete chat interface using the new modular engine
 */

"use client"

import React, { useState } from 'react'
import { ChatEngineProvider, useChatEngine, useMood } from './ChatEngine'
import { IconBook, IconMessage } from '@tabler/icons-react'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { SoulGallery } from './SoulGallery'
import { MoodHUD } from './MoodHUD'
import { MemorySearchModal } from './MemorySearchModal'
import { UserTier } from '@/lib/chat-engine/types'
import Image from 'next/image'

interface ChatUIV2Props {
    userId?: string
    personaId?: string
    personaImage?: string
    personaName?: string
    personaSystemPrompt?: string
    userTier?: UserTier
    showSoulGallery?: boolean
}

import { ChatHeader } from './ChatHeader'

/**
 * Inner component that uses the chat engine context
 */
function ChatUIInner({
    userId,
    personaImage,
    personaName,
    showSoulGallery = false,
    onSoulSelect,
    onMemorySearchTrigger,
    isVisualNovelMode,
    toggleVisualNovelMode
}: {
    userId?: string
    personaImage?: string
    personaName?: string
    showSoulGallery?: boolean
    onSoulSelect?: (personaId: string, personaData: any) => void
    onMemorySearchTrigger?: (query: string) => void
    isVisualNovelMode: boolean
    toggleVisualNovelMode: () => void
}) {
    const { messages, personaId } = useChatEngine()
    const moodState = useMood()

    // Determine if we should show desaturation (low battery)
    const isLowBattery = moodState.battery < 30

    // Visual Novel Layout
    if (isVisualNovelMode && personaId) {
        return (
            <div className={`relative h-full w-full overflow-hidden bg-black ${isLowBattery ? 'low-battery-mode' : ''}`}>
                {/* Visual Novel Background/Sprite Area */}
                <div className="absolute inset-0 z-0 flex items-end justify-center pb-0">
                    {/* Background effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                    {/* Character Sprite - Scaled and Centered */}
                    {personaImage && (
                        <div className="relative h-[85%] w-auto aspect-[1/2] animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <Image
                                src={personaImage}
                                alt={personaName || "Character"}
                                fill
                                className="object-contain object-bottom drop-shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                                priority
                            />
                        </div>
                    )}
                </div>

                {/* VN Mode Header Controls (Minimal) */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button
                        onClick={toggleVisualNovelMode}
                        className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        title="Switch to Chat Mode"
                    >
                        <IconMessage size={20} />
                    </button>
                </div>

                {/* Text Box Overlay */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 pb-Safe w-full max-w-5xl mx-auto">
                    <div className="relative rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        {/* Character Name Tag */}
                        <div className="absolute -top-4 left-6 px-4 py-1 bg-rp-iris text-black font-bold rounded-full text-sm shadow-lg border border-white/20">
                            {personaName}
                        </div>

                        {/* Messages Area (Scrollable within the box) */}
                        <div className="max-h-[30vh] overflow-y-auto pr-2 mb-4 scrollbar-hide space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-white/50 italic text-center py-4">
                                    Start the conversation...
                                </div>
                            ) : (
                                <ChatMessages
                                    personaImage={personaImage}
                                    personaName={personaName}
                                    isVisualNovel
                                />
                            )}
                        </div>

                        {/* Input Area (Integrated) */}
                        <div className="relative">
                            <ChatInput
                                placeholder="What do you say?"
                                onMemorySearch={onMemorySearchTrigger}
                                minimal
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Classic Layout
    return (
        <div
            className={`flex h-full flex-col relative ${isLowBattery ? 'low-battery-mode' : ''}`}
        >
            {/* Header */}
            {personaId && (
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={toggleVisualNovelMode}
                        className="p-2 rounded-full bg-rp-surface/50 backdrop-blur-md border border-rp-highlight-med/20 text-rp-muted hover:text-rp-text hover:bg-rp-surface/80 transition-all"
                        title="Switch to Visual Novel Mode"
                    >
                        <IconBook size={20} />
                    </button>
                </div>
            )}

            {personaId && (
                <ChatHeader
                    personaName={personaName}
                    personaImage={personaImage}
                />
            )}

            {/* Mood HUD */}
            <MoodHUD moodState={moodState} visible={messages.length > 0} />

            {/* Messages or Empty State */}
            {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
                    {showSoulGallery && userId ? (
                        // Show Soul Gallery for persona selection
                        <SoulGallery
                            userId={userId}
                            onSoulSelect={onSoulSelect}
                            selectedSoulId={personaId}
                        />
                    ) : (
                        // Show default welcome screen
                        <div className="flex max-w-sm flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                            {/* Logo */}
                            <div className="mb-8">
                                <Image
                                    src="/logo.svg"
                                    alt="Remrin"
                                    width={120}
                                    height={120}
                                    className="drop-shadow-[0_0_25px_rgba(235,188,186,0.3)] transition-transform duration-500 hover:rotate-[-5deg] hover:scale-110"
                                    priority
                                />
                            </div>

                            {/* Welcome text */}
                            <h1 className="mb-3 text-3xl font-bold bg-gradient-to-br from-rp-text to-rp-muted bg-clip-text text-transparent">
                                {personaName ? `Chat with ${personaName}` : 'Welcome to Remrin'}
                            </h1>
                            <p className="text-rp-subtle leading-relaxed">
                                Experience the new Soul Engine. <br />
                                Start a conversation to begin.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <ChatMessages
                    personaImage={personaImage}
                    personaName={personaName}
                />
            )}

            {/* Input area */}
            <div className="border-t border-rp-overlay/50 bg-rp-base/80 px-4 py-4 backdrop-blur-sm">
                <div className="mx-auto max-w-3xl">
                    <ChatInput
                        placeholder={personaName ? `Message ${personaName}...` : 'Message Remrin...'}
                        onMemorySearch={onMemorySearchTrigger}
                    />
                </div>
            </div>
        </div>
    )
}

/**
 * CSS for reactive mood effects
 */
const MoodStyles = () => (
    <style jsx global>{`
        .low-battery-mode {
            filter: saturate(0.7) brightness(0.95);
            transition: filter 0.5s ease;
        }
        
        .low-battery-mode .chat-input-area {
            border-color: rgba(235, 111, 146, 0.3) !important;
        }

        .mood-pulse-excited {
            animation: excited-pulse 1.5s ease-in-out infinite;
        }

        @keyframes excited-pulse {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(235, 111, 146, 0.4);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 0 15px 3px rgba(235, 111, 146, 0.3);
                transform: scale(1.02);
            }
        }
    `}</style>
)

/**
 * Main ChatUI v2 component with provider wrapper
 */
export function ChatUIV2({
    userId,
    personaId: initialPersonaId,
    personaImage: initialPersonaImage,
    personaName: initialPersonaName,
    personaSystemPrompt: initialPersonaSystemPrompt,
    userTier = 'free',
    showSoulGallery = false
}: ChatUIV2Props) {
    const [selectedPersona, setSelectedPersona] = useState<{
        id: string
        image?: string
        name?: string
        systemPrompt?: string
    } | null>(
        initialPersonaId
            ? {
                id: initialPersonaId,
                image: initialPersonaImage,
                name: initialPersonaName,
                systemPrompt: initialPersonaSystemPrompt
            }
            : null
    )

    const [isMemorySearchOpen, setIsMemorySearchOpen] = useState(false)
    const [memorySearchQuery, setMemorySearchQuery] = useState('')
    const [isVisualNovelMode, setIsVisualNovelMode] = useState(false)

    const handleSoulSelect = (personaId: string, personaData: any) => {
        setSelectedPersona({
            id: personaId,
            image: personaData.image_url,
            name: personaData.name,
            systemPrompt: personaData.system_prompt || personaData.description
        })
    }

    const handleMemorySearchTrigger = (query: string) => {
        setMemorySearchQuery(query)
        setIsMemorySearchOpen(true)
    }

    return (
        <>
            <MoodStyles />
            <ChatEngineProvider
                personaId={selectedPersona?.id}
                initialSystemPrompt={selectedPersona?.systemPrompt}
                userTier={userTier}
            >
                <ChatUIInner
                    userId={userId}
                    personaImage={selectedPersona?.image}
                    personaName={selectedPersona?.name}
                    showSoulGallery={showSoulGallery}
                    onSoulSelect={handleSoulSelect}
                    onMemorySearchTrigger={handleMemorySearchTrigger}
                    isVisualNovelMode={isVisualNovelMode}
                    toggleVisualNovelMode={() => setIsVisualNovelMode(!isVisualNovelMode)}
                />
                <MemorySearchModal
                    isOpen={isMemorySearchOpen}
                    onClose={() => setIsMemorySearchOpen(false)}
                    initialQuery={memorySearchQuery}
                />
            </ChatEngineProvider>
        </>
    )
}
