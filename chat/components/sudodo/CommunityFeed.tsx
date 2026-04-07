import React from 'react';

export default function CommunityFeed() {
  return (
    <section id="community">
      <span className="section-tag">// community</span>
      <h2 className="section-title">The Linux Community,<br />Centralized at Last</h2>
      <p className="section-sub">Every distro's community in one place. Find answers faster, share solutions, and never feel alone on your Linux journey.</p>

      <div className="community-grid">
        <div className="comm-card">
          <div className="comm-widget-header">
            <span>🔥 Hot Threads</span>
            <span className="live-pill">Live</span>
          </div>
          <div className="forum-post">
            <div className="fp-avatar i-blue">🎮</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-solved">SOLVED</span> NVIDIA 4090 on Arch — fix for black screen after install</div>
              <div className="fp-meta">arch · 2h ago · 847 views · 23 replies</div>
            </div>
          </div>
          <div className="forum-post">
            <div className="fp-avatar i-red">🔥</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-hot">HOT</span> Wayland vs X11 in 2025 — the definitive guide</div>
              <div className="fp-meta">general · 4h ago · 2.1k views · 89 replies</div>
            </div>
          </div>
          <div className="forum-post">
            <div className="fp-avatar i-green">🐧</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-new">NEW</span> I switched from Windows after 20 years — here's my week 1 report</div>
              <div className="fp-meta">beginners · 1h ago · 341 views · 12 replies</div>
            </div>
          </div>
          <div className="forum-post">
            <div className="fp-avatar i-orange">⚙️</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-solved">SOLVED</span> systemd service not starting on boot — the real fix</div>
              <div className="fp-meta">ubuntu · 6h ago · 1.2k views · 34 replies</div>
            </div>
          </div>
        </div>

        <div>
          <div className="comm-card mb-4">
            <div className="comm-widget-title">📈 Community Stats</div>
            <div className="comm-stats-grid">
              <div className="comm-stat-item">
                <div className="comm-stat-val c-blue">340K</div>
                <div className="comm-stat-label">Members</div>
              </div>
              <div className="comm-stat-item">
                <div className="comm-stat-val c-green">94%</div>
                <div className="comm-stat-label">Questions Answered</div>
              </div>
              <div className="comm-stat-item">
                <div className="comm-stat-val c-purple">8min</div>
                <div className="comm-stat-label">Avg Response Time</div>
              </div>
              <div className="comm-stat-item">
                <div className="comm-stat-val c-orange">52</div>
                <div className="comm-stat-label">Distro Channels</div>
              </div>
            </div>
          </div>
          <div className="comm-card">
            <div className="comm-widget-title">🚀 Get Early Access</div>
            <p className="comm-early-text">Be first on the platform when we launch. No spam, just a launch notification.</p>
            <div className="comm-early-row">
              <input type="email" placeholder="your@email.com" className="comm-email-input" />
              <button className="w-next no-wrap">Notify Me</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
