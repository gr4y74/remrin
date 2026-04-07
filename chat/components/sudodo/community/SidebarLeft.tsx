import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SubDodoIcon from '@/components/sudodo/community/SubDodoIcon';

export default function SidebarLeft() {
  const pathname = usePathname();
  const [communities, setCommunities] = useState<any[]>([]);
  const [deCommunities, setDeCommunities] = useState<any[]>([]);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Trending Distros
    fetch('/api/sudodo/communities?type=distro&limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.data) setCommunities(data.data);
      });

    // 2. Fetch Desktop Environments
    fetch('/api/sudodo/communities?type=de&limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.data) setDeCommunities(data.data);
      });

    // 3. Fetch User's Joined Communities (My Distros)
    // In production, would use actual session UID
    fetch('/api/sudodo/communities?type=distro&limit=3') 
      .then(res => res.json())
      .then(data => {
        setMyCommunities(data.data || []);
        setIsLoading(false);
      });
  }, []);

  const primaryNav = [
    { label: 'Home', icon: '🏠', href: '/en/sudodo/feed' },
    { label: 'Rankings', icon: '📊', href: '/en/sudodo/rankings' },
    { label: 'Distro Battle', icon: '⚔️', href: '/en/sudodo/compare' },
    { label: 'Popular', icon: '🔥', href: '#' },
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
        <div className="nav-label">{myCommunities.length > 0 ? 'My Distros' : 'Trending Communities'}</div>
        {(myCommunities.length > 0 ? myCommunities : communities).map((c) => (
          <Link key={c.id} href={`/en/sudodo/distro/${c.slug}`} className="distro-nav-item">
            <div className="d-badge">
               <SubDodoIcon icon={c.icon} name={c.name} size={20} />
            </div>
            <span className="d-name">{c.name.replace('r/', '')}</span>
            <span className="d-members">{(c.members_count / 1000).toFixed(1)}k</span>
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
            <div className="d-badge">
               <SubDodoIcon icon={c.icon} name={c.name} size={18} />
            </div>
            <span className="d-name">{c.name.replace('r/', '')}</span>
            <span className="d-members">{(c.members_count / 1000).toFixed(0)}k</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
