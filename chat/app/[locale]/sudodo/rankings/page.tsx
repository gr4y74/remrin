'use client';

import React, { useState } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import Link from 'next/link';

export default function RankingsPage() {
  const [filter, setFilter] = useState('All Distros');

  const rankingData = [
    { rank: 1, change: '—', icon: '🎯', name: 'Ubuntu', base: 'Debian · apt', desc: 'The most-used Linux distro. Massive community, LTS support, and the best hardware compatibility.', score: 97, installs: '2.1M', rating: '4.6', beginner: 'yes', tags: ['stable', 'lts'] },
    { rank: 2, change: '▲2', icon: '🔴', name: 'Fedora', base: 'RPM · dnf', desc: 'Red Hat\'s community distro. Ships the latest GNOME and kernel first. Perfect for developers.', score: 91, installs: '987k', rating: '4.5', beginner: 'mid', tags: ['cutting-edge', 'rpm'] },
    { rank: 3, change: '▲1', icon: '🚀', name: 'Pop!_OS', base: 'Ubuntu · apt', desc: 'System76\'s developer-focused Ubuntu derivative. Best NVIDIA experience. Tiling WM built in.', score: 89, installs: '743k', rating: '4.7', beginner: 'yes', tags: ['gaming', 'nvidia'] },
    { rank: 4, change: '▼1', icon: '🏔️', name: 'Arch Linux', base: 'Independent · pacman', desc: 'Rolling release. You build it yourself. Unparalleled control, massive AUR, and best documentation.', score: 87, installs: '621k', rating: '4.8', beginner: 'no', tags: ['rolling', 'aur'] },
  ];

  return (
    <div className="sudododo-page">
      <TopBar />
      
      <div className="page-header">
        <div className="header-inner">
          <span className="page-tag">// distro-rankings · live data</span>
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

          {rankingData.map((row) => (
            <Link key={row.name} href={`/en/sudodo/distro/${row.name.toLowerCase()}`} className="rank-row">
              <div className={`rr-rank r${row.rank <= 3 ? row.rank : ''}`}>{row.rank}</div>
              <div className={`rr-change ${row.change.includes('▲') ? 'ch-up' : row.change.includes('▼') ? 'ch-down' : 'ch-same'}`}>{row.change}</div>
              <div className="rr-distro">
                <div className="rr-icon">{row.icon}</div>
                <div>
                  <div className="rr-dname">{row.name}</div>
                  <div className="rr-dbased">{row.base}</div>
                </div>
              </div>
              <div className="rr-desc">{row.desc}</div>
              <div className="rr-score">
                 <div className="score-num">{row.score}</div>
                 <div className="score-bar"><div className="score-fill" style={{ width: `${row.score}%` }}></div></div>
              </div>
              <div className="rr-installs"><div className="inst-num">{row.installs}</div><span>/mo</span></div>
              <div className="rr-rating"><div className="star-row">★★★★★</div><div className="rat-num">{row.rating}/5</div></div>
              <div className="rr-beginner">
                <span className={`beg-badge ${row.beginner === 'yes' ? 'beg-yes' : row.beginner === 'mid' ? 'beg-mid' : 'beg-no'}`}>
                  {row.beginner === 'yes' ? '✓ Yes' : row.beginner === 'mid' ? '~ Mid' : '✗ No'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
