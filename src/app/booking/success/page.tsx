export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { getVerifiedBooking } from '@/lib/booking-confirmation';
import GuidePhoneLink from '@/components/GuidePhoneLink';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;

  // Confirms only after verifying with Stripe that the session was paid —
  // the session_id in the URL alone proves nothing.
  const booking = session_id ? await getVerifiedBooking(session_id) : null;
  const confirmed = booking?.status === 'CONFIRMED';

  return (
    <div className="rihla-page">
      <RihlaHeader />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card rihla-fade-up rihla-success-card" style={{ textAlign: 'center', maxWidth: '560px' }}>
          {/* Gold double-ring seal: teal check when confirmed, bronze clock while pending */}
          <svg viewBox="0 0 64 64" style={{ width: '88px', height: '88px', marginBottom: '1.2rem' }} aria-hidden="true">
            <circle cx="32" cy="32" r="29" fill="none" stroke="#b9a779" strokeWidth="1.6" />
            <circle cx="32" cy="32" r="23" fill="none" stroke="#b9a779" strokeWidth="0.8" strokeDasharray="1.5 3.5" />
            {confirmed ? (
              <path d="M24 33l6 6 11-13" stroke="#428177" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M32 20v12l8 5" stroke="#988561" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            )}
          </svg>

          <h1 style={{
            fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500,
            lineHeight: 1.12, margin: '0 0 0.7rem 0', color: 'var(--rihla-ink)',
          }}>
            {confirmed ? 'Booking confirmed.' : 'Payment processing…'}
          </h1>

          {booking ? (
            <>
              <p style={{ fontSize: '0.98rem', color: 'var(--rihla-ink-soft)', margin: '0 0 2rem 0' }}>
                {confirmed ? (
                  <>
                    Your tour with <strong>{booking.guide.user.name}</strong> has been booked for{' '}
                    <strong>{new Date(booking.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</strong>.
                  </>
                ) : (
                  <>
                    Your reservation with <strong>{booking.guide.user.name}</strong> is held while we wait for
                    payment confirmation. Refresh in a moment, or check{' '}
                    <Link href="/bookings" className="rihla-link">your bookings</Link> later.
                  </>
                )}
              </p>

              <div className="rihla-inset" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
                textAlign: 'left', marginBottom: '2rem',
              }}>
                <div>
                  {booking.durationHours ? (
                    <>
                      <div className="rihla-microlabel" style={{ marginBottom: '0.15rem' }}>Duration</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>{booking.durationHours} hour(s)</div>
                    </>
                  ) : (
                    <>
                      <div className="rihla-microlabel" style={{ marginBottom: '0.15rem' }}>Participants</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>{booking.participants} person(s)</div>
                    </>
                  )}
                </div>
                <div>
                  <div className="rihla-microlabel" style={{ marginBottom: '0.15rem' }}>{confirmed ? 'Total paid' : 'Total'}</div>
                  <div style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>
                    €{booking.totalPrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="rihla-microlabel" style={{ marginBottom: '0.15rem' }}>Status</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: confirmed ? 'var(--rihla-pine)' : 'var(--rihla-bronze-text)' }}>
                    {confirmed ? '✓ Confirmed' : 'Pending payment'}
                  </div>
                </div>
                <div>
                  <div className="rihla-microlabel" style={{ marginBottom: '0.15rem' }}>Booking ID</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, fontFamily: 'ui-monospace, Menlo, monospace', color: 'var(--rihla-ink)' }}>
                    {booking.id.slice(0, 12)}…
                  </div>
                </div>
              </div>

              {confirmed && (
                <div className="rihla-dashed" style={{
                  padding: '1rem 1.4rem', fontSize: '0.92rem', lineHeight: 1.6,
                  textAlign: 'left', marginBottom: '2rem', color: 'var(--rihla-ink)',
                }}>
                  <strong>Next step:</strong> email your guide at{' '}
                  <a href={`mailto:${booking.guide.user.email}`} className="rihla-link">
                    {booking.guide.user.email}
                  </a>
                  {booking.guide.phone && (
                    <>
                      {' '}or message them on WhatsApp at <GuidePhoneLink phone={booking.guide.phone} />
                    </>
                  )}{' '}
                  to agree on a meeting point. You&apos;ll always find this booking under My bookings.
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '0.98rem', color: 'var(--rihla-ink-soft)', margin: '0 0 2rem 0' }}>
              We couldn&apos;t find a booking for this link. If you just completed a payment, it may take a
              moment to appear.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/bookings" className="rihla-btn-ghost" style={{ fontSize: '0.92rem', padding: '0.7rem 1.4rem' }}>
              View my bookings
            </Link>
            <Link href="/" className="rihla-btn" style={{ fontSize: '0.92rem', padding: '0.7rem 1.4rem' }}>
              Explore more tours
            </Link>
          </div>
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
