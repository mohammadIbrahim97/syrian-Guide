export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { getVerifiedBooking } from '@/lib/booking-confirmation';

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;

  // Confirms only after verifying with Stripe that the session was paid —
  // the session_id in the URL alone proves nothing.
  const booking = session_id ? await getVerifiedBooking(session_id) : null;
  const confirmed = booking?.status === 'CONFIRMED';

  return (
    <div className="layout-wrapper" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ padding: 'var(--sz-16) var(--sz-32)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', margin: '-20px 0 -20px -10px' }} />
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sz-48)' }}>
        <div className="animate-fade-up" style={{
          textAlign: 'center', maxWidth: '560px', backgroundColor: 'var(--color-white)',
          borderRadius: '16px', padding: '64px 48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>{confirmed ? '🎉' : '⏳'}</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            {confirmed ? 'Booking Confirmed!' : 'Payment Processing…'}
          </h1>

          {booking ? (
            <>
              <p style={{ fontSize: '16px', color: 'var(--neutral-gray)', marginBottom: '32px', lineHeight: 1.6 }}>
                {confirmed ? (
                  <>
                    Your tour with <strong>{booking.guide.user.name}</strong> has been booked for{' '}
                    <strong>{new Date(booking.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</strong>.
                  </>
                ) : (
                  <>
                    Your reservation with <strong>{booking.guide.user.name}</strong> is held while we wait for
                    payment confirmation. Refresh this page in a moment, or check{' '}
                    <Link href="/bookings" style={{ color: 'var(--brand-indigo)', fontWeight: 600 }}>your bookings</Link> later.
                  </>
                )}
              </p>

              <div style={{
                backgroundColor: 'var(--neutral-light)', borderRadius: '12px', padding: '24px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', marginBottom: '32px',
              }}>
                <div>
                  {booking.durationHours ? (
                    <>
                      <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Duration</div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>{booking.durationHours} hour(s)</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Participants</div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>{booking.participants} person(s)</div>
                    </>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>{confirmed ? 'Total Paid' : 'Total'}</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>€{booking.totalPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Status</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: confirmed ? 'var(--color-success)' : 'var(--brand-sand)' }}>
                    {confirmed ? '✓ Confirmed' : 'Pending payment'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Booking ID</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace' }}>{booking.id.slice(0, 12)}…</div>
                </div>
              </div>

              {confirmed && (
                <div style={{
                  backgroundColor: 'var(--brand-indigo-soft)', borderRadius: '12px', padding: '16px 24px',
                  fontSize: '15px', lineHeight: 1.6, textAlign: 'left', marginBottom: '32px',
                }}>
                  <strong>Next step:</strong> email your guide at{' '}
                  <a href={`mailto:${booking.guide.user.email}`} style={{ color: 'var(--brand-indigo)', fontWeight: 600 }}>
                    {booking.guide.user.email}
                  </a>{' '}
                  to agree on a meeting point. You&apos;ll always find this booking under My bookings.
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '16px', color: 'var(--neutral-gray)', marginBottom: '32px' }}>
              We couldn&apos;t find a booking for this link. If you just completed a payment, it may take a
              moment to appear.
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/bookings" className="btn btn-secondary btn-pill" style={{ padding: '14px 32px', fontSize: '16px' }}>
              View My Bookings
            </Link>
            <Link href="/" className="btn btn-primary btn-pill" style={{ padding: '14px 32px', fontSize: '16px' }}>
              Explore More Tours
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
