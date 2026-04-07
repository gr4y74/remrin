import React from 'react';

export default function Ticker() {
  const items = [
    'Ubuntu 24.04.2 released',
    'Arch Linux 2025.02.01 ISO available',
    'Fedora 42 Beta testing begins',
    'Linux kernel 6.13 stable',
    'KDE Plasma 6.3 ships new features',
    'Valve improves Proton compatibility',
    'Debian 13 Trixie entering freeze',
    'GNOME 48 alpha released',
  ];

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {/* Double the items to allow seamless infinite scrolling */}
        {[...items, ...items].map((item, index) => (
          <span key={index} className="ticker-item">
            <span className="ticker-dot">▸</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}
