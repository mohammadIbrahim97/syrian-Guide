'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    if (error && error.status === 429) {
      setError('Too many requests — please try again in a few minutes.');
      setLoading(false);
      return;
    }
    // Deliberately generic (no account enumeration).
    setSent(true);
    setLoading(false);
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

      {/* Forgot Password Form */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sz-48)' }}>
        <div className="animate-fade-up" style={{
          width: '100%', maxWidth: '440px', backgroundColor: 'var(--color-white)',
          borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
            Reset your password
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', textAlign: 'center', marginBottom: '32px' }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEE2E2',
              color: '#DC2626', fontSize: '14px', marginBottom: '24px', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
                If an account exists for <strong>{email}</strong>, a password-reset link is on its way. The link works in this browser.
              </p>
              <div style={{ marginTop: '24px', fontSize: '14px' }}>
                <Link href="/login" style={{ color: 'var(--brand-coral)', fontWeight: 600 }}>
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? 'Please wait…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
