'use client';

import React, { useState, useEffect } from 'react';
import { toast } from "sonner";

interface JoinButtonProps {
  communityId: string;
  userId?: string;
  initialCount: number;
}

export default function JoinButton({ communityId, userId, initialCount }: JoinButtonProps) {
  const [isMember, setIsMember] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (userId && communityId) {
      fetch(`/api/sudodo/communities/join?communityId=${communityId}&userId=${userId}`)
        .then(res => res.json())
        .then(data => setIsMember(data.isMember));
    }
  }, [communityId, userId]);

  const handleToggle = async () => {
    if (!userId) {
      toast.error("Please log in to join this community.");
      return;
    }

    setIsPending(true);
    const action = isMember ? 'leave' : 'join';

    try {
      const res = await fetch('/api/sudodo/communities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ community_id: communityId, action })
      });

      if (res.ok) {
        setIsMember(!isMember);
        setCount(prev => isMember ? prev - 1 : prev + 1);
        toast.success(isMember ? "Left community." : "Successfully joined!");
      }
    } catch (err) {
      toast.error("Failed to update membership.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="join-container">
      <button 
        className={`join-btn ${isMember ? 'joined' : ''}`}
        onClick={handleToggle}
        disabled={isPending}
      >
        {isPending ? '...' : isMember ? 'Joined' : 'Join Community'}
      </button>
      <div className="join-stats">
        <span className="join-count">{(count / 1000).toFixed(1)}k</span> members
      </div>

      <style jsx>{`
        .join-container { display: flex; align-items: center; gap: 16px; margin-top: 20px; }
        .join-btn {
          min-width: 140px;
          height: 40px;
          border: 1px solid #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 20px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .join-btn:hover { background: rgba(59, 130, 246, 0.2); transform: translateY(-1px); }
        .join-btn.joined { background: #3b82f6; color: white; border: none; }
        .join-btn.joined:hover { background: #2563eb; opacity: 0.9; }
        
        .join-stats { font-size: 13px; color: #475569; font-weight: 600; }
        .join-count { color: #e2e8f0; font-weight: 800; }
      `}</style>
    </div>
  );
}
