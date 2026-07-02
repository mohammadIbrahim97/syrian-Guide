'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const ALL_LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Spanish'];

export default function ApplyPage() {
  const { status, update } = useSession();
  const router = useRouter();

  const [guideType, setGuideType] = useState<'STUDENT' | 'PROFESSIONAL'>('STUDENT');
  const [form, setForm] = useState({
    bio: '',
    city: '',
    university: '',
    hourlyRate: '',
    packagePrice: '',
    packageDuration: '',
    maxGroupSize: '1',
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isStudent = guideType === 'STUDENT';

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => (prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (languages.length === 0) {
      setError('Please select at least one language you speak');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        guideType,
        bio: form.bio,
        city: form.city,
        languages,
        maxGroupSize: Number(form.maxGroupSize),
        ...(isStudent
          ? { university: form.university, hourlyRate: Number(form.hourlyRate) }
          : {
              packagePrice: Number(form.packagePrice),
              packageDuration: form.packageDuration ? Number(form.packageDuration) : undefined,
            }),
      };

      const res = await fetch('/api/guides/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Refresh the session so it picks up the new GUIDE role, then show the live profile
      await update();
      router.push(`/guides/${data.id}`);
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' };

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

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sz-48)' }}>
        <div className="animate-fade-up" style={{
          width: '100%', maxWidth: '560px', backgroundColor: 'var(--color-white)',
          borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
            Become a guide
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', textAlign: 'center', marginBottom: '32px' }}>
            Share your city with travelers and earn as a local guide.
          </p>

          {status === 'unauthenticated' ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', marginBottom: '24px' }}>
                Please log in to create your guide offer.
              </p>
              <Link href="/login" className="btn btn-primary btn-pill" style={{ padding: '12px 28px', fontSize: '15px' }}>
                Log in to continue
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEE2E2',
                  color: '#DC2626', fontSize: '14px', textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              {/* Guide type */}
              <div>
                <label style={labelStyle}>What kind of guide are you?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {(['STUDENT', 'PROFESSIONAL'] as const).map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setGuideType(type)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                        border: guideType === type ? '2px solid var(--brand-coral)' : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: guideType === type ? 'var(--brand-coral)' : 'white',
                        color: guideType === type ? 'white' : 'var(--neutral-dark)',
                      }}
                    >
                      {type === 'STUDENT' ? 'Student (hourly)' : 'Professional (package)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>City</label>
                <input type="text" required value={form.city} placeholder="Damascus"
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>About you</label>
                <textarea required value={form.bio} rows={4} placeholder="Tell travelers what makes your tours special…"
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div>
                <label style={labelStyle}>Languages you speak</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {ALL_LANGUAGES.map(lang => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      style={{
                        padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px',
                        border: languages.includes(lang) ? '2px solid var(--brand-coral)' : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: languages.includes(lang) ? 'var(--brand-coral)' : 'white',
                        color: languages.includes(lang) ? 'white' : 'var(--neutral-dark)',
                        fontWeight: languages.includes(lang) ? 600 : 500,
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {isStudent ? (
                <>
                  <div>
                    <label style={labelStyle}>University</label>
                    <input type="text" value={form.university} placeholder="Damascus University"
                      onChange={e => setForm(f => ({ ...f, university: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Hourly rate (€)</label>
                    <input type="number" required min="1" step="1" value={form.hourlyRate} placeholder="10"
                      onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} style={inputStyle} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={labelStyle}>Package price per person (€)</label>
                    <input type="number" required min="1" step="1" value={form.packagePrice} placeholder="25"
                      onChange={e => setForm(f => ({ ...f, packagePrice: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Package duration (minutes)</label>
                    <input type="number" min="0" step="30" value={form.packageDuration} placeholder="180"
                      onChange={e => setForm(f => ({ ...f, packageDuration: e.target.value }))} style={inputStyle} />
                  </div>
                </>
              )}

              <div>
                <label style={labelStyle}>Max group size</label>
                <input type="number" required min="1" step="1" value={form.maxGroupSize}
                  onChange={e => setForm(f => ({ ...f, maxGroupSize: e.target.value }))} style={inputStyle} />
              </div>

              <button
                type="submit"
                disabled={loading || status === 'loading'}
                className="btn btn-primary"
                style={{
                  width: '100%', padding: '14px', fontSize: '16px', borderRadius: '8px',
                  opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Publishing…' : 'Publish my offer'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--neutral-gray)', margin: 0 }}>
                Your profile will be reviewed for verification.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
