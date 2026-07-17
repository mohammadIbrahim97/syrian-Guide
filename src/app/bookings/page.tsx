export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';
import BookingStatusBadge from '@/components/BookingStatusBadge';
import GuidePhoneLink from '@/components/GuidePhoneLink';

// Avatar circle gradients per country (same palette as the home card motifs)
const AVATAR_BG: Record<string, string> = {
  Syria: 'radial-gradient(90% 120% at 20% 0%, #0a5148, transparent 60%), linear-gradient(150deg,#054239,#4a151e)',
  Lebanon: 'radial-gradient(90% 120% at 80% 0%, #0a5148, transparent 55%), linear-gradient(150deg,#002623,#428177)',
  Jordan: 'radial-gradient(90% 120% at 30% 0%, #7a2530, transparent 60%), linear-gradient(150deg,#4a151e,#988561)',
};

export default async function MyBookingsPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      guide: { include: { user: true } },
      slot: true,
    },
    orderBy: { date: 'desc' },
    take: 50,
  });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="rihla-page">
      <RihlaHeader />

      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 24px 5rem' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Your journeys</span>
          <h1 style={{
            fontFamily: 'var(--rihla-font-display)',
            fontSize: '2.2rem',
            fontWeight: 500,
            lineHeight: 1.12,
            margin: '0.7rem 0 0.4rem 0',
            color: 'var(--rihla-ink)',
          }}>
            My bookings
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--rihla-ink-soft)', margin: '0 0 2rem 0', maxWidth: '60ch' }}>
            A booking is confirmed once payment goes through — you then get your
            guide&apos;s contact details to agree on a meeting point.
          </p>

          {bookings.length === 0 ? (
            <div className="rihla-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0' }}>
                You haven&apos;t booked a guide yet.
              </p>
              <Link href="/" className="rihla-btn" style={{ fontSize: '0.92rem', padding: '0.7rem 1.4rem' }}>
                Find a guide
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map((b, index) => (
                <div
                  key={b.id}
                  className="rihla-panel rihla-fade-up"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    animationDelay: `${(index % 3) * 80}ms`,
                  }}
                >
                  <div
                    className="rihla-avatar"
                    aria-hidden="true"
                    style={{ width: '56px', height: '56px', background: AVATAR_BG[b.guide.country] ?? AVATAR_BG.Syria }}
                  >
                    <span style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.4rem', fontWeight: 500, color: 'var(--rihla-cream)' }}>
                      {(b.guide.user.name ?? 'G').substring(0, 1)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <Link href={`/guides/${b.guideId}`} style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.2rem', fontWeight: 500, color: 'var(--rihla-ink)', textDecoration: 'none' }}>
                      {b.guide.user.name}
                    </Link>
                    <div style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', marginTop: '0.2rem' }}>
                      {formatDate(b.date)}
                      {b.slot ? ` · ${b.slot.startTime}–${b.slot.endTime}` : ''}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', marginTop: '0.1rem' }}>
                      {b.durationHours ? `${b.durationHours} hour(s)` : `${b.participants} person(s)`} · {b.guide.city}
                    </div>
                    {/* Contact is only revealed once the booking is paid, so guide contact
                        details can't be harvested by starting checkouts without paying. */}
                    {b.status === 'CONFIRMED' && (
                      <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        <a href={`mailto:${b.guide.user.email}`} className="rihla-link">
                          {b.guide.user.email}
                        </a>
                        {b.guide.phone && (
                          <>
                            <span style={{ color: 'var(--rihla-bronze-text)' }}> · </span>
                            <GuidePhoneLink phone={b.guide.phone} />
                          </>
                        )}
                        <span style={{ color: 'var(--rihla-ink-soft)' }}> · agree on a meeting point</span>
                      </div>
                    )}
                  </div>
                  <div className="rihla-booking-total">
                    <div className="rihla-booking-total-price">${b.totalPrice.toFixed(2)}</div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
