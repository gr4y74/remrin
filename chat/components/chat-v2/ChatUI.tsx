/**
 * Chat UI v2 - Main Component
 * 
 * Complete chat interface using the new modular engine
 */

"use client"

import React, { useState } from 'react'
import { ChatEngineProvider, useChatEngine, useMood } from './ChatEngine'
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

/**
 * Inner component that uses the chat engine context
 */
function ChatUIInner({
    userId,
    personaImage,
    personaName,
    showSoulGallery = false,
    onSoulSelect,
    onMemorySearchTrigger
}: {
    userId?: string
    personaImage?: string
    personaName?: string
    showSoulGallery?: boolean
    onSoulSelect?: (personaId: string, personaData: any) => void
    onMemorySearchTrigger?: (query: string) => void
}) {
    const { messages, personaId } = useChatEngine()
    const moodState = useMood()

    // Determine if we should show desaturation (low battery)
    const isLowBattery = moodState.battery < 30

    return (
        <div
            className={`flex h-full flex-col relative ${isLowBattery ? 'low-battery-mode' : ''}`}
        >
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
