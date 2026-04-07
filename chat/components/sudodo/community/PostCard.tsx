'use client';

import React from 'react';
import Link from 'next/link';

interface PostCardProps {
  post: {
    id: string;
    community: { name: string; icon: string; slug: string };
    author: string;
    time: string;
    flair?: { label: string; type: 'guide' | 'help' | 'news' | 'showcase' | 'discussion' };
    pinned?: boolean;
    title: string;
    preview?: string;
    image?: string;
    video?: { source: string; duration: string };
    tags?: string[];
    votes: string;
    comments: string;
    awards?: string[];
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="post-card">
      <div className="vote-col">
        <div className="vote-btn up">▲</div>
        <div className="vote-count">{post.votes}</div>
        <div className="vote-btn down">▼</div>
      </div>
      <div className="post-content">
        {post.pinned && <div className="pinned-indicator">📌 Pinned · Community Guide</div>}
        <div className="post-meta">
          <Link href={`/en/sudodo/distro/${post.community.slug}`} className="post-community">
            <span className="pc-icon">{post.community.icon}</span>{post.community.name}
          </Link>
          <span className="post-author">by <span>u/{post.author}</span></span>
          <span className="post-time">{post.time}</span>
          {post.flair && (
            <span className={`post-flair flair-${post.flair.type}`}>{post.flair.label}</span>
          )}
        </div>
        
        <h3 className="post-title">{post.title}</h3>
        
        {post.preview && <div className="post-preview">{post.preview}</div>}
        
        {post.image && (
          <div style={{ background: 'linear-gradient(135deg,#1a0a2e,#0a1a2e,#0a2e1a)', borderRadius: '8px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', fontSize: '48px', cursor: 'pointer' }}>
            🖥️
          </div>
        )}

        {post.video && (
          <div className="post-video-thumb">
            <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg,#1a2135,#0f1a2e)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ fontSize: '60px', opacity: 0.3 }}>🐧</span>
              <div className="play-btn">▶</div>
              <div className="video-source">{post.video.source} · {post.video.duration}</div>
            </div>
          </div>
        )}

        <div className="post-tags">
          {post.tags?.map(tag => <span key={tag} className="post-tag">{tag}</span>)}
        </div>

        <div className="post-actions">
          <div className="post-action"><span className="pa-icon">💬</span> {post.comments} Comments</div>
          <div className="post-action"><span className="pa-icon">🔗</span> Share</div>
          <div className="post-action"><span className="pa-icon">🔖</span> Save</div>
          {post.awards && (
             <div className="awards">
               {post.awards.map((a, i) => <span key={i} className="award">{a}</span>)}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
