'use client';

import React, { useState } from 'react';
import Avatar from './Avatar';
import PhotoLightbox from './PhotoLightbox';

// The guide's profile avatar. When a real photo is set it becomes
// click-to-enlarge in the same lightbox as the tour gallery; an
// initials-only avatar isn't clickable — there's nothing to enlarge.
export default function ProfilePhoto({
  image,
  name,
  background,
}: {
  image: string | null;
  name: string | null;
  background: string;
}) {
  const [open, setOpen] = useState(false);

  const circle = (
    <div className="rihla-avatar" style={{ width: '96px', height: '96px', background }}>
      <Avatar image={image} name={name} fontSize={36} />
    </div>
  );

  if (!image) return circle;

  const label = name ? `${name}'s profile photo` : 'Guide profile photo';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge ${label}`}
        style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: '50%', display: 'block' }}
      >
        {circle}
      </button>

      <PhotoLightbox
        photos={[{ id: 'profile', url: image }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
        describe={() => label}
      />
    </>
  );
}
