'use client';

import React, { useState, useEffect } from 'react';

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  upvotes: number;
  created_at: string;
}

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/sudodo/posts/comments?postId=${postId}`);
      const data = await res.json();
      setComments(data.data || []);
    } catch (err) {
      console.error("Comments Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (parentId: string | null = null) => {
    if (!newComment.trim() && !parentId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sudodo/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          content: parentId ? 'REPLY: ' + newComment : newComment,
          author_name: 'Resident Penguin',
          parent_id: parentId
        })
      });

      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple tree builder for nesting (up to 3 levels)
  const renderTree = (parentId: string | null = null, depth = 0) => {
    return comments
      .filter(c => c.parent_id === parentId)
      .map(comment => (
        <div key={comment.id} className="comment-node" style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
          <div className="comment-card glass">
            <div className="comment-meta">
              <span className="c-author">u/{comment.author_name}</span>
              <span className="c-time">{new Date(comment.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="comment-text">{comment.content}</div>
            <div className="comment-actions">
              <span className="c-action">▲ {comment.upvotes}</span>
              <span className="c-action" onClick={() => setReplyTo(comment.id)}>Reply</span>
            </div>
            {replyTo === comment.id && (
              <div className="c-reply-box">
                <textarea 
                    className="c-input" 
                    placeholder="Type your reply..."
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                  className="c-submit" 
                  onClick={() => handleSubmit(comment.id)}
                  disabled={isSubmitting}
                >Post Reply</button>
              </div>
            )}
          </div>
          {renderTree(comment.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="comment-section">
      <div className="c-main-input glass">
        <textarea 
          placeholder="What are your thoughts?" 
          className="c-input"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="c-footer">
          <button 
            className="c-submit" 
            onClick={() => handleSubmit(null)}
            disabled={isSubmitting || !newComment.trim()}
          >Add Comment</button>
        </div>
      </div>

      <div className="comments-tree">
        {comments.length > 0 ? renderTree() : (
           <div className="no-comments">No discussion yet. Be the first to start the thread!</div>
        )}
      </div>

      <style jsx>{`
        .comment-section { margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 24px; }
        .c-main-input { padding: 16px; border-radius: 12px; margin-bottom: 32px; border: 1px solid #1e293b; }
        .c-input { width: 100%; min-height: 80px; background: #070a14; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 8px; font-size: 14px; outline: none; margin-bottom: 12px; resize: none; }
        .c-footer { display: flex; justify-content: flex-end; }
        .c-submit { background: #3b82f6; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; }
        .c-submit:disabled { opacity: 0.5; }

        .comment-node { margin-bottom: 16px; border-left: 1px solid #1e293b; padding-left: 12px; }
        .comment-card { padding: 12px 16px; border-radius: 10px; border: 1px solid #1e293b; background: rgba(255,255,255,0.02); }
        .comment-meta { font-size: 12px; margin-bottom: 8px; display: flex; gap: 10px; }
        .c-author { font-weight: 800; color: #94a3b8; }
        .c-time { color: #475569; }
        .comment-text { font-size: 14px; color: #e2e8f0; line-height: 1.5; margin-bottom: 8px; }
        .comment-actions { display: flex; gap: 16px; font-size: 12px; color: #475569; font-weight: 700; cursor: pointer; }
        .c-action:hover { color: #3b82f6; }
        
        .c-reply-box { margin-top: 12px; border-top: 1px solid #1e293b; padding-top: 12px; }
        .no-comments { text-align: center; color: #475569; font-size: 14px; padding: 40px; }
      `}</style>
    </div>
  );
}
