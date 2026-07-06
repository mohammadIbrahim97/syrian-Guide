'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export default function ProfilePhotoCard({
  currentImage,
  name,
}: {
  currentImage: string | null;
  name: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
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
    <section style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '32px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0' }}>Profile photo</h2>
      <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: '0 0 24px 0' }}>
        A clear photo of yourself helps travelers trust and choose you. JPEG, PNG, or WebP, up to 5&nbsp;MB.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0 }}>
          <Avatar image={shownImage} name={name} fontSize={34} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} style={{ border: '1px solid rgba(0,0,0,0.12)', background: 'white', borderRadius: '999px', padding: '8px 18px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Choose photo
            </button>
            {file && (
              <button type="button" onClick={onSave} disabled={loading} className="btn btn-primary" style={{ borderRadius: '999px', padding: '8px 20px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            )}
            {currentImage && !file && (
              <button type="button" onClick={onRemove} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--neutral-gray)', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
          {error && <div style={{ color: '#DC2626', fontSize: '13px' }}>{error}</div>}
        </div>
      </div>
    </section>
  );
}
