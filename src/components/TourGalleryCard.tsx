'use client';

import React, { useState, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);
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
    <section style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '32px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0' }}>Tour gallery</h2>
      <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: '0 0 24px 0' }}>
        Show travelers what a day with you looks like — photos of your past tours appear on your
        public profile. Up to {MAX_PHOTOS} photos ({photos.length}/{MAX_PHOTOS} used). JPEG, PNG, or WebP, up to 7&nbsp;MB each.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {photos.map((photo) => (
          <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
            <img src={photo.url} alt="Tour photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button
              type="button"
              onClick={() => onRemove(photo.id)}
              disabled={loading}
              aria-label="Remove photo"
              style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '16px', lineHeight: 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>
        ))}

        {!atLimit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            style={{ aspectRatio: '1', borderRadius: '12px', border: '2px dashed rgba(0,0,0,0.15)', backgroundColor: 'var(--neutral-light)', color: 'var(--neutral-gray)', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '26px', lineHeight: 1 }}>+</span>
            {loading ? 'Uploading…' : 'Add photo'}
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} style={{ display: 'none' }} />
      {error && <div style={{ color: '#DC2626', fontSize: '13px', marginTop: '16px' }}>{error}</div>}
    </section>
  );
}
