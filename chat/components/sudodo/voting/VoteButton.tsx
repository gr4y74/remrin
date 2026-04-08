'use client';

import React, { useState } from 'react';
import { castVote } from '@/lib/sudodo/votes/actions';
import { useRouter } from 'next/navigation';

interface VoteButtonProps {
  postId: string;
  initialScore: number;
  initialUserVote: 1 | -1 | null;
  userId?: string;
}

export default function VoteButton({ postId, initialScore, initialUserVote, userId }: VoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVote = async (value: 1 | -1) => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    if (isLoading) return;

    // OPTIMISTIC UPDATE
    const oldScore = score;
    const oldVote = userVote;

    let newScore = score;
    let newVote: 1 | -1 | null = value;

    if (userVote === value) {
      // Toggle off
      newScore = value === 1 ? score - 1 : score + 1;
      newVote = null;
    } else if (userVote !== null) {
      // Switch direction
      newScore = value === 1 ? score + 2 : score - 2;
    } else {
      // New vote
      newScore = value === 1 ? score + 1 : score - 1;
    }

    setScore(newScore);
    setUserVote(newVote);
    setIsLoading(true);

    try {
      const result = await castVote(postId, value);
      setScore(result.score);
      setUserVote(result.userVote);
    } catch (err) {
      // REVERT ON ERROR
      setScore(oldScore);
      setUserVote(oldVote);
      alert('FAILED TO REGISTER VOTE');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vote-col" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '32px',
      gap: '2px',
      fontSize: '14px',
      opacity: isLoading ? 0.5 : 1
    }}>
      <button 
        onClick={() => handleVote(1)}
        style={{ 
          border: 'none', 
          background: 'none', 
          cursor: 'pointer',
          color: userVote === 1 ? 'var(--score-pos)' : 'var(--fg3)',
          padding: '0'
        }}
      >
        ▲
      </button>
      
      <div style={{ 
        fontSize: '12px', 
        fontWeight: 'bold',
        color: score > 0 ? 'var(--score-pos)' : score < 0 ? 'var(--score-neg)' : 'var(--fg2)'
      }}>
        {score}
      </div>

      <button 
        onClick={() => handleVote(-1)}
        style={{ 
          border: 'none', 
          background: 'none', 
          cursor: 'pointer',
          color: userVote === -1 ? 'var(--score-neg)' : 'var(--fg3)',
          padding: '0'
        }}
      >
        ▼
      </button>
    </div>
  );
}
