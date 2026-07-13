'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

// Avatar fallback gradient (Syria motif, per the dashboard design)
const MOTIF_BG = 'radial-gradient(90% 120% at 20% 0%, #0a5148, transparent 60%), linear-gradient(150deg,#054239,#4a151e)';

export default function ProfilePhotoCard({
  currentImage,
  name,
}: {
  currentImage: string | null;
  name: string | null;
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
      setError('Image too large (max 5 MB).');
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
      const res = await fetch('/api/guides/photo', { method: 'POST', body: fd });
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
      const res = await fetch('/api/guides/photo', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not remove photo');
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

  const shownImage = preview ?? currentImage;

  return (
    <section className="rihla-panel" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.35rem', fontWeight: 500, margin: '0 0 0.3rem 0', color: 'var(--rihla-ink)' }}>Profile photo</h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0' }}>
        A clear photo of yourself helps travelers trust and choose you. JPEG, PNG, or WebP, up to 5&nbsp;MB.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', flexWrap: 'wrap' }}>
        <div className="rihla-avatar" style={{ width: '88px', height: '88px', background: MOTIF_BG }}>
          {shownImage ? (
            <img src={shownImage} alt={name ?? 'Guide'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2.1rem', fontWeight: 500, color: 'var(--rihla-cream)' }}>
              {(name ?? 'G').substring(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="rihla-btn-ghost rihla-upload-label" style={{ position: 'relative', fontSize: '0.85rem', padding: '0.5rem 1.1rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              <input type="file" accept={ACCEPT} onChange={onPick} disabled={loading} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
              Choose photo
            </label>
            {file && (
              <button type="button" onClick={onSave} disabled={loading} className="rihla-btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', lineHeight: 1.4, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            )}
            {currentImage && !file && (
              <button type="button" onClick={onRemove} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--rihla-ink-soft)', fontSize: '0.85rem', fontFamily: 'var(--rihla-font-body)', textDecoration: 'underline', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
          {error && <div className="rihla-error" role="status" aria-live="polite">{error}</div>}
        </div>
      </div>
    </section>
  );
}
