'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLeft() {
  const pathname = usePathname();

  const primaryNav = [
    { label: 'Home', icon: '🏠', href: '/en/sudodo/feed' },
    { label: 'Popular', icon: '🔥', href: '#' },
    { label: 'New', icon: '✨', href: '#' },
    { label: 'Tutorials', icon: '📺', href: '#' },
    { label: 'Rankings', icon: '📊', href: '/en/sudodo/rankings' },
    { label: 'AI Assistant', icon: '🤖', href: '#' },
  ];

  const communities = [
    { label: 'r/PopOS', icon: '🚀', color: 'rgba(14,165,233,0.15)', members: '84k', slug: 'popos' },
    { label: 'r/Fedora', icon: '🔴', color: 'rgba(249,115,22,0.15)', members: '127k', slug: 'fedora' },
    { label: 'r/LinuxMint', icon: '🌿', color: 'rgba(34,197,94,0.15)', members: '96k', slug: 'mint' },
    { label: 'r/archlinux', icon: '🏔️', color: 'rgba(167,139,250,0.15)', members: '211k', slug: 'arch' },
    { label: 'r/debian', icon: '🖤', color: 'rgba(239,68,68,0.15)', members: '73k', slug: 'debian' },
  ];

  return (
    <aside className="sidebar-left">
      <div className="nav-section">
        {primaryNav.map((item) => (
          <Link 
            key={item.label} 
            href={item.href} 
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span> {item.label}
          </Link>
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-label">Your Communities</div>
        {communities.map((c) => (
          <Link key={c.label} href={`/en/sudodo/distro/${c.slug}`} className="distro-nav-item">
            <div className="d-badge" style={{ background: c.color }}>{c.icon}</div>
            {c.label}
            <span className="d-members">{c.members}</span>
          </Link>
        ))}
      </div>

      {/* Simplified Desktop Environments & Topics sections for mock */}
      <div className="nav-section">
        <div className="nav-label">Desktop Environments</div>
        <Link href="#" className="distro-nav-item">
          <div className="d-badge" style={{ background: 'rgba(14,165,233,0.12)' }}>🌀</div>
          r/GNOME <span className="d-members">55k</span>
        </Link>
        <Link href="#" className="distro-nav-item">
          <div className="d-badge" style={{ background: 'rgba(14,165,233,0.12)' }}>🖼️</div>
          r/KDE <span className="d-members">89k</span>
        </Link>
      </div>
    </aside>
  );
}
