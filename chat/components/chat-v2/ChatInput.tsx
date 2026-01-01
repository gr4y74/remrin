/**
 * Chat Input Component
 * 
 * Clean, minimal input with Remrin design language
 */

"use client"

import React, { useState, useRef, KeyboardEvent } from 'react'
import { useChatEngine, useMood } from './ChatEngine'
import { IconSend, IconPlayerStop } from '@tabler/icons-react'

interface ChatInputProps {
    placeholder?: string
    disabled?: boolean
    onMemorySearch?: (query: string) => void
}

export function ChatInput({
    placeholder = "Message Remrin...",
    disabled = false,
    onMemorySearch
}: ChatInputProps) {
    const [input, setInput] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { sendMessage, stopGeneration, isGenerating } = useChatEngine()
    const moodState = useMood()

    // Check if we should show excited pulse
    const isExcited = moodState.mood === 'excited'

    const handleSubmit = async () => {
        if (!input.trim() || isGenerating || disabled) return

        const message = input.trim()

        // Check for commands
        if (message.startsWith('/memory')) {
            const query = message.slice(7).trim()
            if (onMemorySearch) {
                onMemorySearch(query)
                setInput('')
                return
            }
        }

        setInput('')

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        await sendMessage(message)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)

        // Auto-resize textarea
        const textarea = e.target
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }

    return (
        <div className="relative flex w-full items-end gap-2">
            {/* Input Container */}
            <div className="relative flex-1 overflow-hidden rounded-2xl border border-rp-overlay bg-rp-surface/50 backdrop-blur-md transition-all duration-200 focus-within:border-rp-iris/50 focus-within:bg-rp-surface focus-within:shadow-[0_0_20px_-5px_rgba(196,167,231,0.1)] focus-within:ring-1 focus-within:ring-rp-iris/30">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isGenerating}
                    rows={1}
                    className="max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-5 py-3.5 text-base text-rp-text placeholder-rp-subtle/70 outline-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-rp-muted/20 disabled:opacity-50"
                />
            </div>

            {/* Send/Stop Button */}
            <button
                onClick={isGenerating ? stopGeneration : handleSubmit}
                disabled={disabled || (!isGenerating && !input.trim())}
                className={`
          flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl
          transition-all duration-200
          ${isExcited && !isGenerating && input.trim() ? 'mood-pulse-excited' : ''}
          ${isGenerating
                        ? 'bg-rp-love text-rp-base hover:bg-rp-love/90'
                        : input.trim()
                            ? 'bg-rp-iris text-rp-base hover:bg-rp-iris/90'
                            : 'bg-rp-surface text-rp-muted cursor-not-allowed'
                    }
          disabled:opacity-50
        `}
                aria-label={isGenerating ? 'Stop generation' : 'Send message'}
            >
                {isGenerating ? (
                    <IconPlayerStop size={22} />
                ) : (
                    <IconSend size={22} />
                )}
            </button>
        </div>
    )
}
