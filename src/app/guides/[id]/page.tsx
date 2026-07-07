export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BookingWidget from '@/components/BookingWidget';
import NavActions from '@/components/NavActions';
import Avatar from '@/components/Avatar';
import { getUser } from '@/lib/auth';

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

  return (
    <div className="layout-wrapper" style={{ flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: 'var(--sz-16) var(--sz-32)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="mock-nav" style={{ boxShadow: 'none', border: 'none', padding: '0' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', margin: '-20px 0 -20px -10px' }} />
            </Link>

            <div style={{ flex: 1, padding: '0 40px' }}></div>

            <Link href="/" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500, marginRight: 'var(--sz-16)' }}>All Guides</Link>
            <NavActions />
          </div>
        </div>
      </header>

      <main style={{ backgroundColor: 'var(--neutral-light)', paddingBottom: 'var(--sz-80)' }}>
        {/* Large Cover Image Header */}
        <section style={{ height: '400px', backgroundColor: 'var(--brand-indigo)', position: 'relative' }}>
           <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-coral))', opacity: 0.8 }}></div>
        </section>

        {/* Content Area */}
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--sz-32)', marginTop: '-80px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>

            {/* Left Column (Details) */}
            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>

              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                  <Avatar image={guide.user.image} name={guide.user.name} fontSize={36} />
                </div>
                <div>
                  <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--neutral-dark)' }}>{guide.user.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'var(--neutral-gray)', fontWeight: 500 }}>
                    <span>{isStudent ? 'Student guide' : 'Professional guide'} in {guide.city}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--brand-sand)' }}>★ {guide.rating.toFixed(1)}</span>
                    <span>({guide.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', margin: '32px 0' }}></div>

              {/* Bio Section */}
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>About {guide.user.name?.split(' ')[0]}</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.8, color: 'var(--neutral-gray)', marginBottom: '32px', whiteSpace: 'pre-wrap' }}>
                {guide.bio}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'var(--neutral-light)', padding: '24px', borderRadius: '12px' }}>
                {isStudent ? (
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginBottom: '4px' }}>University</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{guide.university ?? '—'}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginBottom: '4px' }}>Package Duration</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{guide.packageDuration ? `${guide.packageDuration / 60} hours` : '—'}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginBottom: '4px' }}>Languages</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{guide.languages.join(', ')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginBottom: '4px' }}>Group Size</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Up to {guide.maxGroupSize} people</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginBottom: '4px' }}>Location</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{guide.city}</div>
                </div>
              </div>

              {/* Tour Gallery (issue #26) — hidden when the guide has no photos */}
              {guide.photos.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', margin: '32px 0' }}></div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Photos from past tours</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                    {guide.photos.map(photo => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt={guide.user.name ? `Past tour with ${guide.user.name}` : 'Past tour photo'}
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '12px', display: 'block', border: '1px solid rgba(0,0,0,0.06)' }}
                      />
                    ))}
                  </div>
                </>
              )}

            </div>

            {/* Right Column (Booking Widget) */}
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
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: 'var(--sz-48) var(--sz-32)', marginTop: 'auto', backgroundColor: 'var(--color-white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain', margin: '-10px 0 -10px -10px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
              <Link href="/impressum" style={{ color: 'var(--neutral-gray)' }}>Impressum</Link>
              {' · '}
              <Link href="/datenschutz" style={{ color: 'var(--neutral-gray)' }}>Datenschutz</Link>
              {' · '}
              <Link href="/agb" style={{ color: 'var(--neutral-gray)' }}>AGB</Link>
            </p>
            <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>© 2026 SyriaGuide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
