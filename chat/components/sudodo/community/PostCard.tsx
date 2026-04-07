'use client';

import React from 'react';
import Link from 'next/link';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content?: string;
    author_name: string;
    created_at: string;
    upvotes: number;
    flair?: string;
    community?: {
      name: string;
      icon: string;
      slug: string;
    };
  };
}

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function PostCard({ post }: PostCardProps) {
  const [votes, setVotes] = React.useState(post.upvotes || 0);
  const [userVote, setUserVote] = React.useState<number>(0);

  const handleVote = (val: number) => {
    if (userVote === val) {
      setUserVote(0);
      setVotes(prev => prev - val);
    } else {
      setVotes(prev => prev - userVote + val);
      setUserVote(val);
    }
  };

  return (
    <div className="post-card">
      <div className="vote-col">
        <div 
          className={`vote-btn up ${userVote === 1 ? 'active' : ''}`} 
          onClick={() => handleVote(1)}
        >▲</div>
        <div className={`vote-count ${userVote === 1 ? 'upvoted' : userVote === -1 ? 'downvoted' : ''}`}>
          {votes >= 1000 ? `${(votes/1000).toFixed(1)}k` : votes}
        </div>
        <div 
          className={`vote-btn down ${userVote === -1 ? 'active' : ''}`} 
          onClick={() => handleVote(-1)}
        >▼</div>
      </div>
      <div className="post-content">
        <div className="post-meta">
          {post.community && (
            <Link href={`/en/sudodo/distro/${post.community.slug}`} className="post-community">
              <span className="pc-icon">{post.community.icon}</span>{post.community.name}
            </Link>
          )}
          <span className="post-author">by <span>u/{post.author_name}</span></span>
          <span className="post-time">{getRelativeTime(post.created_at)}</span>
          {post.flair && (
            <span className={`post-flair flair-${post.flair}`}>{post.flair.toUpperCase()}</span>
          )}
        </div>
        
        <h3 className="post-title">{post.title}</h3>
        
        {post.content && (
          <div className="post-preview">
            {post.content.length > 280 ? `${post.content.slice(0, 280)}...` : post.content}
          </div>
        )}
        
        <div className="post-actions">
          <div className="post-action"><span className="pa-icon">💬</span> 0 Comments</div>
          <div className="post-action"><span className="pa-icon">🔗</span> Share</div>
          <div className="post-action"><span className="pa-icon">🔖</span> Save</div>
        </div>
      </div>
    </div>
  );
}
