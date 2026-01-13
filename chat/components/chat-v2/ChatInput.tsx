/**
 * Chat Input Component
 * 
 * Clean, minimal input with Remrin design language
 */

"use client"

import React, { useState, useRef, KeyboardEvent } from 'react'
import { useChatEngine, useMood } from './ChatEngine'
import { IconSend, IconPlayerStop, IconPaperclip, IconMicrophone } from '@tabler/icons-react'
import { useFileHandler } from './hooks/use-file-handler'
import { toast } from 'sonner'
import { EmojiButton } from '@/components/ui/EmojiButton'
import { PickerItem } from '@/components/ui/UniversalPicker'
import { useEmojiInsertion } from '@/hooks/useEmojiInsertion'

interface ChatInputProps {
    placeholder?: string
    disabled?: boolean
    onMemorySearch?: (query: string) => void
    minimal?: boolean
}

export function ChatInput({
    placeholder = "Message Remrin...",
    disabled = false,
    onMemorySearch
}: ChatInputProps) {
    const [input, setInput] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { sendMessage, stopGeneration, isGenerating } = useChatEngine()
    const moodState = useMood()
    const { handleSelectDeviceFile, filesToAccept } = useFileHandler()
    const [isListening, setIsListening] = useState(false)
    const { insertEmoji } = useEmojiInsertion(textareaRef, input, setInput)

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleSelectDeviceFile(e.target.files[0])
        }
        // Reset input so same file can be selected again
        e.target.value = ''
    }

    const toggleVoiceInput = () => {
        if (isListening) {
            // Stop listening logic would go here if we had a sustained listener
            // For simple web speech API, it usually stops on end
            setIsListening(false)
            return
        }

        if (!('webkitSpeechRecognition' in window)) {
            toast.error("Voice input is not supported in this browser.")
            return
        }

        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setInput(prev => prev + (prev ? ' ' : '') + transcript)
            // Resize textarea after voice input
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
                }
            }, 0)
        }

        recognition.onerror = (event: any) => {
            console.error('Voice error:', event.error)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.start()
    }

    const handleEmojiSelect = (item: PickerItem) => {
        if (item.type === 'emoji') {
            // Insert emoji at cursor position
            insertEmoji(item.data)
        } else {
            // GIF or sticker - send as media message
            // For now, we'll just insert the URL into the text
            // You can modify this to send as actual media attachment
            toast.success(`${item.type === 'gif' ? 'GIF' : 'Sticker'} selected! (Media sending coming soon)`)
            // TODO: Implement actual media message sending
            // sendMediaMessage(item.type, item.data, item.name)
        }
    }

    return (
        <div className="relative flex w-full items-end gap-2">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={filesToAccept}
                onChange={handleFileSelect}
            />

            {/* Left Actions: File Upload, Voice, & Emoji */}
            <div className="flex gap-1 pb-1">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isGenerating}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-rp-subtle hover:bg-rp-overlay hover:text-rp-text disabled:opacity-50 transition-colors"
                    title="Upload file"
                >
                    <IconPaperclip size={20} />
                </button>
                <button
                    onClick={toggleVoiceInput}
                    disabled={disabled || isGenerating}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors disabled:opacity-50 ${isListening
                        ? 'bg-rp-love/20 text-rp-love animate-pulse'
                        : 'text-rp-subtle hover:bg-rp-overlay hover:text-rp-text'
                        }`}
                    title="Voice input"
                >
                    <IconMicrophone size={20} />
                </button>
                <EmojiButton
                    onSelect={handleEmojiSelect}
                    position="top"
                    theme="dark"
                />
            </div>

            {/* Input Container */}
            <div className="relative flex-1 overflow-hidden transition-all duration-200 focus-within:ring-1 focus-within:ring-rp-iris/20 rounded-2xl">
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
