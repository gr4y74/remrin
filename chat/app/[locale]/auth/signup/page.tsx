'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: username
        }
      }
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
      <form onSubmit={handleSignup} className="retro-box" style={{ width: '100%', maxWidth: '300px' }}>
        <div style={{ marginBottom: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
          CREATE ACCOUNT
        </div>

        {error && (
          <div style={{ color: 'var(--score-neg)', fontSize: '12px', marginBottom: '16px' }}>
            ERROR: {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--fg2)', marginBottom: '4px' }}>username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>

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
          {isLoading ? '[ creating resident... ]' : '[ create account ]'}
        </button>

        <div style={{ marginTop: '16px', fontSize: '11px', textAlign: 'center' }}>
          <a href="/auth/login" style={{ color: 'var(--fg3)' }}>already a resident? login here</a>
        </div>
      </form>
    </div>
  );
}
