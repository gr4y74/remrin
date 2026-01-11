"use client"

import { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getUserAvatarUrl, getUserDisplayName, getUserProfileUrl } from '@/lib/user-profile-utils'
import Link from 'next/link'

interface Comment {
    id: string
    content: string
    created_at: string
    user: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    }
}

interface CommentsDrawerProps {
    momentId: string
    isOpen: boolean
    onClose: () => void
    onCommentCountUpdate?: (count: number) => void
    onCommentCountUpdate?: (count: number) => void
    currentUserProfile?: any | null
}

export function CommentsDrawer({
    momentId,
    isOpen,
    onClose,
    onCommentCountUpdate,
    currentUserProfile
}: CommentsDrawerProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Fetch comments when opened
    useEffect(() => {
        if (isOpen && momentId) {
            fetchComments()
        }
    }, [isOpen, momentId])

    const fetchComments = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/moments/${momentId}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.comments || [])
            }
        } catch (error) {
            console.error('Failed to fetch comments', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePostComment = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newComment.trim()) return

        setIsPosting(true)
        try {
            const res = await fetch(`/api/moments/${momentId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            })

            if (res.ok) {
                const data = await res.json()
                if (data.comment) {
                    setComments([data.comment, ...comments])
                    setNewComment('')
                    onCommentCountUpdate?.(comments.length + 1)
                }
            }
        } catch (error) {
            console.error('Failed to post comment', error)
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <SheetContent
                side="right"
                className="w-full sm:w-[380px] border-l border-white/5 bg-black/30 backdrop-blur-2xl p-0 flex flex-col z-[100] shadow-2xl"
                onInteractOutside={(e) => {
                    // Allow clicking outside without closing for better UX
                    // User can still close via X button or ESC key
                }}
            >
                <SheetHeader className="p-3 border-b border-white/5">
                    <SheetTitle className="text-white flex items-center gap-2 text-sm font-medium">
                        <MessageCircle className="h-4 w-4" />
                        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-3">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 text-rp-iris animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center text-white/40 py-12">
                            No comments yet. Be the first to say something!
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Link href={getUserProfileUrl(comment.user.username)}>
                                        <Avatar className="h-8 w-8 ring-1 ring-white/10 hover:ring-rp-rose transition-all cursor-pointer">
                                            <AvatarImage src={getUserAvatarUrl(comment.user as any)} />
                                            <AvatarFallback className="bg-rp-surface text-xs">
                                                {getUserDisplayName(comment.user as any).slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-baseline gap-2">
                                            <Link href={getUserProfileUrl(comment.user.username)}>
                                                <span className="text-sm font-semibold text-white/90 hover:text-rp-rose cursor-pointer transition-colors">
                                                    {getUserDisplayName(comment.user as any)}
                                                </span>
                                            </Link>
                                            <span className="text-xs text-white/40">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-md">
                    <form onSubmit={handlePostComment} className="relative flex items-center gap-2">
                        <Avatar className="h-7 w-7 shrink-0 border border-white/5">
                            <AvatarImage src={getUserAvatarUrl(currentUserProfile)} />
                            <AvatarFallback className="bg-rp-iris text-[9px]">
                                {getUserDisplayName(currentUserProfile).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full pr-10 focus-visible:ring-rp-iris text-sm h-9"
                            disabled={isPosting}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 h-7 w-7 hover:bg-transparent text-rp-iris disabled:opacity-50"
                            disabled={!newComment.trim() || isPosting}
                        >
                            {isPosting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
