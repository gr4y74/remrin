/**
 * Chat UI v2 - Main Component
 * 
 * Complete chat interface using the new modular engine
 */

"use client"

import React, { useState, useContext, useEffect } from 'react'
import { ChatEngineProvider, useChatEngine, useMood } from './ChatEngine'
import { RemrinContext } from '@/context/context'
import { MiniProfile } from './MiniProfile'
import { IconBook, IconMessage } from '@tabler/icons-react'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessages'
import { SoulGallery } from './SoulGallery'
import { MoodHUD } from './MoodHUD'
import { MemorySearchModal } from './MemorySearchModal'
import { UserTier } from '@/lib/chat-engine/types'
import { MOOD_EMOJI, MoodType } from '@/lib/chat-engine/mood'
import Image from 'next/image'
import { MOTHER_OF_SOULS_ID } from '@/lib/forge/is-mother-chat'
import { useRecentChats } from '@/hooks/useRecentChats'

interface ChatUIV2Props {
    userId?: string
    personaId?: string
    personaImage?: string
    personaName?: string
    personaSystemPrompt?: string
    personaIntroMessage?: string
    userTier?: UserTier
    showSoulGallery?: boolean
    welcomeAudioUrl?: string | null
}


/**
 * Inner component that uses the chat engine context
 */
function ChatUIInner({
    userId,
    personaImage,
    personaName,
    welcomeAudioUrl,
    showSoulGallery = false,
    onSoulSelect,
    onMemorySearchTrigger,
    isVisualNovelMode,
    toggleVisualNovelMode
}: {
    userId?: string
    personaImage?: string
    personaName?: string
    welcomeAudioUrl?: string | null
    showSoulGallery?: boolean
    onSoulSelect?: (personaId: string, personaData: any) => void
    onMemorySearchTrigger?: (query: string) => void
    isVisualNovelMode: boolean
    toggleVisualNovelMode: () => void
}) {
    const { messages, personaId } = useChatEngine()
    const moodState = useMood()
    const { trackChat } = useRecentChats()
    const {
        chatBackgroundEnabled,
        activeBackgroundUrl,
        setIsCharacterPanelOpen,
        personas,
        profile,
        selectedWorkspace,
        setChatBackgroundEnabled,
        setActiveBackgroundUrl
    } = useContext(RemrinContext)

    // Find current persona details from context if possible
    const currentPersona = personas.find(p => p.id === personaId)

    // Track chat when user sends a message
    useEffect(() => {
        if (messages.length > 0 && personaId && personaName && personaImage && selectedWorkspace) {
            // Track this chat in recent chats
            trackChat(personaId, personaName, personaImage, selectedWorkspace.id)
        }
    }, [messages.length, personaId, personaName, personaImage, selectedWorkspace, trackChat])

    // Determine if we should show desaturation (low battery)
    const isLowBattery = moodState.battery < 30

    // Check if this is Mother of Souls chat
    const isMotherChat = personaId === 'a0000000-0000-0000-0000-000000000001' || personaName === 'The Mother of Souls'

    // Visual Novel Layout
    if (isVisualNovelMode) {
        const spriteUrl = personaImage || "/images/mother/mother_avatar.png"

        return (
            <div className={`fixed inset-0 z-40 overflow-hidden bg-black ${isLowBattery ? 'low-battery-mode' : ''}`}>
                {/* Background gradient overlay */}
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Character Sprite - Using viewport units and transform centering */}
                <div
                    className="absolute bottom-[200px] left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-in fade-in slide-in-from-bottom-10 duration-700"
                    style={{ width: '50vw', maxWidth: '400px', height: '70vh' }}
                >
                    <Image
                        src={spriteUrl}
                        alt={personaName || "Character"}
                        fill
                        sizes="(max-width: 768px) 80vw, 400px"
                        className="object-contain object-bottom drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                        priority
                    />
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
        <div className={`flex h-full flex-col relative ${isLowBattery ? 'low-battery-mode' : ''}`}>
            {/* Mother of Souls Background */}
            {isMotherChat && (
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: 'url(/images/mother/mother_bg2.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed'
                    }}
                />
            )}
            {/* Mini Profile Card */}
            {personaId && (
                <div className="relative z-10">
                    <MiniProfile
                        personaName={personaName}
                        personaImage={personaImage}
                        description={currentPersona?.description || ""}
                        creatorName={currentPersona?.creator_id === 'system' ? 'System' : 'Creator'}
                        onViewProfile={() => setIsCharacterPanelOpen(true)}
                        onSettings={() => {
                            // TODO: Implement Chat Settings Modal
                            alert("Chat Settings coming soon!")
                        }}
                        moodState={{
                            mood: moodState.mood,
                            emoji: MOOD_EMOJI[moodState.mood as MoodType] || '😊',
                            battery: moodState.battery
                        }}
                        isVisualNovelMode={isVisualNovelMode}
                        onToggleVisualNovel={toggleVisualNovelMode}
                        profile={profile}
                        setChatBackgroundEnabled={setChatBackgroundEnabled}
                        setActiveBackgroundUrl={setActiveBackgroundUrl}
                        welcomeAudioUrl={welcomeAudioUrl}
                    />
                </div>
            )}


            {/* Messages Area - No container, bubbles sit directly on background */}
            <div className="flex flex-1 flex-col relative z-10">
                {messages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
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
                                <h2 className="mb-2 text-2xl font-bold text-rp-text">
                                    Speak with {personaName || 'the Soul'}
                                </h2>
                                <p className="mb-8 text-rp-muted">
                                    {personaId
                                        ? `Connecting with the frequency of ${personaName}...`
                                        : "Choose a Soul from the library or gallery to begin your journey."
                                    }
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
            </div>

            {/* Input area with glassmorphic styling */}
            <div className="px-4 pb-6 relative z-10">
                <div className="mx-auto max-w-3xl rounded-xl bg-rp-base/20 backdrop-blur-md border border-white/10 p-3 shadow-lg">
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
    personaIntroMessage: initialPersonaIntroMessage,
    welcomeAudioUrl: initialWelcomeAudioUrl,
    userTier = 'free',
    showSoulGallery = false
}: ChatUIV2Props) {
    const [selectedPersona, setSelectedPersona] = useState<{
        id: string
        image?: string
        name?: string
        systemPrompt?: string
        introMessage?: string
        welcomeAudioUrl?: string | null
    } | null>(
        initialPersonaId
            ? {
                id: initialPersonaId,
                image: initialPersonaImage,
                name: initialPersonaName,
                systemPrompt: initialPersonaSystemPrompt,
                introMessage: initialPersonaIntroMessage,
                welcomeAudioUrl: initialWelcomeAudioUrl
            }
            : null
    )

    const [isMemorySearchOpen, setIsMemorySearchOpen] = useState(false)
    const [memorySearchQuery, setMemorySearchQuery] = useState('')
    const [isVisualNovelMode, setIsVisualNovelMode] = useState(false)

    // Sync state with props
    React.useEffect(() => {
        if (initialPersonaId) {
            setSelectedPersona({
                id: initialPersonaId,
                image: initialPersonaImage,
                name: initialPersonaName,
                systemPrompt: initialPersonaSystemPrompt,
                introMessage: initialPersonaIntroMessage,
                welcomeAudioUrl: initialWelcomeAudioUrl
            })
        }
    }, [initialPersonaId, initialPersonaImage, initialPersonaName, initialPersonaSystemPrompt, initialPersonaIntroMessage, initialWelcomeAudioUrl])

    const handleSoulSelect = (personaId: string, personaData: any) => {
        setSelectedPersona({
            id: personaId,
            image: personaData.image_url,
            name: personaData.name,
            systemPrompt: personaData.system_prompt || personaData.description,
            introMessage: personaData.intro_message,
            welcomeAudioUrl: personaData.welcome_audio_url
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
                key={selectedPersona?.id || 'none'}
                personaId={selectedPersona?.id}
                initialSystemPrompt={selectedPersona?.systemPrompt}
                personaIntroMessage={selectedPersona?.introMessage}
                userTier={userTier}
            >
                <ChatUIInner
                    userId={userId}
                    personaImage={selectedPersona?.image || initialPersonaImage}
                    personaName={selectedPersona?.name || initialPersonaName}
                    showSoulGallery={showSoulGallery}
                    onSoulSelect={handleSoulSelect}
                    onMemorySearchTrigger={handleMemorySearchTrigger}
                    isVisualNovelMode={isVisualNovelMode}
                    toggleVisualNovelMode={() => setIsVisualNovelMode(!isVisualNovelMode)}
                    welcomeAudioUrl={selectedPersona?.welcomeAudioUrl || initialWelcomeAudioUrl}
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
