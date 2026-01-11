'use client';

import { useState, useEffect } from 'react';
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

interface CommentSectionProps {
    postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const { profile } = useContext(RemrinContext);
    const { comments, isLoading, fetchComments, addComment, deleteComment } = useComments(postId);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await addComment(newComment);
            setNewComment('');
        } finally {
            setIsSubmitting(false);
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
                        value={newComment}
                        onValueChange={(val) => setNewComment(val)}
                        placeholder="Write a comment..."
                        className="w-full bg-rp-overlay border-rp-highlight-low rounded-xl px-4 py-2 text-sm focus:border-rp-rose transition-colors resize-none pr-10"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="absolute right-2 bottom-2 p-1 text-rp-rose hover:bg-rp-highlight-low rounded-full disabled:opacity-50 disabled:text-rp-muted"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onDelete={deleteComment}
                            onReply={addComment}
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
    onReply: (content: string, parentId: string) => Promise<any>;
}

function CommentItem({ comment, onDelete, onReply }: CommentItemProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const handleReplySubmit = async () => {
        if (!replyContent.trim() || isSubmittingReply) return;
        setIsSubmittingReply(true);
        try {
            await onReply(replyContent, comment.id);
            setReplyContent('');
            setIsReplying(false);
        } finally {
            setIsSubmittingReply(false);
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
                    <button className="flex items-center gap-1.5 text-xs text-rp-subtle hover:text-rp-love transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                        <span>Like</span>
                    </button>
                    {!comment.parent_comment_id && (
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
                        <TextareaAutosize
                            autoFocus
                            value={replyContent}
                            onValueChange={(val) => setReplyContent(val)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-rp-overlay border-rp-highlight-low rounded-xl px-3 py-1.5 text-xs focus:border-rp-iris transition-colors resize-none"
                        />
                        <Button
                            size="sm"
                            className="bg-rp-iris hover:bg-rp-iris/80 text-white rounded-xl h-8 px-3"
                            disabled={!replyContent.trim() || isSubmittingReply}
                            onClick={handleReplySubmit}
                        >
                            Reply
                        </Button>
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
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
