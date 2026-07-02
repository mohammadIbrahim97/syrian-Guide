import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SearchableGuides from '@/components/SearchableGuides';
import NavActions from '@/components/NavActions';

export default async function HomePage() {
  // Fetch initial guides on the server for fast first paint
  const initialGuides = await prisma.guide.findMany({
    include: { user: true },
    take: 20,
    orderBy: { rating: 'desc' }
  });

  return (
    <div className="layout-wrapper" style={{ flexDirection: 'column' }}>
      
      {/* Navigation Header */}
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

      {/* Main Content */}
      <main className="ds-main" style={{ margin: '0 auto', width: '100%', maxWidth: '1200px', padding: '0 var(--sz-32)' }}>
        <SearchableGuides initialGuides={JSON.parse(JSON.stringify(initialGuides))} />
      </main>
      
      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: 'var(--sz-48) var(--sz-32)', marginTop: 'auto', backgroundColor: 'var(--color-white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain', margin: '-10px 0 -10px -10px' }} />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>© 2026 SyriaGuide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
