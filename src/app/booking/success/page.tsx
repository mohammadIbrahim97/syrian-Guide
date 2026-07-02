import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function BookingSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;

  let booking = null;

  if (session_id) {
    // Try to confirm the booking
    try {
      booking = await prisma.booking.update({
        where: { stripeSessionId: session_id },
        data: { status: 'CONFIRMED' },
        include: {
          guide: { include: { user: true } },
        },
      });
    } catch {
      // Booking may already be confirmed via webhook
      booking = await prisma.booking.findUnique({
        where: { stripeSessionId: session_id },
        include: {
          guide: { include: { user: true } },
        },
      });
    }
  }

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
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>Booking Confirmed!</h1>

          {booking ? (
            <>
              <p style={{ fontSize: '16px', color: 'var(--neutral-gray)', marginBottom: '32px', lineHeight: 1.6 }}>
                Your tour with <strong>{booking.guide.user.name}</strong> has been booked for{' '}
                <strong>{new Date(booking.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</strong>.
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
                  <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Total Paid</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>€{booking.totalPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Status</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-success)' }}>✓ Confirmed</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>Booking ID</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'monospace' }}>{booking.id.slice(0, 12)}…</div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '16px', color: 'var(--neutral-gray)', marginBottom: '32px' }}>
              Your payment was processed successfully. You&apos;ll receive a confirmation shortly.
            </p>
          )}

          <Link href="/" className="btn btn-primary btn-pill" style={{ padding: '14px 32px', fontSize: '16px' }}>
            Explore More Tours
          </Link>
        </div>
      </main>
    </div>
  );
}
