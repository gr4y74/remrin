'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TopBar from '@/components/sudodo/community/TopBar';
import SidebarLeft from '@/components/sudodo/community/SidebarLeft';
import SidebarRight from '@/components/sudodo/community/SidebarRight';
import CommentSection from '@/components/sudodo/community/CommentSection';
import Link from 'next/link';

export default function PostDetailPage() {
  const { id, slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch specifically this post + its community
    fetch('/api/sudodo/feed?sortBy=latest') // Simplified for now, in prod use fetchById
      .then(res => res.json())
      .then(data => {
        const found = data.data?.find((p: any) => p.id === id);
        setPost(found);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) return <div className="loading">Initializing SudoDodo Conversation...</div>;
  if (!post) return <div className="error">Post not found in the SudoDodo archive.</div>;

  return (
    <div className="sudododo-page">
      <TopBar />
      <div className="layout">
        <SidebarLeft />
        
        <main className="feed thread-view">
          <div className="thread-wrapper glass">
            <div className="thread-meta">
              <Link href={`/en/sudodo/distro/${slug}`} className="post-community">
                <span className="pc-icon">{post.community?.icon || '🐧'}</span>
                {post.community?.name || `r/${slug}`}
              </Link>
              <span className="post-author">Posted by <span>u/{post.author_name}</span></span>
              <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>

            <h1 className="thread-title">{post.title}</h1>
            
            {post.flair && (
              <span className={`post-flair flair-${post.flair}`}>{post.flair.toUpperCase()}</span>
            )}

            <div className="thread-content">
              {post.content}
            </div>

            <div className="thread-actions">
              <div className="t-action">▲ {post.upvotes} Upvotes</div>
              <div className="t-action">💬 {0} Comments</div>
              <div className="t-action">🔗 Share</div>
              <div className="t-action">🔖 Save</div>
            </div>

            {/* INTEGRATED COMMENT SECTION */}
            <CommentSection postId={post.id} />
          </div>
        </main>

        <SidebarRight />
      </div>

      <style jsx>{`
        .thread-view { padding: 20px 16px; }
        .thread-wrapper { background: #0c101c; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
        .thread-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-size: 13px; color: #475569; }
        .post-community { display: flex; align-items: center; gap: 6px; font-weight: 800; color: #3b82f6; text-decoration: none; }
        .thread-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; margin-bottom: 20px; line-height: 1.2; color: #fff; }
        .thread-content { font-size: 16px; line-height: 1.8; color: #e2e8f0; margin-bottom: 32px; white-space: pre-wrap; }
        .thread-actions { display: flex; gap: 24px; padding: 16px 0; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b; font-size: 14px; font-weight: 700; color: #94a3b8; }
        .t-action { cursor: pointer; }
        .t-action:hover { color: #3b82f6; }
      `}</style>
    </div>
  );
}
