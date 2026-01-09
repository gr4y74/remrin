"use client"

import { useState, useEffect, useContext } from 'react'
import { RemrinContext } from '@/context/context'
import { ChatEngineProvider, useChatEngine } from '@/components/chat-v2/ChatEngine'
import { ChatMessages } from '@/components/chat-v2/ChatMessages'
import { ChatInput } from '@/components/chat-v2/ChatInput'
import { IconMessage, IconX, IconMinus, IconArrowRight, IconSparkles } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface FloatingChatBubbleProps {
    personaId: string
    personaName: string
    personaImage?: string | null
    personaSystemPrompt?: string
    workspaceId: string
    isOpen: boolean
    onClose: () => void
}

/**
 * Inner component that uses ChatEngine context
 */
function FloatingChatInner({
    personaName,
    personaImage,
    workspaceId,
    personaId,
    onMinimize,
    onClose,
    onDragStart
}: {
    personaName: string
    personaImage?: string | null
    workspaceId: string
    personaId: string
    onMinimize: () => void
    onClose: () => void
    onDragStart?: (e: React.MouseEvent) => void
}) {
    const { messages } = useChatEngine()

    return (
        <div className="flex flex-col h-full bg-rp-base border border-rp-muted/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header - Draggable */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-rp-muted/20 bg-rp-surface/50 backdrop-blur-sm cursor-grab active:cursor-grabbing"
                onMouseDown={onDragStart}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Character Avatar */}
                    <div className="relative size-8 shrink-0 rounded-full overflow-hidden border-2 border-rp-iris/50">
                        {personaImage ? (
                            <Image
                                src={personaImage}
                                alt={personaName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="size-full bg-gradient-to-br from-rp-iris to-rp-love flex items-center justify-center">
                                <IconSparkles size={16} className="text-white" />
                            </div>
                        )}
                    </div>

                    {/* Character Name */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-rp-text truncate">
                            {personaName}
                        </h3>
                        <p className="text-xs text-rp-muted">Quick chat from feed</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <Link
                        href={`/${workspaceId}/chat?persona=${personaId}`}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-rp-iris hover:text-rp-love transition-colors rounded-lg hover:bg-rp-overlay"
                    >
                        Full Chat
                        <IconArrowRight size={14} />
                    </Link>
                    <button
                        onClick={onMinimize}
                        className="p-1.5 hover:bg-rp-overlay rounded-lg transition-colors"
                        aria-label="Minimize"
                    >
                        <IconMinus size={18} className="text-rp-subtle" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-rp-overlay rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <IconX size={18} className="text-rp-subtle" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-auto">
                {messages.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-rp-overlay mb-4">
                            <IconMessage size={28} className="text-rp-muted" />
                        </div>
                        <h4 className="text-rp-text text-base font-semibold mb-2">
                            Start chatting with {personaName}
                        </h4>
                        <p className="text-rp-muted text-sm max-w-[280px] mb-4">
                            Try a quick conversation to see if you'd like to follow this character
                        </p>
                        <Link
                            href={`/${workspaceId}/chat?persona=${personaId}`}
                            className="text-xs text-rp-iris hover:text-rp-love transition-colors flex items-center gap-1"
                        >
                            Or open full chat page
                            <IconArrowRight size={12} />
                        </Link>
                    </div>
                ) : (
                    <ChatMessages />
                )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-rp-muted/20 p-3 bg-rp-surface/30">
                <ChatInput />
            </div>
        </div>
    )
}

/**
 * Floating Chat Bubble Component
 * Messenger-style floating chat for Feed page
 */
export function FloatingChatBubble({
    personaId,
    personaName,
    personaImage,
    personaSystemPrompt,
    workspaceId,
    isOpen,
    onClose
}: FloatingChatBubbleProps) {
    const { profile } = useContext(RemrinContext)
    const [showNotification, setShowNotification] = useState(false)

    // Draggable state
    const [position, setPosition] = useState({ x: 291, y: window.innerHeight / 2 - 300 }) // Default: 291px from left, centered vertically
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    // Show notification when character changes
    useEffect(() => {
        if (isOpen) {
            setShowNotification(true)
            const timer = setTimeout(() => setShowNotification(false), 2000)
            return () => clearTimeout(timer)
        }
    }, [personaId, isOpen])

    if (!profile) {
        return null
    }

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Add/remove global mouse listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, dragOffset])

    return (
        <>
            {/* Expanded Chat Window - Only show when isOpen */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed z-50",
                        "w-[400px] h-[600px]",
                        "max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]",
                        "animate-in fade-in duration-300",
                        isDragging && "cursor-grabbing"
                    )}
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`
                    }}
                >
                    <ChatEngineProvider
                        userId={profile.user_id}
                        personaId={personaId}
                        personaName={personaName}
                        personaImage={personaImage || undefined}
                        personaSystemPrompt={personaSystemPrompt}
                        workspaceId={workspaceId}
                    >
                        <FloatingChatInner
                            personaName={personaName}
                            personaImage={personaImage}
                            workspaceId={workspaceId}
                            personaId={personaId}
                            onMinimize={onClose}
                            onClose={onClose}
                            onDragStart={handleMouseDown}
                        />
                    </ChatEngineProvider>

                    {/* Character Change Notification */}
                    {showNotification && (
                        <div className="absolute -top-12 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="bg-rp-surface/95 backdrop-blur-md border border-rp-muted/20 rounded-full px-4 py-2 shadow-lg">
                                <p className="text-xs text-rp-text flex items-center gap-2">
                                    <IconSparkles size={14} className="text-rp-iris" />
                                    Now chatting with {personaName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
