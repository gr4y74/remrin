/**
 * Chat Messages Container
 * 
 * Displays the list of messages with auto-scroll
 */

"use client"

import React, { useEffect, useRef } from 'react'
import { useChatEngine } from './ChatEngine'
import { ChatMessage } from './ChatMessage'

interface ChatMessagesProps {
    personaImage?: string
    personaName?: string
}

export function ChatMessages({
    personaImage,
    personaName
}: ChatMessagesProps) {
    const { messages, isGenerating, error } = useChatEngine()
    const containerRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const [showScrollButton, setShowScrollButton] = React.useState(false)

    // Handle scroll to check if we should show the button
    const handleScroll = () => {
        if (!containerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShowScrollButton(!isNearBottom)
    }

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Auto-scroll to bottom on new messages if already near bottom
    useEffect(() => {
        if (bottomRef.current) {
            // Only auto-scroll if we are already near the bottom or it's a new message generation start
            const container = containerRef.current
            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 150
                if (isNearBottom || isGenerating) {
                    bottomRef.current.scrollIntoView({ behavior: 'smooth' })
                }
            }
        }
    }, [messages, isGenerating])

    if (messages.length === 0) {
        return null // Empty state handled by parent
    }

    return (
        <div className="relative flex-1 overflow-hidden">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-rp-muted/20"
            >
                {/* Messages */}
                <div className="mx-auto flex w-full max-w-3xl flex-col pb-8">
                    {messages
                        .filter(m => m.role !== 'system')
                        .map((message, index) => (
                            <ChatMessage
                                key={`${message.role}-${index}-${message.timestamp?.getTime() || index}`}
                                message={message}
                                personaImage={personaImage}
                                personaName={personaName}
                                isStreaming={
                                    isGenerating &&
                                    index === messages.length - 1 &&
                                    message.role === 'assistant'
                                }
                            />
                        ))}

                    {/* Error display */}
                    {error && (
                        <div className="mx-4 my-4 animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-rp-love/30 bg-rp-love/10 p-4">
                            <p className="text-sm font-medium text-rp-love">
                                <strong>Error:</strong> {error}
                            </p>
                            <p className="mt-1 text-xs text-rp-muted">
                                Please try again or contact support if the issue persists.
                            </p>
                        </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-6 right-6 flex h-10 w-10 animate-in fade-in zoom-in duration-200 items-center justify-center rounded-full border border-rp-iris/20 bg-rp-surface text-rp-subtle shadow-lg transition-colors hover:bg-rp-overlay hover:text-rp-text"
                    aria-label="Scroll to bottom"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </button>
            )}
        </div>
    )
}
