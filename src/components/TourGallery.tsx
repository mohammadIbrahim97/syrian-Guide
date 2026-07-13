'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Public-profile tour gallery: a responsive grid whose photos open in a
// click-to-enlarge lightbox (Escape / backdrop / × to close, ‹ › or arrow
// keys to move between photos).
export default function TourGallery({
  photos,
  guideName,
}: {
  photos: { id: string; url: string }[];
  guideName: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);
  const move = useCallback(
    (delta: number) =>
      setActiveIndex((i) => (i === null ? null : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    // Freeze the page behind the overlay while it's open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, move]);

  const describe = (i: number) =>
    guideName
      ? `Past tour with ${guideName} (${i + 1} of ${photos.length})`
      : `Past tour photo ${i + 1} of ${photos.length}`;

  const navBtnStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: '48px', height: '48px', borderRadius: '50%', border: 'none',
    backgroundColor: 'rgba(237,235,224,0.16)', color: 'var(--rihla-cream)', fontSize: '28px',
    lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            aria-label={`Enlarge ${describe(i)}`}
            style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: '14px', overflow: 'hidden', display: 'block' }}
          >
            <img
              src={photo.url}
              alt=""
              loading="lazy"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '14px', display: 'block', border: '1px solid var(--rihla-border-bronze)' }}
            />
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Tour photo viewer"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,38,35,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{ position: 'absolute', top: '20px', right: '24px', width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(237,235,224,0.16)', color: 'var(--rihla-cream)', fontSize: '26px', lineHeight: 1, cursor: 'pointer' }}
          >
            ×
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); move(-1); }}
              aria-label="Previous photo"
              style={{ ...navBtnStyle, left: '24px' }}
            >
              ‹
            </button>
          )}

          <img
            src={photos[activeIndex].url}
            alt={describe(activeIndex)}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
          />

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); move(1); }}
              aria-label="Next photo"
              style={{ ...navBtnStyle, right: '24px' }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
