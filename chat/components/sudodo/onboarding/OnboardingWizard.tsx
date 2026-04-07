'use client';

import React, { useState } from 'react';

type Step = 'welcome' | 'experience' | 'hardware' | 'summary';

export default function OnboardingWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [data, setData] = useState({
    experience: 'newcomer',
    distro: '',
    hardware: '',
    gpu: 'none'
  });

  const nextStep = () => {
    if (step === 'welcome') setStep('experience');
    else if (step === 'experience') setStep('hardware');
    else if (step === 'hardware') setStep('summary');
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal">
        <div className="wizard-sidebar">
          <div className={`ws-step ${step === 'welcome' ? 'active' : ''}`}>01 Initialization</div>
          <div className={`ws-step ${step === 'experience' ? 'active' : ''}`}>02 Experience</div>
          <div className={`ws-step ${step === 'hardware' ? 'active' : ''}`}>03 Hardware</div>
          <div className={`ws-step ${step === 'summary' ? 'active' : ''}`}>04 Your Passport</div>
        </div>

        <div className="wizard-main">
          {step === 'welcome' && (
            <div className="w-step-content">
              <h3>welcome to sudododo --version 2.0</h3>
              <p>You are about to create your <strong>SudoDodo Passport</strong>. This will customize your global feed and the Dodo AI specifically for your hardware.</p>
              <div className="w-hero">🐧</div>
              <button className="w-btn-primary" onClick={nextStep}>Initialize Passport →</button>
            </div>
          )}

          {step === 'experience' && (
            <div className="w-step-content">
              <h3>experience_level?</h3>
              <div className="w-options-grid">
                {[
                  { id: 'newcomer', label: 'Newcomer', desc: 'Thinking of switching from Win/Mac' },
                  { id: 'hopper', label: 'Hopper', desc: 'Using Linux, looking for the next best thing' },
                  { id: 'expert', label: 'Expert', desc: 'I use Arch, btw.' }
                ].map(opt => (
                  <div 
                    key={opt.id} 
                    className={`w-option-card ${data.experience === opt.id ? 'selected' : ''}`}
                    onClick={() => setData({...data, experience: opt.id})}
                  >
                    <h4>{opt.label}</h4>
                    <p>{opt.desc}</p>
                  </div>
                ))}
              </div>
              <button className="w-btn-primary" onClick={nextStep}>Next: Scan Hardware →</button>
            </div>
          )}

          {step === 'hardware' && (
            <div className="w-step-content">
              <h3>hardware_profile detection</h3>
              <p className="w-instr">Run this command in your terminal and paste the output below to let The Dodo analyze your compatibility:</p>
              <code className="w-code-cmd">lspci | grep -i vga && uname -a</code>
              <textarea 
                className="w-textarea" 
                placeholder="Paste command output here..."
                value={data.hardware}
                onChange={(e) => setData({...data, hardware: e.target.value})}
              />
              <div className="w-minor-options">
                <label>Manual GPU Selection:</label>
                <select onChange={(e) => setData({...data, gpu: e.target.value})}>
                  <option value="none">Auto-detect</option>
                  <option value="nvidia">NVIDIA (Proprietary needed)</option>
                  <option value="amd">AMD (Mesa/Open Source)</option>
                  <option value="intel">Intel (Integrated)</option>
                </select>
              </div>
              <button className="w-btn-primary" onClick={nextStep}>Next: Complete →</button>
            </div>
          )}

          {step === 'summary' && (
            <div className="w-step-content">
              <h3>passport_generation successful</h3>
              <div className="w-passport-preview">
                <div className="wp-header">SUDODODO OFFICIAL RESIDENT</div>
                <div className="wp-body">
                  <div className="wp-field">LVL: <span>{data.experience.toUpperCase()}</span></div>
                  <div className="wp-field">ROLE: <span>LINUX ENTHUSIAST</span></div>
                  <div className="wp-field">INTEL: <span>HARDWARE MAPPED</span></div>
                </div>
              </div>
              <p>Your feed will now prioritize content matching your hardware profile.</p>
              <button className="w-btn-primary" onClick={onClose}>Enter SudoDodo →</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wizard-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 1000; display: flex; alignItems: center; justifyContent: center; padding: 20px; }
        .wizard-modal { background: #0c101c; border: 1px solid #1e293b; width: 100%; maxWidth: 800px; height: 500px; border-radius: 12px; display: flex; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .wizard-sidebar { width: 200px; background: #070a14; border-right: 1px solid #1e293b; padding: 40px 20px; display: flex; flexDirection: column; gap: 20px; }
        .ws-step { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; }
        .ws-step.active { color: #3b82f6; font-weight: 700; }
        .wizard-main { flex: 1; padding: 40px; }
        .w-step-content h3 { font-family: 'JetBrains Mono', monospace; font-size: 18px; color: #3b82f6; margin-bottom: 20px; }
        .w-options-grid { display: grid; gridTemplateColumns: 1fr 1fr; gap: 16px; margin: 20px 0; }
        .w-option-card { background: #161e2e; border: 1px solid #1e293b; padding: 16px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .w-option-card:hover { border-color: #3b82f6; }
        .w-option-card.selected { border-color: #3b82f6; background: rgba(59,130,246,0.1); }
        .w-hero { font-size: 80px; text-align: center; margin: 40px 0; }
        .w-btn-primary { width: 100%; background: #3b82f6; color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 20px; }
        .w-code-cmd { display: block; background: #000; color: #10b981; padding: 12px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; margin-bottom: 20px; }
        .w-textarea { width: 100%; background: #000; border: 1px solid #1e293b; color: #fff; padding: 12px; height: 100px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; }
        .w-passport-preview { background: linear-gradient(135deg, #1e293b, #0c101c); padding: 30px; border-radius: 12px; border: 1px solid #3b82f6; margin: 20px 0; }
      `}</style>
    </div>
  );
}
