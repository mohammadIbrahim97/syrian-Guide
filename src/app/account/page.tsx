export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NavActions from '@/components/NavActions';
import AvailabilityManager from '@/components/AvailabilityManager';
import BookingStatusBadge from '@/components/BookingStatusBadge';
import ProfilePhotoCard from '@/components/ProfilePhotoCard';

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white', borderRadius: '16px', padding: '32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)',
};

function PageShell({ children }: { children: React.ReactNode }) {
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
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>{children}</div>
      </main>
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
        <div style={{ ...cardStyle, textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>Guide dashboard</h1>
          <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', marginBottom: '24px' }}>
            You don&apos;t have a guide profile yet. Publish your offer to start welcoming travelers.
          </p>
          <Link href="/apply" className="btn btn-primary btn-pill" style={{ padding: '12px 28px', fontSize: '15px' }}>
            Become a guide
          </Link>
        </div>
      </PageShell>
    );
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [slots, bookings] = await Promise.all([
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
  ]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  return (
    <PageShell>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 6px 0' }}>Guide dashboard</h1>
          <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', margin: 0 }}>
            {guide.guideType === 'STUDENT' ? 'Student guide' : 'Professional guide'} in {guide.city}
          </p>
        </div>
        <Link href={`/guides/${guide.id}`} className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 600 }}>
          View your public profile →
        </Link>
      </div>

      <ProfilePhotoCard currentImage={user.image} name={user.name} />

      {/* Availability (issue: guides must be able to open their calendar) */}
      <section style={{ ...cardStyle, marginBottom: '32px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0' }}>Your availability</h2>
        <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: '0 0 24px 0' }}>
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
      <section style={cardStyle}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px 0' }}>Incoming bookings</h2>
        <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: '0 0 24px 0' }}>
          Contact your guests to agree on a meeting point. Only paid bookings show as confirmed.
        </p>

        {bookings.length === 0 ? (
          <p style={{
            padding: '16px', borderRadius: '8px', backgroundColor: 'var(--neutral-light)',
            fontSize: '14px', color: 'var(--neutral-gray)', margin: 0,
          }}>
            No bookings yet. Once a tourist books one of your slots it will appear here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--neutral-gray)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Time</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Guest</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Details</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDate(b.date)}</td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      {b.slot ? `${b.slot.startTime}–${b.slot.endTime}` : '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{b.user.name || '—'}</div>
                      <a href={`mailto:${b.user.email}`} style={{ color: 'var(--brand-indigo)' }}>{b.user.email}</a>
                    </td>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      {b.durationHours ? `${b.durationHours} hour(s)` : `${b.participants} person(s)`}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>€{b.totalPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}><BookingStatusBadge status={b.status} /></td>
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
