'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function NavActions() {
  const { data: session, status } = useSession();

  return (
    <div className="mock-nav-actions">
      <Link href="/destinations" className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500 }}>Destinations</Link>
      <button className="mock-nav-link" style={{ fontSize: '15px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>EUR</button>
      
      {status === 'loading' ? (
        <span style={{ fontSize: '14px', color: 'var(--neutral-gray)' }}>…</span>
      ) : session?.user ? (
        <>

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
        </>
      )}
    </div>
  );
}
