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
import { IconUser, IconRobot, IconCopy, IconCheck, IconRotate2 } from '@tabler/icons-react'

import { ThinkingIndicator } from './ThinkingIndicator'
import { StartSpeakingButton } from "@/components/voice/StartSpeakingButton"
import { MotherMessage, VisionLoading, SoulRevealCard, VoiceSelector } from '@/components/soul-forge'
import { isMotherOfSouls, isVoiceSelectionPrompt } from '@/lib/forge/is-mother-chat'
import { SoulRevealData } from '@/lib/forge/tool-handlers'
import { useChatEngine } from './ChatEngine'
import { AVAILABLE_VOICES } from '@/lib/voice/config'
import { RemrinContext } from '@/context/context'
import { useContext } from 'react'
import Link from 'next/link'


interface ChatMessageProps {
    message: ChatMessageContent
    personaImage?: string
    personaName?: string
    isStreaming?: boolean
    onRewind?: () => void
    isVisualNovel?: boolean
}

export const ChatMessage = memo(function ChatMessage({
    message,
    personaImage,
    personaName,
    isStreaming = false,
    onRewind,
    isVisualNovel = false
}: ChatMessageProps) {
    const [copied, setCopied] = useState(false)
    const [displayedContent, setDisplayedContent] = useState('')
    const { sendMessage } = useChatEngine()
    const { profile } = useContext(RemrinContext)
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>((message.metadata as any)?.selectedVoiceId)
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
                // Reveal more characters if we are lagging behind
                const charsToReveal = Math.floor(elapsed / delay)
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
    }, [message.content, isStreaming, isUser, displayedContent])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isMother = !isUser && (personaName === 'The Mother of Souls' || (message.metadata as any)?.personaId === 'a0000000-0000-0000-0000-000000000001')
    const isVoicePrompt = isMother && isVoiceSelectionPrompt(message.content)

    // Render Source (Content area)
    const renderMarkdown = (content: string) => (
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
            {content}
        </ReactMarkdown>
    )

    // Render Mother specialized message
    if (isMother) {
        return (
            <MotherMessage
                message={message.content}
                isStreaming={isStreaming}
                autoPlay={!isStreaming && displayedContent === message.content}
            >
                <div className="space-y-4">
                    {renderMarkdown(displayedContent)}

                    {/* Tool specific rendering */}
                    {message.metadata?.toolResult?.image_url && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-rp-iris/30 shadow-2xl shadow-rp-iris/10">
                            <Image
                                src={message.metadata.toolResult.image_url}
                                alt="Soul Portrait"
                                width={512}
                                height={512}
                                className="w-full h-auto"
                            />
                        </div>
                    )}

                    {message.metadata?.toolResult?.revealData && (
                        <SoulRevealCard data={message.metadata.toolResult.revealData as SoulRevealData} />
                    )}

                    {isVoicePrompt && (
                        <VoiceSelector
                            selectedId={selectedVoiceId}
                            onSelect={(vid) => {
                                // Progress the ritual by sending the selection back
                                setSelectedVoiceId(vid)
                                const voice = AVAILABLE_VOICES.find(v => v.id === vid)
                                const voiceName = voice?.name || vid
                                sendMessage(`I have chosen the frequency of ${voiceName} (${vid}).`, false)
                            }}
                        />
                    )}
                </div>
            </MotherMessage>
        )
    }

    // Role == tool shouldn't really be rendered in the chat flow directly usually, 
    // it's handled by the engine to provide context. 
    // But if we want to show generation status:
    if (message.role === 'tool') {
        const result = message.metadata?.toolResult
        if (message.content.includes('generate_soul_portrait')) {
            return <div className="px-8 py-4"><VisionLoading status="loading" /></div>
        }
        return null // Don't show raw tool results
    }

    return (
        <div
            className={`group flex animate-in fade-in slide-in-from-bottom-2 duration-300 gap-3 px-4 py-2 md:px-8 
                ${isUser ? 'justify-end' : 'justify-start'}
            `}
        >
            {/* Avatar - Only show for assistant */}
            {!isUser && (
                <div className="shrink-0 self-end mb-1">
                    {personaImage ? (
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
            )}

            {/* Glassmorphic Chat Bubble */}
            <div
                className={`
                    max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3
                    backdrop-blur-xl border shadow-lg
                    ${isUser
                        ? 'bg-rp-iris/20 border-rp-iris/30 rounded-br-sm'
                        : 'bg-rp-base/40 border-white/10 rounded-bl-sm'
                    }
                `}
            >
                {/* User Name - Show for user messages */}
                {isUser && (
                    <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-[10px] font-bold text-rp-iris uppercase tracking-widest">
                            {profile?.display_name || profile?.username || "You"}
                        </span>
                    </div>
                )}

                {/* Name - Only for assistant */}
                {!isUser && (

                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-rp-text/80">
                            {personaName || 'Remrin'}
                        </span>
                        {message.metadata?.provider && (
                            <span className="text-xs text-rp-muted/60">
                                via {message.metadata.provider}
                            </span>
                        )}
                    </div>
                )}

                {/* Message Content */}
                <div className="prose prose-sm prose-invert max-w-none">
                    {displayedContent ? (
                        <>
                            {renderMarkdown(displayedContent)}
                            {(isStreaming || currentIndexRef.current < fullContentRef.current.length) && (
                                <span className="inline-block w-2 h-4 ml-1 bg-rp-iris/50 animate-pulse align-middle" />
                            )}
                        </>
                    ) : isStreaming ? (
                        <ThinkingIndicator />
                    ) : null}
                </div>

                {/* Action buttons for assistant messages */}
                {!isUser && message.content && (
                    <div className="mt-2 flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs text-rp-muted hover:text-rp-text transition-colors"
                        >
                            {copied ? (
                                <>
                                    <IconCheck size={12} />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <IconCopy size={12} />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>

                        {/* Rewind Button */}
                        {onRewind && (
                            <button
                                onClick={onRewind}
                                className="flex items-center gap-1 text-xs text-rp-muted hover:text-rp-love transition-colors"
                                title="Rewind to here"
                            >
                                <IconRotate2 size={12} />
                                <span>Rewind</span>
                            </button>
                        )}

                        {/* TTS Button */}
                        <div className="h-3 w-px bg-rp-muted/20" /> {/* Divider */}
                        <StartSpeakingButton
                            text={message.content}
                            className="h-3 w-3 text-rp-muted hover:text-rp-iris hover:bg-transparent p-0"
                        />
                    </div>
                )}
            </div>

            {/* Avatar - Only show for user on right side */}
            {isUser && (
                <div className="shrink-0 self-end mb-1">
                    <Link href={profile ? `/profile/${profile.id}` : "#"}>
                        {profile?.image_url ? (
                            <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-rp-iris/40">
                                <Image
                                    src={profile.image_url}
                                    alt={profile.display_name || profile.username || "You"}
                                    fill
                                    sizes="32px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rp-iris/30 text-rp-iris border border-rp-iris/40">
                                <IconUser size={18} />
                            </div>
                        )}
                    </Link>
                </div>
            )}

        </div>
    )
})
