'use client';

import { useState, useEffect, useRef } from 'react';
import { PostComment } from '@/types/social';
import { useComments } from '@/hooks/feed/useComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TextareaAutosize } from '@/components/ui/textarea-autosize';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Reply, Trash2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserAvatarUrl, getUserDisplayName, getUserProfileUrl } from '@/lib/user-profile-utils';
import Link from 'next/link';
import { useContext } from 'react';
import { RemrinContext } from '@/context/context';
import { EmojiButton } from '@/components/ui/EmojiButton';
import { PickerItem } from '@/components/ui/UniversalPicker';
import { useEmojiInsertion } from '@/hooks/useEmojiInsertion';

interface CommentSectionProps {
    postId: string;
    onCommentCountChange?: (delta: number) => void;
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
    const { profile } = useContext(RemrinContext);
    const { comments, isLoading, fetchComments, addComment, deleteComment, toggleLike } = useComments(postId);

    const handleAddComment = async (content: string, parentId?: string, mentionedIds: string[] = []) => {
        const comment = await addComment(content, parentId, mentionedIds);
        if (comment) onCommentCountChange?.(1);
        return comment;
    };

    const handleDeleteComment = async (id: string) => {
        await deleteComment(id);
        onCommentCountChange?.(-1);
    };

    const [newComment, setNewComment] = useState('');
    const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const { insertEmoji } = useEmojiInsertion(commentInputRef, newComment, setNewComment);

    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionUsers, setMentionUsers] = useState<any[]>([]);
    const [showMentions, setShowMentions] = useState(false);

    useEffect(() => {
        const fetchMentionUsers = async () => {
            if (mentionSearch.length >= 2) {
                try {
                    const res = await fetch(`/api/username/search?q=${mentionSearch}`);
                    const data = await res.json();
                    setMentionUsers(data.users || []);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setMentionUsers([]);
            }
        };

        if (showMentions) {
            const timer = setTimeout(fetchMentionUsers, 300);
            return () => clearTimeout(timer);
        }
    }, [mentionSearch, showMentions]);

    const handleValueChange = (val: string) => {
        setNewComment(val);
        const cursorPosition = commentInputRef.current?.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ' || textBeforeCursor[lastAt - 1] === '\n')) {
            const query = textBeforeCursor.slice(lastAt + 1);
            if (!query.includes(' ')) {
                setMentionSearch(query);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (user: any) => {
        const cursorPosition = commentInputRef.current?.selectionStart || 0;
        const textBeforeCursor = newComment.slice(0, cursorPosition);
        const textAfterCursor = newComment.slice(cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        const newText = textBeforeCursor.slice(0, lastAt) + `@${user.username} ` + textAfterCursor;
        setNewComment(newText);
        setMentionedUserIds(prev => Array.from(new Set([...prev, user.id])));
        setShowMentions(false);
        commentInputRef.current?.focus();
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await handleAddComment(newComment, undefined, mentionedUserIds);
            setNewComment('');
            setMentionedUserIds([]);
            setShowMentions(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmojiSelect = (item: PickerItem) => {
        if (item.type === 'emoji') {
            insertEmoji(item.data);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="flex gap-3 items-start">
                <Avatar className="w-8 h-8 border border-rp-highlight-low">
                    <AvatarImage src={getUserAvatarUrl(profile)} />
                    <AvatarFallback className="bg-rp-overlay text-rp-subtle text-xs">
                        {getUserDisplayName(profile).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                    <TextareaAutosize
                        textareaRef={commentInputRef}
                        value={newComment}
                        onValueChange={handleValueChange}
                        placeholder="Write a comment..."
                        className="w-full bg-rp-overlay border-rp-highlight-low rounded-xl px-4 py-2 text-sm focus:border-rp-rose transition-colors resize-none pr-20"
                    />

                    {showMentions && mentionUsers.length > 0 && (
                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-rp-surface border border-rp-highlight-low rounded-xl shadow-xl overflow-hidden z-50">
                            {mentionUsers.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => insertMention(user)}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rp-highlight-low text-left transition-colors"
                                >
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="text-[10px]">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-rp-text leading-tight">{user.display_name || user.username}</span>
                                        <span className="text-[10px] text-rp-subtle leading-tight">@{user.username}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="absolute right-2 bottom-2 flex gap-1">
                        <EmojiButton
                            onSelect={handleEmojiSelect}
                            position="top"
                            theme="dark"
                            className="p-1 hover:bg-rp-highlight-low rounded-full"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="p-1 text-rp-rose hover:bg-rp-highlight-low rounded-full disabled:opacity-50 disabled:text-rp-muted"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onDelete={handleDeleteComment}
                            onReply={handleAddComment}
                            onToggleLike={toggleLike}
                            depth={0}
                        />
                    ))}
                </AnimatePresence>

                {comments.length === 0 && !isLoading && (
                    <p className="text-center text-sm text-rp-muted py-4">No comments yet. Be the first to join the conversation!</p>
                )}
            </div>
        </div>
    );
}

interface CommentItemProps {
    comment: PostComment;
    onDelete: (id: string) => void;
    onReply: (content: string, parentId: string, mentionedIds?: string[]) => Promise<any>;
    onToggleLike: (id: string) => void;
    depth: number;
}

function CommentItem({ comment, onDelete, onReply, onToggleLike, depth }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [replyMentionedIds, setReplyMentionedIds] = useState<string[]>([]);
    const [replyMentionSearch, setReplyMentionSearch] = useState('');
    const [replyMentionUsers, setReplyMentionUsers] = useState<any[]>([]);
    const [showReplyMentions, setShowReplyMentions] = useState(false);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);
    const { insertEmoji: insertReplyEmoji } = useEmojiInsertion(replyInputRef, replyContent, setReplyContent);

    useEffect(() => {
        const fetchMentionUsers = async () => {
            if (replyMentionSearch.length >= 2) {
                try {
                    const res = await fetch(`/api/username/search?q=${replyMentionSearch}`);
                    const data = await res.json();
                    setReplyMentionUsers(data.users || []);
                } catch (e) {
                    console.error(e);
                }
            } else {
                setReplyMentionUsers([]);
            }
        };

        if (showReplyMentions) {
            const timer = setTimeout(fetchMentionUsers, 300);
            return () => clearTimeout(timer);
        }
    }, [replyMentionSearch, showReplyMentions]);

    const handleReplyValueChange = (val: string) => {
        setReplyContent(val);
        const cursorPosition = replyInputRef.current?.selectionStart || 0;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ' || textBeforeCursor[lastAt - 1] === '\n')) {
            const query = textBeforeCursor.slice(lastAt + 1);
            if (!query.includes(' ')) {
                setReplyMentionSearch(query);
                setShowReplyMentions(true);
            } else {
                setShowReplyMentions(false);
            }
        } else {
            setShowReplyMentions(false);
        }
    };

    const insertReplyMention = (user: any) => {
        const cursorPosition = replyInputRef.current?.selectionStart || 0;
        const textBeforeCursor = replyContent.slice(0, cursorPosition);
        const textAfterCursor = replyContent.slice(cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        const newText = textBeforeCursor.slice(0, lastAt) + `@${user.username} ` + textAfterCursor;
        setReplyContent(newText);
        setReplyMentionedIds(prev => Array.from(new Set([...prev, user.id])));
        setShowReplyMentions(false);
        replyInputRef.current?.focus();
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim() || isSubmittingReply) return;
        setIsSubmittingReply(true);
        try {
            await onReply(replyContent, comment.id, replyMentionedIds);
            setReplyContent('');
            setReplyMentionedIds([]);
            setIsReplying(false);
            setShowReplyMentions(false);
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const handleReplyEmojiSelect = (item: PickerItem) => {
        if (item.type === 'emoji') {
            insertReplyEmoji(item.data);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex gap-3 group"
        >
            <Link href={getUserProfileUrl(comment.author?.username || '')}>
                <Avatar className="w-8 h-8 shrink-0 border border-rp-highlight-low hover:border-rp-rose transition-colors cursor-pointer">
                    <AvatarImage src={getUserAvatarUrl(comment.author)} />
                    <AvatarFallback className="bg-rp-overlay text-rp-subtle text-xs">
                        {getUserDisplayName(comment.author).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 space-y-2">
                <div className="bg-rp-overlay/50 rounded-2xl px-4 py-2 border border-rp-highlight-low">
                    <div className="flex justify-between items-start">
                        <Link href={getUserProfileUrl(comment.author?.username || '')}>
                            <span className="font-bold text-sm text-rp-text hover:text-rp-rose cursor-pointer transition-colors">
                                {getUserDisplayName(comment.author)}
                            </span>
                        </Link>
                        <span className="text-[10px] text-rp-subtle">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-rp-text mt-1 leading-normal">{comment.content}</p>
                </div>

                <div className="flex items-center gap-4 px-2">
                    <button
                        onClick={() => onToggleLike(comment.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${comment.user_liked ? 'text-rp-love' : 'text-rp-subtle hover:text-rp-love'}`}
                    >
                        <Heart className={`w-3.5 h-3.5 ${comment.user_liked ? 'fill-current' : ''}`} />
                        <span>{comment.likes_count || 0}</span>
                    </button>
                    {depth < 2 && (
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1.5 text-xs text-rp-subtle hover:text-rp-iris transition-colors"
                        >
                            <Reply className="w-3.5 h-3.5" />
                            <span>Reply</span>
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(comment.id)}
                        className="flex items-center gap-1.5 text-xs text-rp-subtle hover:text-rp-love transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                    </button>
                </div>

                {isReplying && (
                    <div className="flex gap-2 mt-2">
                        <div className="flex-1 relative">
                            <TextareaAutosize
                                textareaRef={replyInputRef}
                                value={replyContent}
                                onValueChange={handleReplyValueChange}
                                placeholder="Write a reply..."
                                className="w-full bg-rp-overlay border-rp-highlight-low rounded-xl px-4 py-2 text-sm focus:border-rp-rose transition-colors resize-none pr-20"
                            />

                            {showReplyMentions && replyMentionUsers.length > 0 && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-rp-surface border border-rp-highlight-low rounded-xl shadow-xl overflow-hidden z-50">
                                    {replyMentionUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => insertReplyMention(user)}
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rp-highlight-low text-left transition-colors"
                                        >
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback className="text-[10px]">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-rp-text leading-tight">{user.display_name || user.username}</span>
                                                <span className="text-[10px] text-rp-subtle leading-tight">@{user.username}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="absolute right-2 bottom-2 flex gap-1">
                                <EmojiButton
                                    onSelect={handleReplyEmojiSelect}
                                    position="top"
                                    theme="dark"
                                    className="p-1 hover:bg-rp-highlight-low rounded-full"
                                />
                                <button
                                    onClick={handleReplySubmit}
                                    disabled={!replyContent.trim() || isSubmittingReply}
                                    className="p-1 text-rp-rose hover:bg-rp-highlight-low rounded-full disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-4 pt-2 border-l-2 border-rp-highlight-low ml-1 pl-4">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onDelete={onDelete}
                                onReply={onReply}
                                onToggleLike={onToggleLike}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

