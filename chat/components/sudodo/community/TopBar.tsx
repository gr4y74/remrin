'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const pathname = usePathname();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/sudodo/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.data || []);
          setIsOpen(true);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="topbar">
      <Link href="/en/sudodo/feed" className="logo">
        <div className="logo-mark">🐧</div>
        Sudo<span>Dodo</span>
      </Link>

      <div className="search-wrapper">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search communities, wikis, desktops..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
          />
        </div>

        {isOpen && results.length > 0 && (
          <div className="search-dropdown">
            <div className="search-results">
              {results.map((r) => (
                <Link 
                    key={r.id} 
                    href={r.url} 
                    className="search-result-item"
                    onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                    }}
                >
                  <div className="sr-icon" style={{ background: `${r.color}20` }}>{r.icon}</div>
                  <div className="sr-info">
                    <div className="sr-title">{r.title}</div>
                    <div className="sr-subtitle">{r.subtitle}</div>
                  </div>
                  <div className="sr-type">{r.type}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {isOpen && (
            <div className="search-backdrop" onClick={() => setIsOpen(false)}></div>
        )}
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
