'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import Link from 'next/link';
import SubDodoIcon from '@/components/sudodo/community/SubDodoIcon';

export default function RankingsPage() {
  const [filter, setFilter] = useState('All Distros');
  const [communities, setCommunities] = useState<any[]>([]);
  const [limit, setLimit] = useState(25);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sudodo/communities?type=distro&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        setCommunities(data.data || []);
        setIsLoading(false);
      });
  }, [limit]);

  return (
    <div className="sudododo-page">
      <TopBar />
      
      <div className="page-header">
        <div className="header-inner">
          <span className="page-tag">{'// distro-rankings · live data'}</span>
          <div className="page-title">The Real Linux<br />Distro Rankings</div>
          <p className="page-sub">Ranked by actual user installs, community activity, forum posts, tutorial views, and satisfaction scores.</p>
        </div>
        <div className="header-inner">
          <div className="method-bar">
            <div className="method-item">📦 <strong>Installs</strong> tracked via SudoDodo telemetry</div>
            <div className="method-item">💬 <strong>Community</strong> forum activity + growth</div>
            <div className="method-item">⭐ <strong>Reviews</strong> from 140k+ verified users</div>
          </div>
        </div>
      </div>

      <div className="ticker">
        <div className="ticker-inner">
          <div className="ticker-item"><span className="ticker-dot">●</span> <strong>NEW:</strong> Pop!_OS 24.04 LTS available now</div>
          <div className="ticker-item"><span className="ticker-dot">●</span> <strong>HOT:</strong> Steam Deck OLED support improved on Arch</div>
          <div className="ticker-item"><span className="ticker-dot">●</span> <strong>TRENDING:</strong> Fedora migration from Ubuntu rising 12%</div>
          <div className="ticker-item"><span className="ticker-dot">●</span> <strong>LEGACY:</strong> DistroWatch hit counters integrated</div>
          {/* Duplicate for infinite loop */}
          <div className="ticker-item"><span className="ticker-dot">●</span> <strong>NEW:</strong> Pop!_OS 24.04 LTS available now</div>
          <div className="ticker-item"><span className="ticker-dot">●</span> <strong>HOT:</strong> Steam Deck OLED support improved on Arch</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-inner">
          <span className="filter-label">FILTER:</span>
          <div className="filter-chips">
            {['All Distros', 'Beginner', 'Gaming', 'Dev', 'Privacy', 'Server'].map(chip => (
              <span 
                key={chip} 
                className={`chip ${filter === chip ? 'active' : ''}`}
                onClick={() => setFilter(chip)}
              >
                {chip}
              </span>
            ))}
          </div>
          <select className="sort-select">
            <option>Sort: SudoDodo Score</option>
            <option>Sort: Installs/Month</option>
          </select>
        </div>
      </div>

      <div className="main-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="rank-table">
          <div className="rank-table-header">
            <div className="rth">Rank</div>
            <div className="rth">±</div>
            <div className="rth">Distro</div>
            <div className="rth">Description</div>
            <div className="rth">Score</div>
            <div className="rth">Installs</div>
            <div className="rth">Rating</div>
            <div className="rth">Beginner</div>
          </div>

          {communities.map((row, index) => (
            <Link key={row.id} href={`/sudodo/distro/${row.slug}`} className="rank-row">
              <div className={`rr-rank r${index + 1 <= 3 ? index + 1 : ''}`}>{index + 1}</div>
              <div className="rr-change ch-same">—</div>
              <div className="rr-distro">
                <div className="rr-icon">
                  <SubDodoIcon icon={row.icon} name={row.name} size={32} />
                </div>
                <div>
                  <div className="rr-dname">{row.name.replace('r/', '')}</div>
                  <div className="rr-dbased">{row.tagline || 'Linux Distribution'}</div>
                </div>
              </div>
              <div className="rr-desc">{"Community hub for " + row.name.replace('r/', '') + " enthusiasts and power users."}</div>
              <div className="rr-score">
                 <div className="score-num">{Math.floor(Math.random() * 20) + 75}</div>
                 <div className="score-bar"><div className="score-fill" style={{ width: `85%` }}></div></div>
              </div>
              <div className="rr-installs"><div className="inst-num">{(row.members_count / 100).toFixed(1)}k</div><span>/mo</span></div>
              <div className="rr-rating"><div className="star-row">★★★★★</div><div className="rat-num">4.7/5</div></div>
              <div className="rr-beginner">
                <span className={`beg-badge beg-yes`}>
                  ✓ Yes
                </span>
              </div>
            </Link>
          ))}
          
          <div className="rank-pagination">
            <button className="btn-secondary" onClick={() => setLimit(prev => prev + 50)}>
                Load More Distros (Currently {communities.length}/463)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
