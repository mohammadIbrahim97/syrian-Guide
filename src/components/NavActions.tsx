import React from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export default async function NavActions() {
  const user = await getUser();

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
