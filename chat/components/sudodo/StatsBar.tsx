import React from 'react';

export default function StatsBar() {
  return (
    <div className="stats-bar">
      <div className="stats-inner">
        <div className="stat">
          <span className="stat-num">600+</span>
          <span className="stat-label">Linux Distros Tracked</span>
        </div>
        <div className="stat">
          <span className="stat-num">12K+</span>
          <span className="stat-label">Curated Tutorials</span>
        </div>
        <div className="stat">
          <span className="stat-num">340K</span>
          <span className="stat-label">Community Members</span>
        </div>
        <div className="stat">
          <span className="stat-num">99.2%</span>
          <span className="stat-label">AI Match Accuracy</span>
        </div>
      </div>
    </div>
  );
}
