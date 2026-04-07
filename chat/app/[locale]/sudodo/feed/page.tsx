'use client';

import React from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import SidebarLeft from '@/components/sudodo/community/SidebarLeft';
import SidebarRight from '@/components/sudodo/community/SidebarRight';
import PostCard from '@/components/sudodo/community/PostCard';

const mockPosts: any[] = [
  {
    id: '1',
    community: { name: 'r/PopOS', icon: '🚀', slug: 'popos' },
    author: 'system76_official',
    time: '3h ago',
    pinned: true,
    flair: { label: '📖 Guide', type: 'guide' },
    title: 'The Complete Pop!_OS 24.04 Setup Guide for NVIDIA Users (2025 Edition)',
    preview: 'Covers driver installation, Steam + Proton setup, Wayland vs X11 for NVIDIA, performance tweaks, and the new COSMIC desktop migration path.',
    tags: ['nvidia', 'gaming', 'wayland', 'proton'],
    votes: '4.2k',
    comments: '342',
    awards: ['🥇', '✨', '💙']
  },
  {
    id: '2',
    community: { name: 'r/LinuxGaming', icon: '🎮', slug: 'gaming' },
    author: 'proton_enjoyer',
    time: '5h ago',
    flair: { label: '📰 News', type: 'news' },
    title: 'Valve just pushed Proton 9.0-4 — 47 newly playable games including previously broken anti-cheat titles.',
    preview: 'Full compatibility report inside. Notable additions: several major titles with Easy Anti-Cheat now working out of the box.',
    tags: ['proton', 'steam', 'valve', 'anti-cheat'],
    votes: '2.8k',
    comments: '891',
    awards: ['🎮', '✨']
  },
  {
    id: '3',
    community: { name: 'r/linux4noobs', icon: '🐧', slug: 'noobs' },
    author: 'TheLinuxExperiment',
    time: '8h ago',
    flair: { label: '📺 Tutorial', type: 'guide' },
    title: 'I switched 10 Windows power users to Linux for 30 days. Here\'s what actually broke and what surprised us all.',
    video: { source: 'YouTube', duration: '18:42' },
    tags: ['beginners', 'windows-migration'],
    votes: '1.9k',
    comments: '447'
  }
];

export default function HomeFeedPage() {
  const [posts, setPosts] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/sudodo/feed?sortBy=hot')
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          setPosts(data.data);
        } else {
          setPosts(mockPosts); // Fallback to mocks if DB is empty
        }
      })
      .catch(err => {
        console.error("Feed Fetch Error:", err);
        setPosts(mockPosts);
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

          <div className="create-post">
            <div className="cp-avatar">🐧</div>
            <div className="cp-input">Share something with the Linux community...</div>
            <div className="cp-btns">
              <div className="cp-btn" title="Image">🖼️</div>
              <div className="cp-btn" title="Video">📺</div>
              <div className="cp-btn" title="Link">🔗</div>
            </div>
          </div>

          <div className="posts-list">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="no-posts">
                <div className="loading-spinner"></div>
                Initializing SudoDodo Intelligence Feed...
              </div>
            )}
          </div>
        </main>

        <SidebarRight />
      </div>
    </div>
  );
}
