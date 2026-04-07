import React from 'react';

export default function DistroShowcase() {
  const distros = [
    { icon: '🎯', name: 'Ubuntu', rank: '#1 Popular' },
    { icon: '🏔️', name: 'Arch', rank: '#2 Popular' },
    { icon: '🎩', name: 'Fedora', rank: '#3 Popular' },
    { icon: '🖤', name: 'Debian', rank: '#4 Popular' },
    { icon: '🌿', name: 'Mint', rank: '#5 Popular' },
    { icon: '🚀', name: 'Pop!_OS', rank: '#6 Popular' },
    { icon: '🔴', name: 'RHEL', rank: 'Enterprise' },
    { icon: '🦎', name: 'openSUSE', rank: '#8 Popular' },
    { icon: '🐉', name: 'Garuda', rank: 'Gaming' },
    { icon: '👁️', name: 'Kali', rank: 'Security' },
    { icon: '🌊', name: 'NixOS', rank: 'Advanced' },
    { icon: '✨', name: '+590 More', rank: 'View All →' },
  ];

  return (
    <section id="distros">
      <span className="section-tag">// distro-database</span>
      <h2 className="section-title">All Your Favourite Distros,<br />In One Place</h2>
      <p className="section-sub">Live tracking with real release data, not cached from 2009.</p>

      <div className="distro-grid">
        {distros.map((d, i) => (
          <div className="distro-pill" key={i}>
            <span className="d-icon">{d.icon}</span>
            <div className="d-name">{d.name}</div>
            <div className="d-rank">{d.rank}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
