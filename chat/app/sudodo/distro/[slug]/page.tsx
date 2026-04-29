'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import SidebarLeft from '@/components/sudodo/community/SidebarLeft';
import PostCard from '@/components/sudodo/community/PostCard';
import DodoSpecialist from '@/components/sudodo/DodoSpecialist';
import { useParams } from 'next/navigation';
import SubDodoIcon from '@/components/sudodo/community/SubDodoIcon';
import JoinButton from '@/components/sudodo/community/JoinButton';

export default function DistroCommunityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [distro, setDistro] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sudodo/communities?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) setDistro(data.data[0]);
        setIsLoading(false);
      });
  }, [slug]);

  if (isLoading) return <div className="loading">Syncing Sub-Dodo...</div>;
  if (!distro) return <div className="error">Community not found.</div>;

  const themeColor = '#3b82f6'; // Fallback

  return (
    <div className="sudododo-page">
      <TopBar />
      
      {/* BANNER */}
      <div className="distro-banner" style={{ overflow: 'hidden' }}>
        <div className="banner-bg" style={{ background: `radial-gradient(ellipse at 30% 50%, ${themeColor}40 0%, transparent 60%)` }}></div>
        <div className="banner-logo">
           <SubDodoIcon icon={distro.icon} name={distro.name} size={120} />
        </div>
        <div className="banner-content">
          <div className="distro-avatar" style={{ background: themeColor }}>
             <SubDodoIcon icon={distro.icon} name={distro.name} size={64} />
          </div>
          <div className="distro-meta">
            <div className="distro-name">{distro.name.replace('r/', '')}</div>
            <div className="distro-tagline">{distro.tagline || 'Linux Distribution'}</div>
            
            <JoinButton 
               communityId={distro.id} 
               userId="temp-user-id" // In prod, get from context/session
               initialCount={distro.members_count || 0} 
            />
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
            <div className="qs-item">
                <div className="qs-val">{(distro.members_count / 1000).toFixed(1)}k</div>
                <div className="qs-label">Members</div>
            </div>
            <div className="qs-item"><div className="qs-val">#{distro.rank_position || '??'}</div><div className="qs-label">Global Rank</div></div>
            <div className="qs-item"><div className="qs-val">4.7★</div><div className="qs-label">User Rating</div></div>
            <div className="qs-item"><div className="qs-val">24.04</div><div className="qs-label">Latest LTS</div></div>
          </div>

          {/* AI PANEL (THE DODO) */}
          <DodoSpecialist distroName={distro.name} themeColor={themeColor} />

          <PostCard post={{
            id: 'welcome-' + distro.id,
            title: `Welcome to the official ${distro.name.replace('r/', '')} community!`,
            content: `This is the primary hub for ${distro.name.replace('r/', '')} news, support, and technical discussion. Check the sidebar for official documentation and downloads.`,
            author_name: 'SudoDodo_System',
            created_at: new Date().toISOString(),
            upvotes: distro.members_count || 0,
            flair: 'announcement',
            community: {
              name: distro.name,
              icon: distro.icon,
              slug: distro.slug
            }
          }} />
        </main>

        <aside className="sidebar-right">
          <div className="widget">
            <div className="widget-header">⬇️ Get {distro.name.replace('r/', '')}</div>
            <div className="sw-body">
              <button className="dl-btn" style={{ background: themeColor, border: 'none', width: '100%', marginBottom: '8px', cursor: 'pointer' }}>⬇️ Download Official ISO</button>
              <div className="dl-meta">SHA256 verified · 2.9 GB · Latest Stable</div>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">{'// HARDWARE INFO'}</div>
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
