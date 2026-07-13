'use client';

import React, { useState, useCallback } from 'react';
import PhotoLightbox from './PhotoLightbox';

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

  const move = useCallback(
    (delta: number) =>
      setActiveIndex((i) => (i === null ? null : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  const describe = (i: number) =>
    guideName
      ? `Past tour with ${guideName} (${i + 1} of ${photos.length})`
      : `Past tour photo ${i + 1} of ${photos.length}`;

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

      <PhotoLightbox
        photos={photos}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={move}
        describe={describe}
      />
    </>
  );
}
