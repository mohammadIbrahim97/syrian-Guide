'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordForm() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card rihla-fade-up rihla-auth-card" style={{ maxWidth: '440px' }}>
          <h1 style={{
            fontFamily: 'var(--rihla-font-display)', fontSize: '1.9rem', fontWeight: 500,
            lineHeight: 1.12, margin: '0 0 0.5rem 0', textAlign: 'center', color: 'var(--rihla-ink)',
          }}>
            Set a new password.
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', textAlign: 'center', margin: '0 0 2rem 0' }}>
            Choose a new password for your account.
          </p>

          {error && (
            <div className="rihla-error" role="status" aria-live="polite" style={{ marginBottom: '1.4rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {authed === null ? (
            <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
                Checking your link…
              </p>
            </div>
          ) : authed === false ? (
            <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
                This link is invalid or has expired.
              </p>
              <div style={{ marginTop: '1.4rem', fontSize: '0.88rem' }}>
                <Link href="/forgot-password" className="rihla-link">
                  Request a new one
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <label style={{ display: 'block' }}>
                <span className="rihla-field-label">New password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="rihla-field"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="rihla-btn"
                style={{
                  fontSize: '0.95rem', padding: '0.85rem 1.4rem', width: '100%',
                  justifyContent: 'center',
                  opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Please wait…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </main>
  );
}
