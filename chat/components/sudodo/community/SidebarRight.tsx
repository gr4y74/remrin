'use client';

import React from 'react';
import Link from 'next/link';

export default function SidebarRight() {
  return (
    <aside className="sidebar-right">
      {/* AI ASSISTANT */}
      <div className="widget ai-widget">
        <div className="widget-header">🤖 AI Linux Assistant</div>
        <div className="ai-chat-preview">
          <div className="ai-msg">Ask me anything — distro recommendations, package issues, config help, or &quot;why is my WiFi broken.&quot; I&apos;m trained specifically on Linux. No hallucinations. 🐧</div>
          <div className="ai-input-row">
            <input className="ai-input" type="text" placeholder="Ask a Linux question..." />
            <button className="ai-send">→</button>
          </div>
        </div>
      </div>

      {/* LIVE DISTRO RANKINGS */}
      <div className="widget">
        <div className="widget-header">
          📊 Live Rankings
          <Link href="/en/sudodo/rankings" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace" }}>
            View All →
          </Link>
        </div>
        {[
          { rank: 1, icon: '🎯', name: 'Ubuntu', meta: '2.1M installs/mo', change: '—', status: 'same' },
          { rank: 2, icon: '🔴', name: 'Fedora', meta: '987k installs/mo', change: '▲2', status: 'up' },
          { rank: 3, icon: '🚀', name: 'Pop!_OS', meta: '743k installs/mo', change: '▲1', status: 'up' },
          { rank: 4, icon: '🏔️', name: 'Arch Linux', meta: '621k installs/mo', change: '▼1', status: 'down' },
        ].map((item) => (
          <Link key={item.name} href={`/en/sudodo/distro/${item.name.toLowerCase()}`} className="trending-item">
            <div className={`tr-rank ${item.rank <= 3 ? 'top' : ''}`}>{item.rank}</div>
            <div className="tr-icon">{item.icon}</div>
            <div className="tr-info">
              <div className="tr-name">{item.name}</div>
              <div className="tr-meta">{item.meta}</div>
            </div>
            <div className={`tr-change ${item.status === 'up' ? 'tr-up' : item.status === 'down' ? 'tr-down' : 'tr-same'}`}>
              {item.change}
            </div>
          </Link>
        ))}
      </div>

      {/* STATS WIDGET */}
      <div className="widget">
        <div className="widget-header"><div className="online-dot"></div> Live Stats</div>
        <div className="stats-grid">
          <div className="stat-box"><div className="stat-num">4.2k</div><div className="stat-label">Online Now</div></div>
          <div className="stat-box"><div className="stat-num">1.8M</div><div className="stat-label">Members</div></div>
        </div>
      </div>
    </aside>
  );
}
