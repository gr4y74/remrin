'use client';

import React, { useState } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import SidebarLeft from '@/components/sudodo/community/SidebarLeft';
import PostCard from '@/components/sudodo/community/PostCard';
import { useParams } from 'next/navigation';

export default function DistroCommunityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [aiInput, setAiInput] = useState('');

  // Map slugs to display names for mock purposes
  const distroMap: Record<string, any> = {
    'popos': { name: 'Pop!_OS', icon: '🚀', theme: '#48a999', tagline: 'The Linux distro that gets out of your way — built by System76' },
    'fedora': { name: 'Fedora', icon: '🔴', theme: '#3c2fb5', tagline: 'Cutting-edge. Pure. GNOME.' },
    'arch': { name: 'Arch Linux', icon: '🏔️', theme: '#1793d1', tagline: 'A simple, lightweight distribution' },
    'debian': { name: 'Debian', icon: '🖤', theme: '#d70a53', tagline: 'The Universal Operating System' },
    'ubuntu': { name: 'Ubuntu', icon: '🎯', theme: '#dd4814', tagline: 'Linux for human beings' },
  };

  const distro = distroMap[slug] || distroMap['ubuntu'];

  return (
    <div className="tuxhub-page">
      <TopBar />
      
      {/* BANNER */}
      <div className="distro-banner" style={{ overflow: 'hidden' }}>
        <div className="banner-bg" style={{ background: `radial-gradient(ellipse at 30% 50%, ${distro.theme}40 0%, transparent 60%)` }}></div>
        <div className="banner-logo">{distro.icon}</div>
        <div className="banner-content">
          <div className="distro-avatar" style={{ background: distro.theme }}>{distro.icon}</div>
          <div className="distro-meta">
            <div className="distro-name">{distro.name}</div>
            <div className="distro-tagline">{distro.tagline}</div>
          </div>
        </div>
      </div>

      <div className="distro-nav">
        <div className="nav-tabs">
          <span className="nav-tab active">🏠 Overview</span>
          <span className="nav-tab">💬 Community</span>
          <span className="nav-tab">📺 Tutorials</span>
          <span className="nav-tab">📖 Wiki</span>
        </div>
      </div>

      <div className="layout">
        <main>
          {/* QUICK STATS */}
          <div className="quick-stats">
            <div className="qs-item"><div className="qs-val">84k</div><div className="qs-label">Members</div></div>
            <div className="qs-item"><div className="qs-val">#3</div><div className="qs-label">Global Rank</div></div>
            <div className="qs-item"><div className="qs-val">4.7★</div><div className="qs-label">User Rating</div></div>
            <div className="qs-item"><div className="qs-val">24.04</div><div className="qs-label">Latest LTS</div></div>
          </div>

          {/* AI PANEL */}
          <div className="ai-panel" style={{ border: `1px solid ${distro.theme}40` }}>
            <div className="ai-header">
              🤖 {distro.name} AI Assistant
              <span className="ai-badge" style={{ background: `${distro.theme}20`, color: distro.theme }}>{distro.name} Expert</span>
            </div>
            <div className="ai-messages">
              <div className="ai-msg-bot" style={{ borderLeft: `2px solid ${distro.theme}` }}>
                Hey! I&apos;m your <strong>{distro.name} specialist</strong>. Ask me anything about installation, drivers, or specific configuration. 🐧
              </div>
            </div>
            <div className="ai-input-area">
              <div className="ai-input-row">
                <input 
                  className="ai-input" 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder={`Ask anything about ${distro.name}...`} 
                />
                <button className="ai-send" style={{ background: distro.theme }}>→</button>
              </div>
            </div>
          </div>

          <PostCard post={{
            id: 'x',
            community: { name: `r/${distro.name.replace('!_OS','OS').replace(' ','')}`, icon: distro.icon, slug },
            author: 'linux_fan',
            time: '12h ago',
            title: `Why ${distro.name} is my daily driver in 2025`,
            preview: 'I have tried almost every major distro over the last decade, but I keep coming back here...',
            votes: '1.2k',
            comments: '89',
            flair: { label: '💬 Discussion', type: 'discussion' }
          }} />
        </main>

        <aside className="sidebar-right">
          <div className="widget">
            <div className="widget-header">⬇️ Get {distro.name}</div>
            <div className="sw-body" style={{ padding: '16px' }}>
              <button className="dl-btn" style={{ background: distro.theme, border: 'none', width: '100%', marginBottom: '8px', cursor: 'pointer' }}>⬇️ Download ISO</button>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>SHA256 verified · 2.9 GB</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">// HARDWARE INFO</div>
            <div className="sw-body" style={{ padding: '16px' }}>
               <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <span style={{ color: 'var(--text2)' }}>NVIDIA Support</span>
                 <span style={{ color: 'var(--green)' }}>Excellent ★★★★★</span>
               </div>
               <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text2)' }}>Min RAM</span>
                 <span style={{ color: 'var(--text)' }}>4 GB</span>
               </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
