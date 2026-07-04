export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NavActions from '@/components/NavActions';
import BookingStatusBadge from '@/components/BookingStatusBadge';

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
    <div className="layout-wrapper" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: 'var(--sz-16) var(--sz-32)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="mock-nav" style={{ boxShadow: 'none', border: 'none', padding: '0' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', margin: '-20px 0 -20px -10px' }} />
            </Link>
            <div style={{ flex: 1, padding: '0 40px' }}></div>
            <NavActions />
          </div>
        </div>
      </header>

      <main style={{ flex: 1, backgroundColor: 'var(--neutral-light)', padding: 'var(--sz-48) var(--sz-32)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 6px 0' }}>My bookings</h1>
          <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', margin: '0 0 32px 0' }}>
            Your tours with local guides. A booking is confirmed once payment goes through.
          </p>

          {bookings.length === 0 ? (
            <div style={{
              backgroundColor: 'white', borderRadius: '16px', padding: '48px', textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', marginBottom: '24px' }}>
                You haven&apos;t booked a guide yet.
              </p>
              <Link href="/" className="btn btn-primary btn-pill" style={{ padding: '12px 28px', fontSize: '15px' }}>
                Find a guide
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.map(b => (
                <div key={b.id} style={{
                  backgroundColor: 'white', borderRadius: '16px', padding: '24px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <Link href={`/guides/${b.guideId}`} style={{ fontSize: '17px', fontWeight: 700, color: 'var(--neutral-dark)', textDecoration: 'none' }}>
                      {b.guide.user.name}
                    </Link>
                    <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginTop: '4px' }}>
                      {formatDate(b.date)}
                      {b.slot ? ` · ${b.slot.startTime}–${b.slot.endTime}` : ''}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginTop: '2px' }}>
                      {b.durationHours ? `${b.durationHours} hour(s)` : `${b.participants} person(s)`} · {b.guide.city}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>€{b.totalPrice.toFixed(2)}</div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
