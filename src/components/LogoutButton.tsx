'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// variant="dark" matches the Rihla header nav links; the default keeps the
// original light SyriaGuide look used on inner pages.
export default function LogoutButton({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={variant === 'dark' ? 'rihla-nav-link' : 'mock-nav-link'}
      style={
        variant === 'dark'
          ? { background: 'none', border: 'none', padding: 0, cursor: 'pointer' }
          : { fontSize: '15px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-gray)' }
      }
    >
      Log out
    </button>
  );
}
