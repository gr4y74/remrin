'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ name: string; url: string }>;
}

export default function DodoSpecialist({ distroName, themeColor }: { distroName: string; themeColor: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey! I'm your **${distroName} specialist**. Ask me anything about installation, drivers, or specific configuration. I have direct access to the ${distroName} Wiki and SudoDodo Hardware Matrix. 🐧`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Mocking the RAG + Remrin API response for now
    // In production, this would call /api/sudodo/chat
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on the latest data for ${distroName}, your hardware is perfectly compatible. If you are using a ThinkPad X1 Carbon, make sure to enable the 'psmouse.synaptics_intertouch=1' kernel parameter for optimal trackpoint performance.`,
        sources: [
          { name: `${distroName} Wiki`, url: '#' },
          { name: 'SudoDodo Matrix', url: '#' }
        ]
      };
      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="ai-panel" style={{ border: `1px solid ${themeColor}40` }}>
      <div className="ai-header">
        <div className="ai-status">
          <span className="status-dot pulse"></span>
          🤖 {distroName} Specialist
        </div>
        <span className="ai-badge" style={{ background: `${themeColor}20`, color: themeColor }}>Expert Mode</span>
      </div>

      <div className="ai-messages" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'} style={m.role === 'assistant' ? { borderLeft: `2px solid ${themeColor}` } : {}}>
            <div className="msg-content">{m.content}</div>
            {m.sources && (
              <div className="msg-sources">
                <span className="sources-label">Sources:</span>
                {m.sources.map((s, i) => (
                  <a key={i} href={s.url} className="source-link" target="_blank" rel="noreferrer">
                    {s.name}{i < m.sources!.length - 1 ? ',' : ''}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="ai-msg-bot loading">
            <span className="loading-dots">Thinking...</span>
          </div>
        )}
      </div>

      <div className="ai-input-area">
        <div className="ai-input-row">
          <input 
            className="ai-input" 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask about ${distroName} hardware, commands...`} 
          />
          <button 
            className="ai-send" 
            onClick={handleSend}
            style={{ background: themeColor }}
            disabled={isLoading}
          >
            {isLoading ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}
