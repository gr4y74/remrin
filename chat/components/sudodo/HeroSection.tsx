'use client';

import React, { useState } from 'react';
import OnboardingWizard from './onboarding/OnboardingWizard';

export default function HeroSection() {
  const [showWizard, setShowWizard] = useState(false);
  return (
    <div className="hero">
      <div className="hero-glow"></div>
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          The only Linux resource you'll ever need
        </div>
        <h1>
          <span className="line1">Everything Linux.</span>
          <span className="line2">One Place.</span>
        </h1>
        <p className="hero-sub">
          AI-powered distro matching, curated tutorials, live community support, and the most comprehensive Linux knowledge base ever built. Stop Googling. Start Linux-ing.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/en/sudodo/feed'}>
            🚀 Launch Community Feed
          </button>
          <button className="btn-secondary" onClick={() => setShowWizard(true)}>
            📝 Join Free (SudoDodo Passport)
          </button>
        </div>

        {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} />}

        {/* TERMINAL */}
        <div className="terminal-wrapper">
          <div className="terminal">
            <div className="terminal-bar">
              <div className="dot dot-red"></div>
              <div className="dot dot-yellow"></div>
              <div className="dot dot-green"></div>
              <span className="terminal-title">sudododo — distro-wizard</span>
            </div>
            <div className="terminal-body">
              <div><span className="t-prompt">penguin@os</span><span className="t-cmd"> ~$ </span><span className="t-accent">sudododo find-my-distro</span></div>
              <div className="t-output">Analyzing your profile... ████████████ 100%</div>
              <div>&nbsp;</div>
              <div><span className="t-success">✓ </span><span className="t-output">Primary Use: Gaming + Development</span></div>
              <div><span className="t-success">✓ </span><span className="t-output">Hardware: NVIDIA RTX 4070 detected</span></div>
              <div><span className="t-success">✓ </span><span className="t-output">Experience Level: Intermediate</span></div>
              <div><span className="t-success">✓ </span><span className="t-output">Preference: Stable with gaming support</span></div>
              <div>&nbsp;</div>
              <div><span className="t-highlight">🎯 Best Match: </span><span className="t-accent">Pop!_OS 24.04 LTS</span></div>
              <div><span className="t-output">   Desktop: GNOME 46 · Driver: NVIDIA 550 (auto-install)</span></div>
              <div><span className="t-output">   Score: </span><span className="t-success">97% compatibility</span></div>
              <div>&nbsp;</div>
              <div><span className="t-warn">⚡ </span><span className="t-output">Generating your personalized install guide...</span><span className="t-cursor"></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
