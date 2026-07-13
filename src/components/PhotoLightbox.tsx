'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Full-screen click-to-enlarge photo viewer. Escape / backdrop / × to close;
// when onNavigate is given and there's more than one photo, ‹ › or arrow keys
// move between them. Renders nothing while index is null (closed).
export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
  describe,
}: {
  photos: { id: string; url: string }[];
  index: number | null;
  onClose: () => void;
  onNavigate?: (delta: number) => void;
  describe: (i: number) => string;
}) {
  const isOpen = index !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (onNavigate && e.key === 'ArrowRight') onNavigate(1);
      else if (onNavigate && e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', onKey);
    // Freeze the page behind the overlay while it's open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, onNavigate]);

  if (index === null || typeof document === 'undefined') return null;

  const canNavigate = !!onNavigate && photos.length > 1;

  const navBtnStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: '48px', height: '48px', borderRadius: '50%', border: 'none',
    backgroundColor: 'rgba(237,235,224,0.16)', color: 'var(--rihla-cream)', fontSize: '28px',
    lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  // Render into <body> so no transformed ancestor (e.g. the profile card's
  // entrance animation) can trap our position:fixed overlay to its box.
  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,38,35,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{ position: 'absolute', top: '20px', right: '24px', width: '44px', height: '44px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(237,235,224,0.16)', color: 'var(--rihla-cream)', fontSize: '26px', lineHeight: 1, cursor: 'pointer' }}
      >
        ×
      </button>

      {canNavigate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate!(-1); }}
          aria-label="Previous photo"
          style={{ ...navBtnStyle, left: '24px' }}
        >
          ‹
        </button>
      )}

      <img
        src={photos[index].url}
        alt={describe(index)}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
      />

      {canNavigate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate!(1); }}
          aria-label="Next photo"
          style={{ ...navBtnStyle, right: '24px' }}
        >
          ›
        </button>
      )}
    </div>,
    document.body
  );
}
