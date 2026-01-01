/**
 * Chat Message Component
 * 
 * Single message display with markdown rendering
 */

"use client"

import React, { memo, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChatMessageContent } from '@/lib/chat-engine/types'
import { getTypingDelay } from '@/lib/chat-engine/typing'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { IconUser, IconRobot, IconCopy, IconCheck } from '@tabler/icons-react'
import { ThinkingIndicator } from './ThinkingIndicator'

interface ChatMessageProps {
    message: ChatMessageContent
    personaImage?: string
    personaName?: string
    isStreaming?: boolean
}

export const ChatMessage = memo(function ChatMessage({
    message,
    personaImage,
    personaName,
    isStreaming = false
}: ChatMessageProps) {
    const [copied, setCopied] = useState(false)
    const [displayedContent, setDisplayedContent] = useState('')
    const isUser = message.role === 'user'

    // Typing animation state
    const fullContentRef = useRef(message.content)
    const currentIndexRef = useRef(0)
    const rafIdRef = useRef<number | null>(null)
    const lastUpdateTimeRef = useRef(0)

    useEffect(() => {
        // If it's a user message or we are not streaming and content is already fully shown, just show it
        if (isUser || (!isStreaming && message.content === displayedContent)) {
            setDisplayedContent(message.content)
            return
        }

        // Reset if content changes completely or is shorter than what we've shown (e.g. rewrite)
        if (message.content.length < displayedContent.length || !message.content.startsWith(displayedContent.substring(0, Math.min(displayedContent.length, 10)))) {
            setDisplayedContent('')
            currentIndexRef.current = 0
        }

        fullContentRef.current = message.content

        const animate = (time: number) => {
            if (currentIndexRef.current >= fullContentRef.current.length) {
                rafIdRef.current = null
                return
            }

            const elapsed = time - lastUpdateTimeRef.current

            // Detect if we are in a code block for the next character
            const isNextCharInCode = fullContentRef.current.substring(0, currentIndexRef.current + 1).split('```').length % 2 === 0
            const delay = getTypingDelay(isNextCharInCode ? 'code' : 'prose')

            if (elapsed >= delay) {
                // Reveal more characters if delay is small (e.g. for code)
                const charsToReveal = delay < 10 ? Math.ceil((elapsed / delay)) : 1
                currentIndexRef.current = Math.min(currentIndexRef.current + charsToReveal, fullContentRef.current.length)
                setDisplayedContent(fullContentRef.current.substring(0, currentIndexRef.current))
                lastUpdateTimeRef.current = time
            }

            rafIdRef.current = requestAnimationFrame(animate)
        }

        if (currentIndexRef.current < fullContentRef.current.length) {
            if (rafIdRef.current === null) {
                lastUpdateTimeRef.current = performance.now()
                rafIdRef.current = requestAnimationFrame(animate)
            }
        }

        return () => {
            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current)
                rafIdRef.current = null
            }
        }
    }, [message.content, isStreaming, isUser])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={`group flex animate-in fade-in slide-in-from-bottom-2 duration-300 gap-4 px-4 py-6 md:px-8 ${isUser ? 'bg-transparent' : 'bg-rp-surface/20'
                }`}
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {isUser ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rp-iris/20 text-rp-iris">
                        <IconUser size={18} />
                    </div>
                ) : personaImage ? (
                    <div className="relative h-8 w-8">
                        <Image
                            src={personaImage}
                            alt={personaName || 'AI'}
                            className="rounded-full object-cover"
                            fill
                            sizes="32px"
                        />
                    </div>
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rp-foam/20 text-rp-foam">
                        <IconRobot size={18} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2 overflow-hidden">
                {/* Name */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-rp-text">
                        {isUser ? 'You' : (personaName || 'Remrin')}
                    </span>
                    {message.metadata?.provider && !isUser && (
                        <span className="text-xs text-rp-muted">
                            via {message.metadata.provider}
                        </span>
                    )}
                </div>

                {/* Message Content */}
                <div className="prose prose-sm prose-invert max-w-none relative">
                    {displayedContent ? (
                        <>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Code blocks with syntax highlighting
                                    code({ className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        const language = match ? match[1] : ''
                                        const isInline = !className

                                        if (!isInline && language) {
                                            return (
                                                <div className="relative my-4 group/code">
                                                    <div className="absolute right-2 top-2 flex items-center gap-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                        <span className="text-xs text-rp-muted">{language}</span>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(String(children))
                                                                setCopied(true)
                                                                setTimeout(() => setCopied(false), 2000)
                                                            }}
                                                            className="rounded p-1 text-rp-muted hover:bg-rp-overlay hover:text-rp-text"
                                                        >
                                                            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                        </button>
                                                    </div>
                                                    <SyntaxHighlighter
                                                        style={oneDark as any}
                                                        language={language}
                                                        PreTag="div"
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                </div>
                                            )
                                        }

                                        return (
                                            <code
                                                className="rounded bg-rp-overlay/50 px-1.5 py-0.5 font-mono text-sm text-rp-iris"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        )
                                    },
                                    // Links
                                    a({ href, children }) {
                                        return (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-rp-iris underline decoration-rp-iris/30 underline-offset-4 transition-colors hover:decoration-rp-iris"
                                            >
                                                {children}
                                            </a>
                                        )
                                    },
                                    // Paragraphs
                                    p({ children }) {
                                        return <p className="mb-4 leading-relaxed text-rp-text last:mb-0 inline">{children}</p>
                                    },
                                    // Lists
                                    ul({ children }) {
                                        return <ul className="mb-4 list-disc pl-6 text-rp-text marker:text-rp-subtle">{children}</ul>
                                    },
                                    ol({ children }) {
                                        return <ol className="mb-4 list-decimal pl-6 text-rp-text marker:text-rp-subtle">{children}</ol>
                                    }
                                }}
                            >
                                {displayedContent}
                            </ReactMarkdown>
                            {(isStreaming || currentIndexRef.current < fullContentRef.current.length) && (
                                <span className="inline-block w-2 h-4 ml-1 bg-rp-iris/50 animate-pulse align-middle" />
                            )}
                        </>
                    ) : isStreaming ? (
                        <ThinkingIndicator />
                    ) : null}

                    {/* Copy button for assistant messages */}
                    {!isUser && message.content && (
                        <button
                            onClick={handleCopy}
                            className="mt-2 flex items-center gap-1 text-xs text-rp-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-rp-text"
                        >
                            {copied ? (
                                <>
                                    <IconCheck size={14} />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <IconCopy size={14} />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
})
