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
import { CallModal } from './CallModal'
import { UserTier } from '@/lib/chat-engine/types'
import { MOOD_EMOJI, MoodType } from '@/lib/chat-engine/mood'
import Image from 'next/image'
import { MOTHER_OF_SOULS_ID } from '@/lib/forge/is-mother-chat'
import { useRecentChats } from '@/hooks/useRecentChats'
import { PersonaSettingsModal } from '@/components/chat/PersonaSettingsModal'
import { toast } from 'sonner'
import { updatePersonaPortraitV5Action } from '@/app/actions/update-persona-portrait-v5'
import { useParams } from 'next/navigation'

interface ChatUIV2Props {
    userId?: string
    personaId?: string
    personaImage?: string
    personaVideoUrl?: string | null
    personaName?: string
    personaSystemPrompt?: string
    personaIntroMessage?: string
    userTier?: UserTier
    showSoulGallery?: boolean
    welcomeAudioUrl?: string | null
    backgroundMusicUrl?: string | null
}


/**
 * Inner component that uses the chat engine context
 */
function ChatUIInner({
    userId,
    personaImage,
    personaVideoUrl,
    personaName,
    welcomeAudioUrl,
    backgroundMusicUrl,
    showSoulGallery = false,
    onSoulSelect,
    onMemorySearchTrigger,
    isVisualNovelMode,
    toggleVisualNovelMode,
    onStartCall
}: {
    userId?: string
    personaImage?: string
    personaVideoUrl?: string | null
    personaName?: string
    welcomeAudioUrl?: string | null
    backgroundMusicUrl?: string | null
    showSoulGallery?: boolean
    onSoulSelect?: (personaId: string, personaData: any) => void
    onMemorySearchTrigger?: (query: string) => void
    isVisualNovelMode: boolean
    toggleVisualNovelMode: () => void
    onStartCall?: () => void
}) {
    const { messages, personaId, isLoadingHistory } = useChatEngine()
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

    const params = useParams()
    const locale = params.locale as string

    // 1. Global Mute State
    const [isGlobalMuted, setIsGlobalMuted] = useState(false)
    const [showPersonalizeModal, setShowPersonalizeModal] = useState(false)
    const [personalizeTab, setPersonalizeTab] = useState("identity")
    const [isSparking, setIsSparking] = useState(false)

    // Load mute state from localStorage
    useEffect(() => {
        const savedMute = localStorage.getItem('remrin_global_mute') === 'true'
        setIsGlobalMuted(savedMute)
    }, [])

    // Track this chat session
    useEffect(() => {
        if (personaId && personaName && personaImage && selectedWorkspace?.id) {
            trackChat(personaId, personaName, personaImage, selectedWorkspace.id)
        }
    }, [personaId, personaName, personaImage, selectedWorkspace?.id, trackChat])

    const handleToggleMute = () => {
        const newState = !isGlobalMuted
        setIsGlobalMuted(newState)
        localStorage.setItem('remrin_global_mute', String(newState))
        toast(newState ? "Audio Muted" : "Audio Unmuted", {
            description: newState ? "Character voices are now disabled." : "Character voices are now enabled."
        })
    }

    // Handlers for top bar dropdown
    const handleSparkOfLife = async () => {
        if (!profile || !personaId) return;

        if (!confirm(`Ignite the Spark of Life for 50 Aether?\n\nThis will generate a living video portrait for ${personaName}.`)) return;

        setIsSparking(true)
        const toastId = toast.loading("Igniting Spark of Life...")

        try {
            const response = await fetch("/api/spark/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    persona_id: personaId,
                    image_url: personaImage
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to start generation")

            toast.message("Spark ignited! Breathing life into soul...", {
                description: "This may take several minutes, please be patient.",
                id: toastId,
                duration: 10000
            })

            const predictionId = data.predictionId
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/spark/status?id=${predictionId}&personaId=${personaId}`)
                    const statusData = await statusRes.json()

                    if (statusData.status === "succeeded") {
                        clearInterval(pollInterval)
                        setIsSparking(false)
                        toast.success("It is alive! Refresh to see changes.", { id: toastId })
                        window.location.reload()
                    } else if (statusData.status === "failed") {
                        clearInterval(pollInterval)
                        setIsSparking(false)
                        toast.error("The spark faded. Please try again.", { id: toastId })
                    }
                } catch (e) {
                    console.error("Polling error", e)
                }
            }, 3000)

        } catch (error: any) {
            setIsSparking(false)
            toast.error(error.message, { id: toastId })
        }
    }

    const handleChangeHeroImage = () => {
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = 'image/*'
        fileInput.onchange = async (e: any) => {
            const file = e.target.files?.[0]
            if (!file || !personaId) return

            const toastId = toast.loading("Uploading new portrait...")
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('personaId', personaId)
                formData.append('type', 'hero')

                const result = await updatePersonaPortraitV5Action(formData)
                if (result.error) throw new Error(result.error)

                toast.success("Hero image updated!", { id: toastId })
                window.location.reload()
            } catch (err: any) {
                toast.error(err.message, { id: toastId })
            }
        }
        fileInput.click()
    }

    // Find current persona details from context if possible
    const currentPersona = personas.find(p => p.id === personaId)
    const isOwner = profile?.user_id === currentPersona?.creator_id
    const hasVideo = !!personaVideoUrl

    // Determine if we should show desaturation (low battery)
    const isLowBattery = moodState.battery < 30

    // Check if this is Mother of Souls chat
    const isMotherChat = personaId === 'a0000000-0000-0000-0000-000000000001' || personaName === 'The Mother of Souls'

    // Visual Novel Layout - Theater Mode
    if (isVisualNovelMode) {
        const spriteUrl = personaImage || "/images/mother/mother_avatar.png"
        const videoUrl = personaVideoUrl

        // Get the last assistant message for the dialogue bubble
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')

        return (
            <div className={`fixed inset-0 z-50 overflow-hidden ${isLowBattery ? 'low-battery-mode' : ''}`}>
                {/* TRUE FULLSCREEN - Character fills entire screen on mobile */}

                {/* 1. Character Background - Full bleed on mobile */}
                {videoUrl ? (
                    <video
                        src={videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                ) : (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={spriteUrl}
                            alt={personaName || "Character"}
                            fill
                            sizes="100vw"
                            className="object-cover md:object-contain"
                            priority
                        />
                    </div>
                )}

                {/* 2. Gradient overlay - stronger at bottom for text readability */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/30 to-transparent md:from-black/90 md:via-black/50" />

                {/* 3. Mode Toggle - Top Right (smaller & more subtle on mobile) */}
                <button
                    onClick={toggleVisualNovelMode}
                    className="absolute top-4 right-4 z-50 p-3 md:p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all shadow-lg touch-manipulation"
                    title="Switch to Chat Mode"
                >
                    <IconMessage size={24} className="md:w-5 md:h-5" />
                </button>

                {/* 4. Text Box at Bottom 1/3 - True VN Style */}
                <div className="absolute bottom-0 left-0 right-0 z-10 vn-text-box pb-safe-area-inset-bottom">
                    <div className="max-w-4xl mx-auto px-4 md:px-8">

                        {/* Character Name Tag */}
                        <div className="inline-block px-4 py-1.5 bg-rp-iris text-white font-bold rounded-lg text-sm shadow-lg mb-3">
                            {personaName}
                        </div>

                        {/* Dialogue Text - Typewriter style */}
                        <div className="min-h-[60px] max-h-[25vh] md:max-h-[20vh] overflow-y-auto scrollbar-hide">
                            {messages.length === 0 ? (
                                <p className="text-white/60 italic text-lg md:text-base">
                                    Tap to begin your story...
                                </p>
                            ) : lastAssistantMessage ? (
                                <p className="text-white text-lg md:text-base leading-relaxed vn-text-animate">
                                    {lastAssistantMessage.content}
                                </p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-white/60 italic">Thinking</span>
                                    <span className="inline-flex gap-1">
                                        <span className="w-2 h-2 bg-rp-iris rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-rp-iris rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-rp-iris rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Input Area - Compact VN style */}
                        <div className="mt-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                            <ChatInput
                                placeholder="What do you say?"
                                onMemorySearch={onMemorySearchTrigger}
                                onStartCall={onStartCall}
                                minimal
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Swipe indicator for history (mobile hint) */}
                <div className="absolute bottom-[35vh] left-1/2 -translate-x-1/2 z-20 md:hidden opacity-40">
                    <div className="flex flex-col items-center gap-1 text-white/50 text-xs">
                        <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span>Swipe for history</span>
                    </div>
                </div>
            </div>
        )
    }

    // Classic Layout - Mobile Optimized
    return (
        <div className={`flex flex-col relative chat-container-mobile md:h-full ${isLowBattery ? 'low-battery-mode' : ''}`}>
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
                <div className="relative z-10 shrink-0">
                    <MiniProfile
                        personaId={personaId}
                        personaName={personaName}
                        personaImage={personaImage}
                        description={currentPersona?.description || ""}
                        creatorName={currentPersona?.creator_id === 'system' ? 'System' : 'Creator'}
                        onViewProfile={() => setIsCharacterPanelOpen(true)}
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
                        backgroundMusicUrl={backgroundMusicUrl}
                        onPersonalize={(tab?: string) => {
                            if (tab) setPersonalizeTab(tab)
                            setShowPersonalizeModal(true)
                        }}
                        isGlobalMuted={isGlobalMuted}
                        onToggleMute={handleToggleMute}
                        onSparkOfLife={handleSparkOfLife}
                        isSparking={isSparking}
                        onChangeHeroImage={handleChangeHeroImage}
                        isOwner={isOwner}
                        hasVideo={hasVideo}
                    />
                </div>
            )}

            {/* Persona Personalization Modal */}
            {personaId && (
                <PersonaSettingsModal
                    isOpen={showPersonalizeModal}
                    onClose={() => setShowPersonalizeModal(false)}
                    personaId={personaId}
                    personaName={personaName || "this soul"}
                    defaultTab={personalizeTab}
                />
            )}


            {/* Messages Area - Scrollable between header and input */}
            <div className="flex flex-1 flex-col relative z-10 overflow-hidden chat-messages-mobile">
                {isLoadingHistory ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-rp-surface/60 p-6 shadow-xl backdrop-blur-md">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-rp-iris border-t-transparent" />
                            <p className="text-rp-text animate-pulse font-medium">Restoring memory...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
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
                            <div className="flex max-w-sm flex-col items-center text-center animate-in fade-in zoom-in duration-500 rounded-3xl border border-white/10 bg-rp-surface/60 p-10 shadow-2xl backdrop-blur-md">
                                <h2 className="mb-2 text-2xl font-bold text-rp-text drop-shadow-sm">
                                    Speak with {personaName || 'the Soul'}
                                </h2>
                                <p className="text-rp-text/80 leading-relaxed font-medium">
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

            {/* Fixed Bottom Input - Mobile Optimized */}
            <div className="relative z-10 shrink-0 chat-input-fixed px-3 md:px-4 pt-3 pb-safe-area-inset-bottom md:pb-6">
                <div className="mx-auto max-w-3xl rounded-2xl bg-rp-base/20 backdrop-blur-md border border-white/10 p-2 md:p-3 shadow-lg">
                    <ChatInput
                        placeholder={personaName ? `Message ${personaName}...` : 'Message Remrin...'}
                        onMemorySearch={onMemorySearchTrigger}
                        onStartCall={onStartCall}
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
    personaVideoUrl: initialPersonaVideoUrl,
    personaName: initialPersonaName,
    personaSystemPrompt: initialPersonaSystemPrompt,
    personaIntroMessage: initialPersonaIntroMessage,
    welcomeAudioUrl: initialWelcomeAudioUrl,
    backgroundMusicUrl: initialBackgroundMusicUrl,
    userTier = 'free',
    showSoulGallery = false
}: ChatUIV2Props) {
    const [selectedPersona, setSelectedPersona] = useState<{
        id: string
        image?: string
        videoUrl?: string | null
        name?: string
        systemPrompt?: string
        introMessage?: string
        welcomeAudioUrl?: string | null
        backgroundMusicUrl?: string | null
    } | null>(
        initialPersonaId
            ? {
                id: initialPersonaId,
                image: initialPersonaImage,
                videoUrl: initialPersonaVideoUrl,
                name: initialPersonaName,
                systemPrompt: initialPersonaSystemPrompt,
                introMessage: initialPersonaIntroMessage,
                welcomeAudioUrl: initialWelcomeAudioUrl,
                backgroundMusicUrl: initialBackgroundMusicUrl
            }
            : null
    )

    const [isMemorySearchOpen, setIsMemorySearchOpen] = useState(false)
    const [memorySearchQuery, setMemorySearchQuery] = useState('')
    const [isVisualNovelMode, setIsVisualNovelMode] = useState(false)
    const [isCallActive, setIsCallActive] = useState(false)

    // Detect mobile and set visual novel mode as default
    React.useEffect(() => {
        const isMobile = window.innerWidth < 768
        if (isMobile && !isVisualNovelMode) {
            setIsVisualNovelMode(true)
        }
    }, [])

    // Sync state with props
    React.useEffect(() => {
        if (initialPersonaId) {
            setSelectedPersona({
                id: initialPersonaId,
                image: initialPersonaImage,
                videoUrl: initialPersonaVideoUrl,
                name: initialPersonaName,
                systemPrompt: initialPersonaSystemPrompt,
                introMessage: initialPersonaIntroMessage,
                welcomeAudioUrl: initialWelcomeAudioUrl,
                backgroundMusicUrl: initialBackgroundMusicUrl
            })
        }
    }, [initialPersonaId, initialPersonaImage, initialPersonaVideoUrl, initialPersonaName, initialPersonaSystemPrompt, initialPersonaIntroMessage, initialWelcomeAudioUrl, initialBackgroundMusicUrl])

    const handleSoulSelect = (personaId: string, personaData: any) => {
        setSelectedPersona({
            id: personaId,
            image: personaData.image_url,
            videoUrl: personaData.video_url,
            name: personaData.name,
            systemPrompt: personaData.system_prompt || personaData.description,
            introMessage: personaData.intro_message,
            welcomeAudioUrl: personaData.welcome_audio_url,
            backgroundMusicUrl: personaData.background_music_url
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
                    personaVideoUrl={selectedPersona?.videoUrl || initialPersonaVideoUrl}
                    personaName={selectedPersona?.name || initialPersonaName}
                    showSoulGallery={showSoulGallery}
                    onSoulSelect={handleSoulSelect}
                    onMemorySearchTrigger={handleMemorySearchTrigger}
                    isVisualNovelMode={isVisualNovelMode}
                    toggleVisualNovelMode={() => setIsVisualNovelMode(!isVisualNovelMode)}
                    welcomeAudioUrl={selectedPersona?.welcomeAudioUrl || initialWelcomeAudioUrl}
                    backgroundMusicUrl={selectedPersona?.backgroundMusicUrl || initialBackgroundMusicUrl}
                    onStartCall={() => setIsCallActive(true)}
                />
                <MemorySearchModal
                    isOpen={isMemorySearchOpen}
                    onClose={() => setIsMemorySearchOpen(false)}
                    initialQuery={memorySearchQuery}
                />
                <CallModal
                    isOpen={isCallActive}
                    onClose={() => setIsCallActive(false)}
                    personaName={selectedPersona?.name || initialPersonaName}
                    personaImage={selectedPersona?.image || initialPersonaImage}
                />
            </ChatEngineProvider>
        </>
    )
}
