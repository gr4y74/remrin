'use client';

import React, { useState } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import SidebarLeft from '@/components/sudodo/community/SidebarLeft';
import PostCard from '@/components/sudodo/community/PostCard';
import DodoSpecialist from '@/components/sudodo/DodoSpecialist';
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
    <div className="sudododo-page">
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

          {/* AI PANEL (THE DODO) */}
          <DodoSpecialist distroName={distro.name} themeColor={distro.theme} />

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
            <div className="sw-body">
              <button className="dl-btn" style={{ background: distro.theme, border: 'none', width: '100%', marginBottom: '8px', cursor: 'pointer' }}>⬇️ Download {distro.name} ISO</button>
              <div className="dl-meta">SHA256 verified · 2.9 GB · Latest LTS</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">// HARDWARE INFO</div>
             <div className="sw-body">
                <div className="hw-signal">
                  <span className="hw-label">NVIDIA Support</span>
                  <span className="hw-val v-green">Excellent ★★★★★</span>
                </div>
                <div className="hw-signal">
                  <span className="hw-label">Min RAM</span>
                  <span className="hw-val">4 GB</span>
                </div>
                <div className="hw-signal">
                  <span className="hw-label">ThinkPad X1 Support</span>
                  <span className="hw-val v-green">Perfect ✓</span>
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
