'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 7 * 1024 * 1024;

// Country motif gradients — same palette as the home card fallbacks
const MOTIF_BG: Record<string, string> = {
  Syria: 'radial-gradient(90% 120% at 20% 0%, #0a5148, transparent 60%), linear-gradient(150deg,#054239,#4a151e)',
  Lebanon: 'radial-gradient(90% 120% at 80% 0%, #0a5148, transparent 55%), linear-gradient(150deg,#002623,#428177)',
  Jordan: 'radial-gradient(90% 120% at 30% 0%, #7a2530, transparent 60%), linear-gradient(150deg,#4a151e,#988561)',
};

export default function CoverPhotoCard({
  currentCover,
  country,
}: {
  currentCover: string | null;
  country: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('Image too large (max 7 MB).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSave = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/guides/cover', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setLoading(false);
        return;
      }
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const onRemove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/guides/cover', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not remove cover');
        setLoading(false);
        return;
      }
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const shownCover = preview ?? currentCover;

  return (
    <section className="rihla-panel" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.35rem', fontWeight: 500, margin: '0 0 0.3rem 0', color: 'var(--rihla-ink)' }}>Cover image</h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0' }}>
        The banner behind your name on your profile and guide card. A wide landscape photo works
        best — without one, your city&apos;s motif is shown. JPEG, PNG, or WebP, up to 7&nbsp;MB.
      </p>

      <div
        style={{
          width: '100%', aspectRatio: '3 / 1', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid var(--rihla-border-bronze)', marginBottom: '1rem',
          background: MOTIF_BG[country] ?? MOTIF_BG.Syria, display: 'grid', placeItems: 'center',
        }}
      >
        {shownCover ? (
          <img src={shownCover} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={{ width: '64px', height: '64px', color: 'rgba(237,235,224,0.9)' }}>
            <path d="M40 8c-6 6-6 14 0 18 6-4 6-12 0-18z" />
            <line x1="40" y1="26" x2="40" y2="34" />
            <path d="M26 72V44a14 14 0 0128 0v28" />
            <path d="M26 44h28M20 72h40" strokeLinecap="round" />
            <path d="M40 44v28M33 72V54a7 7 0 0114 0v18" />
          </svg>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="rihla-btn-ghost rihla-upload-label" style={{ position: 'relative', fontSize: '0.85rem', padding: '0.5rem 1.1rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
          <input type="file" accept={ACCEPT} onChange={onPick} disabled={loading} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
          Choose image
        </label>
        {file && (
          <button type="button" onClick={onSave} disabled={loading} className="rihla-btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', lineHeight: 1.4, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        )}
        {currentCover && !file && (
          <button type="button" onClick={onRemove} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--rihla-ink-soft)', fontSize: '0.85rem', fontFamily: 'var(--rihla-font-body)', textDecoration: 'underline', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
      {error && <div className="rihla-error" role="status" aria-live="polite" style={{ marginTop: '0.9rem' }}>{error}</div>}
    </section>
  );
}
