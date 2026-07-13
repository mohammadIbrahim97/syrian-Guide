export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';
import AvailabilityManager from '@/components/AvailabilityManager';
import BookingStatusBadge from '@/components/BookingStatusBadge';
import ProfilePhotoCard from '@/components/ProfilePhotoCard';
import CoverPhotoCard from '@/components/CoverPhotoCard';
import TourGalleryCard from '@/components/TourGalleryCard';

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--rihla-font-display)', fontSize: '1.35rem', fontWeight: 500,
  margin: '0 0 0.3rem 0', color: 'var(--rihla-ink)',
};

const sectionLeadStyle: React.CSSProperties = {
  fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0',
};

const thStyle: React.CSSProperties = { padding: '0.6rem 0.75rem' };

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rihla-page">
      <RihlaHeader />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 24px 5rem' }}>{children}</div>
      </main>
      <RihlaFooter />
    </div>
  );
}

export default async function GuideDashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const guide = await prisma.guide.findUnique({
    where: { userId: user.id },
  });

  if (!guide) {
    return (
      <PageShell>
        <div className="rihla-form-card" style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.8rem', fontWeight: 500, margin: '0 0 0.7rem 0', color: 'var(--rihla-ink)' }}>
            Guide dashboard
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.6rem 0' }}>
            You don&apos;t have a guide profile yet. Publish your offer to start welcoming travelers.
          </p>
          <Link href="/apply" className="rihla-btn" style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}>
            Become a guide
          </Link>
        </div>
      </PageShell>
    );
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [slots, bookings, photos] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: { guideId: guide.id, date: { gte: today } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.booking.findMany({
      where: { guideId: guide.id },
      include: { user: true, slot: true },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.guidePhoto.findMany({
      where: { guideId: guide.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, url: true },
    }),
  ]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  const firstName = user.name?.trim().split(/\s+/)[0];

  return (
    <PageShell>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
        <div>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Guide dashboard</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2.2rem', fontWeight: 500, lineHeight: 1.12, margin: '0.7rem 0 0.3rem 0', color: 'var(--rihla-ink)' }}>
            Ahlan{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
            {guide.guideType === 'STUDENT' ? 'Student guide' : 'Professional guide'} in {guide.city}, {guide.country}
          </p>
        </div>
        <Link href={`/guides/${guide.id}`} className="rihla-link" style={{ fontSize: '0.92rem' }}>
          View your public profile →
        </Link>
      </div>

      <CoverPhotoCard currentCover={guide.coverImage} country={guide.country} />

      <ProfilePhotoCard currentImage={user.image} name={user.name} />

      {/* Tour gallery (issue #26: up to 10 past-tour photos on the public profile) */}
      <TourGalleryCard photos={photos} />

      {/* Availability (issue: guides must be able to open their calendar) */}
      <section className="rihla-panel" style={{ marginBottom: '1.5rem' }}>
        <h2 style={h2Style}>Your availability</h2>
        <p style={sectionLeadStyle}>
          Tourists can only book the slots you open here.
        </p>
        <AvailabilityManager
          slots={slots.map(s => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
            isBooked: s.isBooked,
          }))}
        />
      </section>

      {/* Incoming bookings */}
      <section className="rihla-panel">
        <h2 style={h2Style}>Incoming bookings</h2>
        <p style={sectionLeadStyle}>
          Contact your guests to agree on a meeting point. Only paid bookings show as confirmed.
        </p>

        {bookings.length === 0 ? (
          <p className="rihla-inset" style={{ padding: '1rem', fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
            No bookings yet. Once a tourist books one of your slots it will appear here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th className="rihla-microlabel" style={thStyle}>Date</th>
                  <th className="rihla-microlabel" style={thStyle}>Time</th>
                  <th className="rihla-microlabel" style={thStyle}>Guest</th>
                  <th className="rihla-microlabel" style={thStyle}>Details</th>
                  <th className="rihla-microlabel" style={thStyle}>Total</th>
                  <th className="rihla-microlabel" style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderTop: '1px solid var(--rihla-border-bronze)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--rihla-ink)' }}>{formatDate(b.date)}</td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--rihla-ink-soft)' }}>
                      {b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '—'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--rihla-ink)' }}>{b.user.name || '—'}</div>
                      <a href={`mailto:${b.user.email}`} className="rihla-link" style={{ fontSize: '0.85rem' }}>{b.user.email}</a>
                    </td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--rihla-ink-soft)' }}>
                      {b.durationHours ? `${b.durationHours} hour(s)` : `${b.participants} person(s)`}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--rihla-ink)' }}>€{b.totalPrice.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}><BookingStatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
