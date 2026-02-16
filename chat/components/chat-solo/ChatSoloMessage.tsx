"use client"

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { ChatMessageContent } from '@/lib/chat-engine/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useChatSolo } from './ChatSoloEngine'

interface ChatSoloMessageProps {
    message: ChatMessageContent
    isStreaming?: boolean
    statusLabel?: string
}

export const ChatSoloMessage = memo(function ChatSoloMessage({
    message,
    isStreaming = false
}: ChatSoloMessageProps) {
    const isUser = message.role === 'user'
    const { showThinking } = useChatSolo()
    const reasoning = message.metadata?.reasoning

    return (
        <div className={cn(
            "group w-full py-10 flex flex-col items-center animate-in fade-in duration-500 transition-colors border-b border-transparent hover:border-border/50",
            isUser ? "bg-transparent" : "bg-muted/10"
        )}>
            <div className="w-full max-w-2xl flex gap-8 px-4">
                {/* Avatar Column */}
                <div className="flex-shrink-0 pt-1">
                    {isUser ? (
                        <div className="w-8 h-8 rounded-full bg-[#5f8787] flex items-center justify-center text-[#121113] text-[10px] font-bold shadow-sm ring-1 ring-white/10">
                            U
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50 shadow-sm overflow-hidden">
                            <span className="text-[10px] font-bold text-muted-foreground">R</span>
                        </div>
                    )}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground/80 tracking-wide uppercase">
                            {isUser ? 'Pilot' : 'Rem'}
                        </span>
                        {message.timestamp && (
                            <span className="text-[10px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    <div className="text-base leading-[1.8] text-foreground font-serif selection:bg-primary/20">
                        {/* Inner Heart / Thinking Process */}
                        {showThinking && reasoning && (
                            <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden animate-in fade-in slide-in-from-top-1 duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 italic">Inner Heart</span>
                                </div>
                                <div className="text-xs leading-relaxed text-muted-foreground/80 font-sans italic whitespace-pre-wrap">
                                    {reasoning}
                                </div>
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <div className="w-8 h-8 rounded-full border border-primary animate-ping duration-[3000ms]" />
                                </div>
                            </div>
                        )}

                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline ? (
                                        <div className="relative group/code my-6 rounded-2xl overflow-hidden border border-border shadow-md">
                                            <div className="absolute right-3 top-3 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 bg-background/80 backdrop-blur-xl border border-border shadow-sm"
                                                    onClick={() => navigator.clipboard.writeText(String(children))}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            {match && (
                                                <div className="bg-muted px-4 py-2 border-b border-border flex items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{match[1]}</span>
                                                </div>
                                            )}
                                            <SyntaxHighlighter
                                                {...props}
                                                style={oneDark}
                                                language={match ? match[1] : 'text'}
                                                PreTag="div"
                                                className="!bg-[#121113] !p-6 !m-0 !text-sm !leading-relaxed"
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-medium text-primary font-mono" {...props}>
                                            {children}
                                        </code>
                                    )
                                },
                                p: ({ children }) => <p className="mb-6 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="mb-6 list-disc pl-6 space-y-3">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-6 list-decimal pl-6 space-y-3">{children}</ol>,
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/30 pl-6 italic text-muted-foreground my-6">{children}</blockquote>,
                            }}
                            className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:m-0 prose-pre:p-0"
                        >
                            {message.content}
                        </ReactMarkdown>
                        {isStreaming && (
                            <div className="flex items-center gap-1 mt-4 animate-in fade-in duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                            </div>
                        )}
                    </div>

                    {/* Message Actions */}
                    {!isUser && !isStreaming && (
                        <div className="flex items-center gap-1 mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <div className="w-[1px] h-4 bg-border mx-1" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">
                                <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})
