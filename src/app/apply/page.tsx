'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavActions from '@/components/NavActions';

export default function ApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    city: 'Damascus',
    bio: '',
    languages: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Umleitung falls nicht eingeloggt
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const langsArray = form.languages.split(',').map(l => l.trim()).filter(Boolean);
    if (langsArray.length === 0) {
      setError('Please enter at least one language.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/guides/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: form.city,
          bio: form.bio,
          languages: langsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit application');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-wrapper" style={{ flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--neutral-light)' }}>
      {/* Header */}
      <header style={{ padding: 'var(--sz-16) var(--sz-32)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="mock-nav" style={{ boxShadow: 'none', border: 'none', padding: '0' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', margin: '-20px 0 -20px -10px' }} />
            </Link>
            <div style={{ flex: 1, padding: '0 40px' }}></div>
            <NavActions />
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'var(--sz-48)' }}>
        <div className="animate-fade-up" style={{
          width: '100%', maxWidth: '640px', backgroundColor: 'var(--color-white)',
          borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)', marginTop: '20px'
        }}>
          
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px' }}>Application Submitted!</h1>
              <p style={{ fontSize: '16px', color: 'var(--neutral-gray)', marginBottom: '32px', lineHeight: 1.6 }}>
                Thank you for applying to be a guide on SyriaGuide. We'll review your application and get back to you soon!
                <br /><br />
                As an early tester, your account has been automatically upgraded to the <strong>GUIDE</strong> role.
              </p>
              <Link href="/" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '16px', borderRadius: '8px' }}>
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                Become a Local Guide
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', marginBottom: '32px', lineHeight: 1.5 }}>
                Share your passion for Syria with travelers from around the world. Fill out the application below to get started.
              </p>

              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEE2E2',
                  color: '#DC2626', fontSize: '14px', marginBottom: '24px'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Which city will you guide in?</label>
                  <select
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'white'
                    }}
                  >
                    <option value="Damascus">Damascus</option>
                    <option value="Aleppo">Aleppo</option>
                    <option value="Homs">Homs</option>
                    <option value="Palmyra">Palmyra</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Languages Spoken</label>
                  <input
                    type="text"
                    required
                    value={form.languages}
                    onChange={e => setForm({ ...form, languages: e.target.value })}
                    placeholder="e.g. English, Arabic, German"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--neutral-gray)', marginTop: '4px', display: 'block' }}>Comma separated values</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>About You (Bio)</label>
                  <textarea
                    required
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell travelers a bit about yourself, your background, and what they can expect on your tours..."
                    rows={6}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box',
                      fontFamily: 'inherit', resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || status !== 'authenticated'}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '16px', fontSize: '16px', borderRadius: '8px',
                    opacity: loading || status !== 'authenticated' ? 0.7 : 1, 
                    cursor: loading || status !== 'authenticated' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: 'var(--sz-48) var(--sz-32)', marginTop: 'auto', backgroundColor: 'var(--color-white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain', margin: '-10px 0 -10px -10px' }} />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>© 2026 SyriaGuide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
