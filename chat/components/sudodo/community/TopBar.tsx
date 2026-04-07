'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const pathname = usePathname();

  return (
    <div className="topbar">
      <Link href="/en/sudodo/feed" className="logo">
        <div className="logo-mark">🐧</div>
        Sudo<span>Dodo</span>
      </Link>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search wikis, manuals, distros, and posts..." />
      </div>

      <div className="topbar-right">
        <Link href="/en/sudodo/rankings" className={`tb-btn ${pathname?.includes('/rankings') ? 'tb-home' : 'tb-login'}`}>
          📊 Distro Rankings
        </Link>
        <button className="tb-btn tb-login">Log In</button>
        <button className="tb-btn tb-signup">Join Free</button>
      </div>
    </div>
  );
}
