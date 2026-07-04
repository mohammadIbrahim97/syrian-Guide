'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function NavActions() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <div className="mock-nav-actions">
      {status === 'loading' ? (
        <span style={{ fontSize: '14px', color: 'var(--neutral-gray)' }}>…</span>
      ) : session?.user ? (
        <>
          <Link href="/bookings" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>My bookings</Link>
          {role === 'GUIDE' ? (
            <Link href="/account" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>Guide dashboard</Link>
          ) : (
            <Link href="/apply" className="btn btn-pill btn-sm btn-primary">Become a host</Link>
          )}
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--neutral-dark)' }}>
            {session.user.name || session.user.email?.split('@')[0]}
          </span>
          <button
            onClick={() => signOut()}
            className="mock-nav-link"
            style={{ fontSize: '15px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-gray)' }}
          >
            Log out
          </button>
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
