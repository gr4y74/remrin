"use client"

import React, { useState } from 'react'
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Pencil, Check, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
    role: 'user' | 'assistant'
    content: string
    messageId?: string
    feedback?: 'like' | 'dislike' | null
    isBookmarked?: boolean
    isStreaming?: boolean
    onCopy: () => void
    onLike?: () => void
    onDislike?: () => void
    onRegenerate?: () => void
    onEdit?: () => void
    onBookmark?: () => void
}

/**
 * Claude-inspired Floating Message Action Bar
 * Job 4 of Rem Cockpit Upgrade
 */
export const MessageActions: React.FC<MessageActionsProps> = ({
    role,
    content,
    messageId,
    feedback,
    isBookmarked,
    isStreaming,
    onCopy,
    onLike,
    onDislike,
    onRegenerate,
    onEdit,
    onBookmark
}) => {
    const [justCopied, setJustCopied] = useState(false)

    if (isStreaming) return null

    const isAssistant = role === 'assistant'

    const handleCopy = () => {
        onCopy()
        setJustCopied(true)
        setTimeout(() => setJustCopied(false), 2000)
    }

    return (
        <div className={cn(
            "flex items-center gap-1 mt-6 transition-all duration-300",
            "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
        )}>
            {/* Copy Action */}
            <ActionButton 
                onClick={handleCopy} 
                icon={justCopied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />} 
                title="Copy to clipboard" 
            />

            {isAssistant ? (
                <>
                    <div className="w-[1px] h-4 bg-border/40 mx-1" />
                    
                    <ActionButton 
                        onClick={onLike} 
                        icon={<ThumbsUp className={cn("h-4 w-4", feedback === 'like' && "fill-current")} />} 
                        active={feedback === 'like'}
                        disabled={!messageId}
                        title="Good response" 
                    />
                    
                    <ActionButton 
                        onClick={onDislike} 
                        icon={<ThumbsDown className={cn("h-4 w-4", feedback === 'dislike' && "fill-current")} />} 
                        active={feedback === 'dislike'}
                        disabled={!messageId}
                        title="Bad response" 
                    />

                    <ActionButton 
                        onClick={onRegenerate} 
                        icon={<RotateCcw className="h-4 w-4" />} 
                        disabled={!messageId}
                        title="Regenerate response" 
                    />
                </>
            ) : (
                <>
                    <div className="w-[1px] h-4 bg-border/40 mx-1" />
                    <ActionButton 
                        onClick={onEdit} 
                        icon={<Pencil className="h-4 w-4" />} 
                        title="Edit message" 
                    />
                </>
            )}

            {/* Bookmark Action (optional but included in spec) */}
            {onBookmark && (
                <ActionButton 
                    onClick={onBookmark} 
                    icon={<Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />} 
                    active={isBookmarked}
                    disabled={!messageId}
                    title="Bookmark" 
                />
            )}
        </div>
    )
}

const ActionButton = ({ onClick, icon, title, active = false, disabled = false }: any) => (
    <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn(
            "h-8 w-8 rounded-xl transition-all",
            active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
    >
        {icon}
    </Button>
)
