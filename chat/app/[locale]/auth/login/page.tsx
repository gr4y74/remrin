'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/en/sudodo/feed');
      router.refresh();
    }
  };

  return (
    <div className="retro-auth-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '10vh' }}>
      <form onSubmit={handleLogin} className="retro-box" style={{ width: '100%', maxWidth: '300px' }}>
        <div style={{ marginBottom: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
          LOGIN
        </div>

        {error && (
          <div style={{ color: 'var(--score-neg)', fontSize: '12px', marginBottom: '16px' }}>
            ERROR: {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--fg2)', marginBottom: '4px' }}>email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--fg2)', marginBottom: '4px' }}>password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" disabled={isLoading} style={{ width: '100%', background: 'var(--accent)', color: 'var(--bg)', fontWeight: 'bold' }}>
          {isLoading ? '[ authenticating... ]' : '[ sign in ]'}
        </button>

        <div style={{ marginTop: '16px', fontSize: '11px', textAlign: 'center' }}>
          <a href="/auth/signup" style={{ color: 'var(--fg3)' }}>no account? create one here</a>
        </div>
      </form>
    </div>
  );
}
