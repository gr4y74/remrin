import React from 'react';

export default function CommunityFeed() {
  return (
    <section id="community">
      <span className="section-tag">// community</span>
      <h2 className="section-title">The Linux Community,<br />Centralized at Last</h2>
      <p className="section-sub">Every distro's community in one place. Find answers faster, share solutions, and never feel alone on your Linux journey.</p>

      <div className="community-grid">
        <div className="comm-card">
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🔥 Hot Threads</span>
            <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>Live</span>
          </div>
          <div className="forum-post">
            <div className="fp-avatar" style={{ background: 'rgba(59,130,246,0.15)' }}>🎮</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-solved">SOLVED</span> NVIDIA 4090 on Arch — fix for black screen after install</div>
              <div className="fp-meta">arch · 2h ago · 847 views · 23 replies</div>
            </div>
          </div>
          <div className="forum-post">
            <div className="fp-avatar" style={{ background: 'rgba(239,68,68,0.15)' }}>🔥</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-hot">HOT</span> Wayland vs X11 in 2025 — the definitive guide</div>
              <div className="fp-meta">general · 4h ago · 2.1k views · 89 replies</div>
            </div>
          </div>
          <div className="forum-post">
            <div className="fp-avatar" style={{ background: 'rgba(16,185,129,0.15)' }}>🐧</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-new">NEW</span> I switched from Windows after 20 years — here's my week 1 report</div>
              <div className="fp-meta">beginners · 1h ago · 341 views · 12 replies</div>
            </div>
          </div>
          <div className="forum-post">
            <div className="fp-avatar" style={{ background: 'rgba(245,158,11,0.15)' }}>⚙️</div>
            <div className="fp-content">
              <div className="fp-title"><span className="fp-tag tag-solved">SOLVED</span> systemd service not starting on boot — the real fix</div>
              <div className="fp-meta">ubuntu · 6h ago · 1.2k views · 34 replies</div>
            </div>
          </div>
        </div>

        <div>
          <div className="comm-card" style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>📈 Community Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>340K</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Members</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--green)' }}>94%</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Questions Answered</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--accent3)' }}>8min</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Avg Response Time</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--orange)' }}>52</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Distro Channels</div>
              </div>
            </div>
          </div>
          <div className="comm-card">
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>🚀 Get Early Access</div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '16px' }}>Be first on the platform when we launch. No spam, just a launch notification.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="email" placeholder="your@email.com" style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontFamily: "'Instrument Sans', sans-serif", fontSize: '14px', outline: 'none' }} />
              <button className="w-next" style={{ whiteSpace: 'nowrap' }}>Notify Me</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
