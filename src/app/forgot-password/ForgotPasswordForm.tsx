'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordForm() {
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
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card rihla-fade-up rihla-auth-card" style={{ maxWidth: '440px' }}>
          <h1 style={{
            fontFamily: 'var(--rihla-font-display)', fontSize: '1.9rem', fontWeight: 500,
            lineHeight: 1.12, margin: '0 0 0.5rem 0', textAlign: 'center', color: 'var(--rihla-ink)',
          }}>
            Reset your password.
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', textAlign: 'center', margin: '0 0 2rem 0' }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="rihla-error" role="status" aria-live="polite" style={{ marginBottom: '1.4rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {sent ? (
            <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
                If an account exists for <strong>{email}</strong>, a password-reset link is on its way. The link works in this browser.
              </p>
              <div style={{ marginTop: '1.4rem', fontSize: '0.88rem' }}>
                <Link href="/login" className="rihla-link">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <label style={{ display: 'block' }}>
                <span className="rihla-field-label">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? 'Please wait…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </main>
  );
}
