import React from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

// variant="dark" renders the Rihla header styling (dark green background);
// the default keeps the original light SyriaGuide look used on inner pages.
export default async function NavActions({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const user = await getUser();

  if (variant === 'dark') {
    return (
      <>
        {user ? (
          <>
            <Link href="/bookings" className="rihla-nav-link">My bookings</Link>
            {user.role === 'GUIDE' && (
              <Link href="/account" className="rihla-nav-link">Guide dashboard</Link>
            )}
            <span style={{ color: 'var(--rihla-cream)' }}>
              {user.name || user.email?.split('@')[0]}
            </span>
            <LogoutButton variant="dark" />
          </>
        ) : (
          <Link href="/login" className="rihla-nav-link">Log in</Link>
        )}
        {(!user || user.role !== 'GUIDE') && (
          <Link href="/apply" className="rihla-btn">Become a guide</Link>
        )}
      </>
    );
  }

  return (
    <div className="mock-nav-actions">
      {user ? (
        <>
          <Link href="/bookings" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>My bookings</Link>
          {user.role === 'GUIDE' ? (
            <Link href="/account" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>Guide dashboard</Link>
          ) : (
            <Link href="/apply" className="btn btn-pill btn-sm btn-primary">Become a host</Link>
          )}
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--neutral-dark)' }}>
            {user.name || user.email?.split('@')[0]}
          </span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link href="/login" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>Log in</Link>
          <Link href="/apply" className="btn btn-pill btn-sm btn-primary">Become a host</Link>
        </>
      )}
    </div>
  );
}
