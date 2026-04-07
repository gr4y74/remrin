'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarLeft() {
  const pathname = usePathname();
  const [communities, setCommunities] = React.useState<any[]>([]);
  const [deCommunities, setDeCommunities] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch regular distros
    fetch('/api/sudodo/communities?type=distro')
      .then(res => res.json())
      .then(data => {
        if (data.data) setCommunities(data.data);
      });

    // Fetch Desktop Environments
    fetch('/api/sudodo/communities?type=de')
      .then(res => res.json())
      .then(data => {
        if (data.data) setDeCommunities(data.data);
      });
  }, []);

  const primaryNav = [
    { label: 'Home', icon: '🏠', href: '/en/sudodo/feed' },
    { label: 'Popular', icon: '🔥', href: '#' },
    { label: 'New', icon: '✨', href: '#' },
    { label: 'Rankings', icon: '📊', href: '/en/sudodo/rankings' },
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
        <div className="nav-label">Trending Communities</div>
        {communities.map((c) => (
          <Link key={c.id} href={`/en/sudodo/distro/${c.slug}`} className="distro-nav-item">
            <div className="d-badge" style={{ background: `${c.theme_color}25` }}>{c.icon}</div>
            {c.name}
            <span className="d-members">{(c.members_count / 1000).toFixed(0)}k</span>
          </Link>
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-label">Knowledge Base</div>
        <Link href="#" className="distro-nav-item">
          <div className="d-badge" style={{ background: 'rgba(59,130,246,0.1)' }}>🌱</div>
          Beginner Paths <span className="d-members">Journey</span>
        </Link>
        <Link href="#" className="distro-nav-item">
          <div className="d-badge" style={{ background: 'rgba(139,92,246,0.1)' }}>📚</div>
          Expert Wikis <span className="d-members">Arch/Wiki</span>
        </Link>
        <Link href="#" className="distro-nav-item">
          <div className="d-badge" style={{ background: 'rgba(16,185,129,0.1)' }}>🛡️</div>
          Admin/Security <span className="d-members">nixCraft</span>
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-label">Desktop Environments</div>
        {deCommunities.map((c) => (
          <Link key={c.id} href={`/en/sudodo/distro/${c.slug}`} className="distro-nav-item">
            <div className="d-badge" style={{ background: `${c.theme_color}25` }}>{c.icon}</div>
            {c.name}
            <span className="d-members">{(c.members_count / 1000).toFixed(0)}k</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
