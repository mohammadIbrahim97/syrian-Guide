'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'link-expired'
      ? 'That link is invalid or has expired. Please request a new one.'
      : ''
  );
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
    <div className="layout-wrapper" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ padding: 'var(--sz-16) var(--sz-32)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', margin: '-20px 0 -20px -10px' }} />
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sz-48)' }}>
        <div className="animate-fade-up" style={{
          width: '100%', maxWidth: '440px', backgroundColor: 'var(--color-white)',
          borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', textAlign: 'center', marginBottom: '32px' }}>
            {isRegister ? 'Join SyriaGuide to book private tours' : 'Log in to continue your journey'}
          </p>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEE2E2',
              color: '#DC2626', fontSize: '14px', marginBottom: '24px', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {confirmationSent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--neutral-dark)', marginBottom: '12px', fontWeight: 600 }}>
                Check your inbox
              </p>
              <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
                We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then log in.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {isRegister && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ahmad Al-Rashid"
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '14px', fontSize: '16px', borderRadius: '8px',
                    opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Log In'}
                </button>
              </form>

              {!isRegister && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <Link href="/forgot-password" style={{ fontSize: '14px', color: 'var(--neutral-gray)', textDecoration: 'underline' }}>
                    Forgot password?
                  </Link>
                </div>
              )}

              <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--neutral-gray)' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--brand-coral)',
                    fontWeight: 600, cursor: 'pointer', fontSize: '14px',
                  }}
                >
                  {isRegister ? 'Log In' : 'Sign Up'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}
