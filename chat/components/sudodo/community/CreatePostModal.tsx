'use client';

import React, { useState, useEffect } from 'react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCommunity?: string;
}

export default function CreatePostModal({ isOpen, onClose, initialCommunity }: CreatePostModalProps) {
  const [step, setStep] = useState(1);
  const [communities, setCommunities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    community: initialCommunity || '',
    title: '',
    content: '',
    flair: 'discussion'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/sudodo/communities?type=distro')
        .then(res => res.json())
        .then(data => setCommunities(data.data || []));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.title || !formData.community) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sudodo/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          community_slug: formData.community,
          title: formData.title,
          content: formData.content,
          flair: formData.flair,
          author_name: 'Resident Penguin' // Fallback for now
        })
      });

      if (res.ok) {
        onClose();
        window.location.reload(); // Refresh feed
      }
    } catch (err) {
      console.error("Posting error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cp-overlay">
      <div className="cp-modal glass">
        <div className="cp-header">
          <div className="cp-h-left">
            <h3>Create a Post</h3>
            <span className="cp-h-id">ID: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
          </div>
          <button className="cp-close" onClick={onClose}>×</button>
        </div>

        <div className="cp-body">
          <div className="cp-field">
            <label>Select Community</label>
            <select 
              value={formData.community} 
              onChange={(e) => setFormData({...formData, community: e.target.value})}
              className="cp-select"
            >
              <option value="">Choose a Distro/DE...</option>
              {communities.map(c => (
                <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="cp-tabs">
            <div className="cp-tab active">📝 Post</div>
            <div className="cp-tab disabled">🖼️ Image/Video</div>
            <div className="cp-tab disabled">🔗 Link</div>
          </div>

          <div className="cp-input-group">
            <input 
              type="text" 
              placeholder="Title (Keep it technical and concise)" 
              className="cp-title-in"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            
            <div className="cp-flairs">
              {['discussion', 'guide', 'help', 'news', 'showcase'].map(f => (
                <button 
                  key={f} 
                  className={`cp-flair-btn ${formData.flair === f ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, flair: f})}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <textarea 
              placeholder="Post content (Markdown supported)..." 
              className="cp-content-in"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>
        </div>

        <div className="cp-footer">
          <button className="cp-btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="cp-btn-submit" 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title || !formData.community}
          >
            {isSubmitting ? 'CHIRPING...' : 'POST TO SUDODODO'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .cp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .cp-modal { width: 100%; max-width: 740px; background: #0c101c; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }
        .cp-header { padding: 20px 24px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; }
        .cp-h-left h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; margin: 0; }
        .cp-h-id { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #475569; letter-spacing: 1px; }
        .cp-close { background: none; border: none; font-size: 28px; color: #475569; cursor: pointer; }
        
        .cp-body { padding: 24px; flex: 1; overflow-y: auto; }
        .cp-select { width: 100%; background: #161e2e; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 8px; margin-top: 8px; font-family: 'Instrument Sans', sans-serif; }
        
        .cp-tabs { display: flex; gap: 8px; margin: 24px 0 16px; border-bottom: 1px solid #1e293b; }
        .cp-tab { padding: 8px 16px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; }
        .cp-tab.active { color: #3b82f6; border-bottom: 2px solid #3b82f6; }
        .cp-tab.disabled { opacity: 0.3; cursor: not-allowed; }
        
        .cp-title-in { width: 100%; background: #070a14; border: 1px solid #1e293b; color: #fff; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600; outline: none; transition: border-color 0.2s; }
        .cp-title-in:focus { border-color: #3b82f6; }
        
        .cp-flairs { display: flex; gap: 6px; margin: 12px 0; flex-wrap: wrap; }
        .cp-flair-btn { background: #161e2e; border: 1px solid #1e293b; color: #475569; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
        .cp-flair-btn.active { background: rgba(59,130,246,0.15); border-color: #3b82f6; color: #3b82f6; }
        
        .cp-content-in { width: 100%; min-height: 200px; background: #070a14; border: 1px solid #1e293b; color: #e2e8f0; padding: 14px; border-radius: 8px; font-size: 14px; line-height: 1.6; outline: none; resize: vertical; margin-top: 12px; }
        
        .cp-footer { padding: 20px 24px; border-top: 1px solid #1e293b; display: flex; justify-content: flex-end; gap: 12px; }
        .cp-btn-cancel { background: none; border: 1px solid #1e293b; color: #94a3b8; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .cp-btn-submit { background: #3b82f6; border: none; color: white; padding: 10px 32px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .cp-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
