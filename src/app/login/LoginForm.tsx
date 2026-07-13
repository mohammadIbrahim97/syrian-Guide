'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

// Reads the ?error query param inside its own Suspense boundary so the rest of
// the login page can still prerender statically. Renders nothing; it just
// pushes the banner message up via callback.
function LinkExpiredParam({ onDetected }: { onDetected: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('error') === 'link-expired') {
      onDetected('That link is invalid or has expired. Please request a new one.');
    }
  }, [searchParams, onDetected]);
  return null;
}

export default function LoginForm() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        });
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        if (!data.session) {
          // Email confirmation is enabled — no session until the link is clicked.
          setConfirmationSent(true);
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card rihla-fade-up rihla-auth-card" style={{ maxWidth: '440px' }}>
          <h1 style={{
            fontFamily: 'var(--rihla-font-display)', fontSize: '1.9rem', fontWeight: 500,
            lineHeight: 1.12, margin: '0 0 0.5rem 0', textAlign: 'center', color: 'var(--rihla-ink)',
          }}>
            {isRegister ? 'Create your account.' : 'Welcome back.'}
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', textAlign: 'center', margin: '0 0 2rem 0' }}>
            {isRegister ? 'Join Rihla to book local guides across the Levant' : 'Log in to continue your journey'}
          </p>

          <Suspense fallback={null}>
            <LinkExpiredParam onDetected={setError} />
          </Suspense>

          {error && (
            <div className="rihla-error" role="status" aria-live="polite" style={{ marginBottom: '1.4rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {confirmationSent ? (
            <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--rihla-ink)', margin: '0 0 0.7rem 0', fontWeight: 600 }}>
                Check your inbox
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
                We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then log in.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {isRegister && (
                  <label style={{ display: 'block' }}>
                    <span className="rihla-field-label">Full name</span>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => { setError(''); setForm(f => ({ ...f, name: e.target.value })); }}
                      placeholder="Ahmad Al-Rashid"
                      className="rihla-field"
                    />
                  </label>
                )}

                <label style={{ display: 'block' }}>
                  <span className="rihla-field-label">Email</span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => { setError(''); setForm(f => ({ ...f, email: e.target.value })); }}
                    placeholder="you@example.com"
                    className="rihla-field"
                  />
                </label>

                <label style={{ display: 'block' }}>
                  <span className="rihla-field-label">Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => { setError(''); setForm(f => ({ ...f, password: e.target.value })); }}
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
                    justifyContent: 'center', marginTop: '0.3rem',
                    opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
                </button>
              </form>

              {!isRegister && (
                <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
                  <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--rihla-ink-soft)', textDecoration: 'underline' }}>
                    Forgot password?
                  </Link>
                </div>
              )}

              <div style={{ marginTop: '1.4rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--rihla-ink-soft)' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  className="rihla-link"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.85rem', fontFamily: 'var(--rihla-font-body)', padding: 0,
                  }}
                >
                  {isRegister ? 'Log in' : 'Sign up'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
  );
}
