'use client';

import React, { useState } from 'react';

export default function AIWizard() {
  const [selectedOption, setSelectedOption] = useState<string>('Gaming');

  return (
    <section id="wizard">
      <span className="section-tag">{'// ai-powered'}</span>
      <h2 className="section-title">Find Your Perfect Distro<br />in 60 Seconds</h2>
      <p className="section-sub">Answer a few questions. Our AI analyzes 600+ distros and your exact hardware to give you a personalized recommendation — not just &quot;try Ubuntu.&quot;</p>

      <div className="wizard-container">
        <div className="wizard-card visible">
          <div className="wizard-header">
            <div>
              <div className="wizard-header-title">Distro Wizard</div>
              <div className="wizard-step">Question 4 of 10</div>
              <div className="progress-bar"><div className="progress-fill"></div></div>
            </div>
          </div>
          <div className="wizard-body">
            <div className="wizard-question">What&apos;s your primary use case for this Linux install?</div>
            <div className="wizard-options">
              {['Gaming', 'Development', 'Creative Work', 'Privacy / Security', 'Office / Productivity', 'Home Server'].map((opt) => (
                <div 
                  key={opt}
                  className={`w-option ${selectedOption === opt ? 'selected' : ''}`} 
                  onClick={() => setSelectedOption(opt)}
                >
                  <div className="w-check"></div>
                  {opt === 'Gaming' ? '🎮 ' : opt === 'Development' ? '💻 ' : opt === 'Creative Work' ? '🎨 ' : opt === 'Privacy / Security' ? '🔒 ' : opt === 'Office / Productivity' ? '📊 ' : '🖥️ '}
                  {opt}
                </div>
              ))}
            </div>
          </div>
          <div className="wizard-footer">
            <button className="w-next">Next →</button>
          </div>
        </div>

        <div>
          <div className="result-preview-label">LIVE PREVIEW — YOUR RESULT SO FAR</div>
          <div className="result-card">
            <div className="result-header">
              <span>🏆 #1 Match</span>
              <span className="result-match">97% compatible</span>
            </div>
            <div className="result-distro">Pop!_OS 24.04</div>
            <div className="result-de">Recommended DE: GNOME 46</div>
            <div className="result-tags">
              <span className="rtag rtag-green">✓ NVIDIA Ready</span>
              <span className="rtag rtag-blue">Gaming Optimized</span>
              <span className="rtag rtag-purple">Dev Tools Pre-installed</span>
            </div>
            <div className="result-reason">
              Based on your NVIDIA GPU and user focus, Pop!_OS is ideal — it ships with proprietary GPU drivers pre-configured and includes a custom scheduler for better performance. System76 maintains it with frequent updates.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
