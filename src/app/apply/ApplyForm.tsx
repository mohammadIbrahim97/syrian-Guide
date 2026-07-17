'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const ALL_LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Spanish'];

// Segmented / pill toggle palette from the Rihla design file
const toggleActive: React.CSSProperties = {
  border: '1px solid #054239',
  background: '#054239',
  color: 'var(--rihla-cream)',
};
const toggleInactive: React.CSSProperties = {
  border: '1px solid rgba(152, 133, 97, 0.55)',
  background: '#ffffff',
  color: 'var(--rihla-ink)',
};

export default function ApplyForm() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  const [guideType, setGuideType] = useState<'STUDENT' | 'PROFESSIONAL'>('STUDENT');
  const [form, setForm] = useState({
    bio: '',
    city: '',
    phone: '',
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
        phone: form.phone,
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

      // Send the guide to the dashboard — its server render reads the fresh
      // GUIDE role via getUser(). Adding availability is the required next step.
      router.push('/account');
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
      <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card rihla-fade-up rihla-apply-card" style={{ maxWidth: '560px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{
              fontFamily: 'var(--rihla-font-body)', fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--rihla-bronze-text)',
            }}>
              Become a guide
            </span>
            <h1 style={{
              fontFamily: 'var(--rihla-font-display)', fontSize: '1.9rem', fontWeight: 500,
              lineHeight: 1.12, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)',
            }}>
              Share the place you call home.
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
              Publish your offer and welcome travelers to your city.
            </p>
          </div>

          {authed === false ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0' }}>
                Please log in to create your guide offer.
              </p>
              <Link href="/login" className="rihla-btn" style={{ fontSize: '0.92rem', padding: '0.7rem 1.4rem', justifyContent: 'center' }}>
                Log in to continue
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {error && (
                <div className="rihla-error" role="status" aria-live="polite" style={{ textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {/* Guide type */}
              <div role="group" aria-label="What kind of guide are you?">
                <span className="rihla-field-label">What kind of guide are you?</span>
                <div className="rihla-apply-type-row" style={{ display: 'flex', gap: '0.7rem' }}>
                  {(['STUDENT', 'PROFESSIONAL'] as const).map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setGuideType(type)}
                      aria-pressed={guideType === type}
                      style={{
                        flex: 1, padding: '0.72rem', borderRadius: '14px', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--rihla-font-body)',
                        transition: 'all 0.2s',
                        ...(guideType === type ? toggleActive : toggleInactive),
                      }}
                    >
                      {type === 'STUDENT' ? 'Student · hourly' : 'Professional · package'}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'block' }}>
                <span className="rihla-field-label">City</span>
                <input type="text" required value={form.city} placeholder="Damascus, Byblos, Petra…"
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rihla-field" />
              </label>

              <label style={{ display: 'block' }}>
                <span className="rihla-field-label">About you</span>
                <textarea required value={form.bio} rows={4} placeholder="Tell travelers what makes your tours special…"
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="rihla-field" />
              </label>

              {/* Languages */}
              <div role="group" aria-label="Languages you speak">
                <span className="rihla-field-label">Languages you speak</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ALL_LANGUAGES.map(lang => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      aria-pressed={languages.includes(lang)}
                      style={{
                        padding: '0.45rem 0.95rem', borderRadius: '999px', cursor: 'pointer',
                        fontSize: '0.85rem', fontFamily: 'var(--rihla-font-body)', transition: 'all 0.2s',
                        fontWeight: languages.includes(lang) ? 600 : 450,
                        ...(languages.includes(lang) ? toggleActive : toggleInactive),
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {isStudent ? (
                <>
                  <label style={{ display: 'block' }}>
                    <span className="rihla-field-label">University</span>
                    <input type="text" value={form.university} placeholder="Damascus University"
                      onChange={e => setForm(f => ({ ...f, university: e.target.value }))} className="rihla-field" />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span className="rihla-field-label">Hourly rate ($)</span>
                    <input type="number" required min="1" step="1" value={form.hourlyRate} placeholder="10"
                      onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} className="rihla-field" />
                  </label>
                </>
              ) : (
                <>
                  <label style={{ display: 'block' }}>
                    <span className="rihla-field-label">Package price per person ($)</span>
                    <input type="number" required min="1" step="1" value={form.packagePrice} placeholder="25"
                      onChange={e => setForm(f => ({ ...f, packagePrice: e.target.value }))} className="rihla-field" />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span className="rihla-field-label">Package duration (minutes)</span>
                    <input type="number" min="0" step="30" value={form.packageDuration} placeholder="180"
                      onChange={e => setForm(f => ({ ...f, packageDuration: e.target.value }))} className="rihla-field" />
                  </label>
                </>
              )}

              <label style={{ display: 'block' }}>
                <span className="rihla-field-label">Max group size</span>
                <input type="number" required min="1" step="1" value={form.maxGroupSize}
                  onChange={e => setForm(f => ({ ...f, maxGroupSize: e.target.value }))} className="rihla-field" />
              </label>

              <div>
                <label style={{ display: 'block' }}>
                  <span className="rihla-field-label">WhatsApp number (optional)</span>
                  <input type="tel" value={form.phone} placeholder="+963 944 123 456"
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rihla-field" />
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--rihla-ink-soft)', margin: '0.5rem 0 0 0' }}>
                  Include your country code. Only shared with a traveler after they&apos;ve paid for a booking — never shown publicly.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || authed === null}
                className="rihla-btn"
                style={{
                  width: '100%', fontSize: '0.95rem', padding: '0.85rem 1.4rem',
                  justifyContent: 'center', marginTop: '0.3rem',
                  opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Publishing…' : 'Publish my offer'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
                Your profile will be reviewed for the <strong style={{ color: 'var(--rihla-pine)' }}>verified local guide</strong> seal.
              </p>
            </form>
          )}
        </div>
      </main>
  );
}
