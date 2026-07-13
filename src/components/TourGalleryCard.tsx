'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 7 * 1024 * 1024;
const MAX_PHOTOS = 10;

export default function TourGalleryCard({
  photos,
}: {
  photos: { id: string; url: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const atLimit = photos.length >= MAX_PHOTOS;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file after an error
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('Image too large (max 7 MB).');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set('file', f);
      const res = await fetch('/api/guides/gallery', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  const onRemove = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/guides/gallery?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not remove photo');
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <section className="rihla-panel" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.35rem', fontWeight: 500, margin: '0 0 0.3rem 0', color: 'var(--rihla-ink)' }}>Tour gallery</h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0' }}>
        Show travelers what a day with you looks like — photos of your past tours appear on your
        public profile. Up to {MAX_PHOTOS} photos ({photos.length}/{MAX_PHOTOS} used). JPEG, PNG, or WebP, up to 7&nbsp;MB each.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
        {photos.map((photo) => (
          <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--rihla-border-bronze)' }}>
            <img src={photo.url} alt="Tour photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={() => onRemove(photo.id)}
              disabled={loading}
              aria-label="Remove photo"
              style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,38,35,0.65)', color: 'var(--rihla-cream)', fontSize: '16px', lineHeight: 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>
        ))}

        {!atLimit && (
          <label
            className="rihla-dashed rihla-upload-label rihla-gallery-add"
            style={{ position: 'relative', aspectRatio: '1', fontSize: '0.85rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
          >
            <input type="file" accept={ACCEPT} onChange={onPick} disabled={loading} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />
            <span aria-hidden="true" style={{ fontSize: '1.6rem', lineHeight: 1, color: 'var(--rihla-bronze)' }}>+</span>
            {loading ? 'Uploading…' : 'Add photo'}
          </label>
        )}
      </div>

      {error && <div className="rihla-error" role="status" aria-live="polite" style={{ marginTop: '1rem' }}>{error}</div>}
    </section>
  );
}
