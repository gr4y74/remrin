import React from 'react';

export default function FeaturesGrid() {
  return (
    <section id="features">
      <span className="section-tag">// platform-overview</span>
      <h2 className="section-title">Everything Linux Needs<br />Lives Here Now</h2>
      <p className="section-sub">We're replacing 12 scattered resources with one beautifully designed platform built for the modern Linux user.</p>

      <div className="features-grid">
        <div className="feature-card" style={{ opacity: 1, transform: 'translateY(0)' }}>
          <div className="feature-icon fi-blue">🤖</div>
          <h3 className="feature-title">AI Distro Wizard</h3>
          <p className="feature-desc">Trained on verified Linux data only. No hallucinations. Matches you to your perfect distro + desktop environment + install guide in under 60 seconds.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon fi-cyan">📊</div>
          <h3 className="feature-title">Live Distro Database</h3>
          <p className="feature-desc">600+ distros with real-time release tracking, hardware compatibility matrices, package databases, and beautiful modern UI. DistroWatch done right.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon fi-purple">🎥</div>
          <h3 className="feature-title">Tutorial Aggregator</h3>
          <p className="feature-desc">Every Linux YouTube tutorial indexed, tagged by distro, topic, and skill level. Community-ranked so you always find the best solution first.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon fi-green">💬</div>
          <h3 className="feature-title">Community Hub</h3>
          <p className="feature-desc">Per-distro forums, real-time chat, and a verified solutions database. AI triages your help request first — humans step in when needed.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon fi-orange">🔧</div>
          <h3 className="feature-title">Linux Toolbox</h3>
          <p className="feature-desc">Command generators, config file templates, dotfiles sharing, hardware compatibility checker, and package version comparison across distros.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon fi-red">📰</div>
          <h3 className="feature-title">Linux News</h3>
          <p className="feature-desc">Kernel releases, distro updates, hardware announcements, and FOSS news aggregated from across the web with real-time ticker updates.</p>
        </div>
      </div>
    </section>
  );
}
