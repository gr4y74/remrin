'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import SidebarLeft from '@/components/sudodo/community/SidebarLeft';
import SidebarRight from '@/components/sudodo/community/SidebarRight';
import PostCard from '@/components/sudodo/community/PostCard';
import CreatePostModal from '@/components/sudodo/community/CreatePostModal';

export default function HomeFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/sudodo/feed?sortBy=hot')
      .then(res => res.json())
      .then(data => {
        setPosts(data.data || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Feed Fetch Error:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="sudododo-page">
      <TopBar />
      <div className="layout">
        <SidebarLeft />
        
        <main className="feed">
          <div className="feed-header">
            <div className="feed-title">Home Feed</div>
            <div className="sort-tabs">
              <div className="sort-tab active">🔥 Hot</div>
              <div className="sort-tab">✨ New</div>
              <div className="sort-tab">📈 Rising</div>
              <div className="sort-tab">🏆 Top</div>
            </div>
          </div>

          <div className="create-post" onClick={() => setIsPostModalOpen(true)}>
            <div className="cp-avatar">🐧</div>
            <div className="cp-input">Share technical expertise or ask a question...</div>
            <div className="cp-btns">
              <div className="cp-btn" title="Image">🖼️</div>
              <div className="cp-btn" title="Video">📺</div>
              <div className="cp-btn" title="Link">🔗</div>
            </div>
          </div>

          <CreatePostModal 
            isOpen={isPostModalOpen} 
            onClose={() => setIsPostModalOpen(false)} 
          />

          <div className="posts-list">
            {isLoading ? (
              <div className="feed-loading">
                <div className="spinner"></div>
                Syncing SudoDodo Intelligence...
              </div>
            ) : posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="empty-feed">
                <div className="empty-icon">🏜️</div>
                <h3>The desert is quiet.</h3>
                <p>Be the first to seed technical knowledge in this feed.</p>
                <button className="btn-primary" onClick={() => setIsPostModalOpen(true)}>Create First Post</button>
              </div>
            )}
          </div>
        </main>

        <SidebarRight />
      </div>
    </div>
  );
}
