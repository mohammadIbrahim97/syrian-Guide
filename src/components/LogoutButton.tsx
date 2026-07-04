'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
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
      className="mock-nav-link"
      style={{ fontSize: '15px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-gray)' }}
    >
      Log out
    </button>
  );
}
