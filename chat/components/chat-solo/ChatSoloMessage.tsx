"use client"

import React, { memo, useState } from 'react'
import { MarkdownRenderer } from '@/components/rem/MarkdownRenderer'
import { MessageActions } from '@/components/rem/MessageActions'
import { ChatMessageContent } from '@/lib/chat-engine/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useChatSolo } from './ChatSoloEngine'
import { useAuth } from '@/hooks/useAuth'
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile'

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
    const { user } = useAuth()
    const { profile } = useUnifiedProfile(user?.id)
    const { isGenerating, isThinking, showThinking, toggleBookmark, bookmarks, saveFeedback, regenerateMessage, sendMessage, editMessage } = useChatSolo()
    const reasoning = message.metadata?.reasoning

    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(message.content)

    const isBookmarked = bookmarks.some(b => b.message_id === message.id)
    const feedback = message.metadata?.feedback as 'like' | 'dislike' | null

    const isLastAssistantMessage = !isUser && isGenerating && message.content === ''

    const handleEditSave = () => {
        if (editContent.trim() && editContent !== message.content) {
            setIsEditing(false)
            if (message.id) {
                editMessage(message.id, editContent)
            } else {
                // Fallback for unsynced messages: re-send
                sendMessage(editContent)
            }
        } else {
            setIsEditing(false)
        }
    }

    return (
        <div className={cn(
            "group w-full py-10 flex flex-col items-center animate-in fade-in duration-500 transition-colors border-b border-transparent",
            isUser ? "bg-transparent" : "bg-muted/10",
            !isUser && isStreaming && "cursor-wait"
        )}>
            <div className="w-full max-w-2xl flex gap-8 px-4 relative">
                {/* Avatar Column */}
                <div className="flex-shrink-0 pt-1">
                    {isUser ? (
                        <div className="w-8 h-8 rounded-full bg-[#5f8787] flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-1 ring-foreground/10">
                            {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    ) : (
                        <div className={cn(
                            "w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-transparent shadow-sm overflow-hidden",
                            isLastAssistantMessage && "animate-pulse shadow-primary/20 ring-2 ring-primary/20"
                        )}>
                            <span className="text-[10px] font-bold text-muted-foreground">R</span>
                        </div>
                    )}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground/80 tracking-wide uppercase font-outfit">
                            {isUser ? profile?.display_name || 'Pilot' : 'Rem'}
                        </span>
                        {message.timestamp && (
                            <span className="text-[10px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {!isUser && isGenerating && (
                            <span className="text-[10px] text-primary/60 font-medium animate-pulse uppercase tracking-widest font-outfit">
                                {isThinking ? "Thinking..." : "Responding..."}
                            </span>
                        )}
                    </div>

                    <div className={cn(
                        "text-base leading-[1.8] text-foreground transition-all duration-300",
                        isUser ? "font-serif" : "font-sans font-[450]" // Claude inspired response weight
                    )}>
                        {/* Inner Heart / Thinking Process */}
                        {showThinking && reasoning && (
                            <div className="mb-8 p-5 rounded-2xl bg-muted/20 border border-border/40 relative overflow-hidden animate-in fade-in slide-in-from-top-1 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rp-iris/60 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground italic font-outfit">Deep Reasoning</span>
                                </div>
                                <div className="text-[13px] leading-relaxed text-muted-foreground/90 font-sans italic whitespace-pre-wrap">
                                    {reasoning}
                                </div>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    title="Edit message"
                                    placeholder="Revise your prompt..."
                                    className="w-full bg-muted/40 border border-border/60 rounded-xl p-4 text-[15px] font-serif focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:outline-none min-h-[100px] resize-none"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl text-xs">Cancel</Button>
                                    <Button variant="secondary" size="sm" onClick={handleEditSave} className="rounded-xl text-xs px-4">Save & Submit</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {isLastAssistantMessage && isThinking ? (
                                    <div className="py-2 flex items-center gap-2 text-muted-foreground/60 thinking-pulse">
                                        <span className="text-[13px] font-serif italic">Rem is gathering thoughts...</span>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-primary/30 animate-pulse [animation-duration:1s]" />
                                            <div className="w-1 h-1 rounded-full bg-primary/30 animate-pulse [animation-duration:1s] [animation-delay:0.2s]" />
                                            <div className="w-1 h-1 rounded-full bg-primary/30 animate-pulse [animation-duration:1s] [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                ) : (
                                    <MarkdownRenderer 
                                        content={message.content} 
                                        className={cn(isStreaming && "streaming")} 
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <MessageActions
                        role={isUser ? 'user' : 'assistant'}
                        content={message.content}
                        messageId={message.id}
                        feedback={feedback}
                        isBookmarked={isBookmarked}
                        isStreaming={isStreaming}
                        onCopy={() => navigator.clipboard.writeText(message.content)}
                        onLike={() => message.id && saveFeedback(message.id, feedback === 'like' ? null : 'like')}
                        onDislike={() => message.id && saveFeedback(message.id, feedback === 'dislike' ? null : 'dislike')}
                        onRegenerate={() => message.id && regenerateMessage(message.id)}
                        onBookmark={() => toggleBookmark(message)}
                        onEdit={() => setIsEditing(true)}
                    />
                </div>
            </div>
        </div>
    )
})
