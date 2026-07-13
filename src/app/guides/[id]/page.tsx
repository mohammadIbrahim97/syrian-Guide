export const dynamic = 'force-dynamic';

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BookingWidget from '@/components/BookingWidget';
import Avatar from '@/components/Avatar';
import TourGallery from '@/components/TourGallery';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';
import { getUser } from '@/lib/auth';

// Band + avatar gradients per country — same values as the home guide cards
const PHOTO_BG: Record<string, string> = {
  Syria: 'radial-gradient(90% 120% at 20% 0%, #0a5148, transparent 60%), linear-gradient(150deg,#054239,#4a151e)',
  Lebanon: 'radial-gradient(90% 120% at 80% 0%, #0a5148, transparent 55%), linear-gradient(150deg,#002623,#428177)',
  Jordan: 'radial-gradient(90% 120% at 30% 0%, #7a2530, transparent 60%), linear-gradient(150deg,#4a151e,#988561)',
};

// Tag chips alternate between teal and gold tints
// (gold text darkened to #6f6142 so small chip labels clear WCAG AA, as on home)
const TAG_STYLES = [
  { bg: 'rgba(66,129,119,0.14)', color: '#054239' },
  { bg: 'rgba(185,167,121,0.24)', color: '#6f6142' },
  { bg: 'rgba(66,129,119,0.14)', color: '#054239' },
];

export default async function GuideProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();

  const guide = await prisma.guide.findUnique({
    where: { id },
    include: {
      user: true,
      photos: { orderBy: { createdAt: 'asc' }, select: { id: true, url: true } }
    }
  });

  if (!guide) return notFound();

  const isStudent = guide.guideType === 'STUDENT';
  const firstName = guide.user.name?.split(' ')[0] ?? 'Guide';
  const motifCountry = PHOTO_BG[guide.country] ? guide.country : 'Syria';
  const chips = guide.tags.length > 0 ? guide.tags : guide.languages;

  return (
    <div className="rihla-page">
      <RihlaHeader />

      {/* Country band (or the guide's cover photo) the content shell pulls up over */}
      <section style={{
        position: 'relative',
        height: '280px',
        overflow: 'hidden',
        borderBottom: '1px solid var(--rihla-border-gold)',
        ...(guide.coverImage ? {} : { background: PHOTO_BG[motifCountry] }),
      }}>
        {guide.coverImage && (
          <img src={guide.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {/* Golden dune lines */}
        <svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.14, pointerEvents: 'none', width: '100%', height: '100%' }}>
          <g fill="none" stroke="#b9a779" strokeWidth="1">
            <path d="M-50 120 Q300 40 600 120 T1250 120" />
            <path d="M-50 190 Q300 110 600 190 T1250 190" />
            <path d="M-50 260 Q300 180 600 260 T1250 260" />
            <path d="M-50 330 Q300 250 600 330 T1250 330" />
            <path d="M-50 400 Q300 320 600 400 T1250 400" />
          </g>
        </svg>
      </section>

      <main style={{ flexGrow: 1, paddingBottom: '5rem' }}>
        <div className="rihla-shell" style={{ marginTop: '-120px', position: 'relative', zIndex: 10 }}>
          <div className="rihla-profile-columns" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

            {/* Main profile card */}
            <div className="rihla-panel rihla-fade-up rihla-profile-main" style={{ flex: 1, minWidth: 0, padding: '2.5rem' }}>

              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="rihla-avatar" style={{ width: '96px', height: '96px', background: PHOTO_BG[motifCountry] }}>
                  <Avatar image={guide.user.image} name={guide.user.name} fontSize={36} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: 'clamp(1.9rem,4vw,2.4rem)', fontWeight: 500, lineHeight: 1.12, letterSpacing: '-0.01em', margin: 0, color: 'var(--rihla-ink)' }}>
                    {guide.user.name}
                  </h1>
                  <div style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', marginTop: '0.25rem' }}>
                    {isStudent ? 'Student guide' : 'Professional guide'} in {guide.city}, {guide.country}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    {guide.isVerified && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--rihla-pine)' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: '#988561' }}>
                          <path d="M8 1l1.9 1.2 2.2-.2.9 2 1.8 1.3-.6 2.1.6 2.1-1.8 1.3-.9 2-2.2-.2L8 15l-1.9-1.2-2.2.2-.9-2L1.2 10.9l.6-2.1-.6-2.1L3 5.4l.9-2 2.2.2L8 1z" fill="currentColor" />
                          <path d="M5.5 8.2l1.7 1.7 3.3-3.6" stroke="#054239" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Verified local guide
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--rihla-ink)' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="#988561" aria-hidden="true"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.9 3.8 14l.8-4.7L1.2 6l4.7-.7z" /></svg>
                      {guide.rating.toFixed(1)} <small style={{ color: 'var(--rihla-ink-soft)', fontWeight: 400 }}>· {guide.reviewCount} trips</small>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--rihla-border-bronze)', margin: '2rem 0' }}></div>

              {/* Bio */}
              <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>The guide</span>
              <h2 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.6rem', fontWeight: 500, margin: '0.6rem 0 0.8rem 0', color: 'var(--rihla-ink)' }}>
                About {firstName}
              </h2>
              <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--rihla-ink-soft)', margin: '0 0 1.6rem 0', whiteSpace: 'pre-wrap' }}>
                {guide.bio}
              </p>

              {chips.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0 0 1.6rem 0' }}>
                  {chips.map((label, i) => (
                    <span key={label} style={{ fontSize: '0.78rem', fontWeight: 500, padding: '0.32rem 0.75rem', borderRadius: '999px', background: TAG_STYLES[i % 3].bg, color: TAG_STYLES[i % 3].color, display: 'inline-flex', alignItems: 'center' }}>
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Fact grid */}
              <div className="rihla-inset" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4rem' }}>
                {isStudent ? (
                  <div>
                    <div className="rihla-microlabel" style={{ marginBottom: '0.2rem' }}>University</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>{guide.university ?? '—'}</div>
                  </div>
                ) : (
                  <div>
                    <div className="rihla-microlabel" style={{ marginBottom: '0.2rem' }}>Package duration</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>{guide.packageDuration ? `${guide.packageDuration / 60} hours` : '—'}</div>
                  </div>
                )}
                <div>
                  <div className="rihla-microlabel" style={{ marginBottom: '0.2rem' }}>Languages</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>{guide.languages.join(', ')}</div>
                </div>
                <div>
                  <div className="rihla-microlabel" style={{ marginBottom: '0.2rem' }}>Group size</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>Up to {guide.maxGroupSize} {guide.maxGroupSize === 1 ? 'person' : 'people'}</div>
                </div>
                <div>
                  <div className="rihla-microlabel" style={{ marginBottom: '0.2rem' }}>Location</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>{guide.city}, {guide.country}</div>
                </div>
              </div>

              {/* Tour Gallery (issue #26) — hidden when the guide has no photos */}
              {guide.photos.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid var(--rihla-border-bronze)', margin: '2rem 0' }}></div>
                  <h2 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.6rem', fontWeight: 500, margin: '0 0 1rem 0', color: 'var(--rihla-ink)' }}>
                    Photos from past tours
                  </h2>
                  <TourGallery photos={guide.photos} guideName={guide.user.name} />
                </>
              )}

            </div>

            {/* Booking sidebar */}
            <BookingWidget
              guideId={guide.id}
              guideType={guide.guideType}
              hourlyRate={guide.hourlyRate}
              packagePrice={guide.packagePrice}
              maxGroupSize={guide.maxGroupSize}
              rating={guide.rating}
              reviewCount={guide.reviewCount}
              isLoggedIn={!!user}
            />

          </div>
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
