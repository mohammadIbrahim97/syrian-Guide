import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { publicGuideSelect } from '@/lib/public-guide';
import SearchableGuides from '@/components/SearchableGuides';
import NavActions from '@/components/NavActions';

export const dynamic = 'force-dynamic';

// Rihla brand mark: gold ring around a teal leaf split by a cream midrib
function RihlaLogo({ size = 38 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ width: size, height: size, flex: '0 0 auto' }}>
      <circle cx="20" cy="20" r="19" stroke="#b9a779" strokeWidth="1.4" />
      <path d="M20 8 C13 14 13 22 20 32 C27 22 27 14 20 8Z" fill="#428177" />
      <path d="M20 8 C20 16 20 24 20 32" stroke="#edebe0" strokeWidth="1.2" opacity="0.8" />
    </svg>
  );
}

export default async function HomePage() {
  // Fetch initial guides on the server for fast first paint.
  // publicGuideSelect: these rows are serialized into the client payload,
  // so contact fields must never be included here.
  const initialGuides = await prisma.guide.findMany({
    select: publicGuideSelect,
    take: 20,
    orderBy: { rating: 'desc' }
  });

  return (
    <div className="rihla-page">

      {/* Navigation Header */}
      <header style={{ background: 'var(--rihla-forest)', color: 'var(--rihla-cream)', borderBottom: '1px solid var(--rihla-border-gold)' }}>
        <div className="rihla-shell rihla-header-bar" style={{ padding: '16.8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11.2px', textDecoration: 'none' }}>
            <RihlaLogo />
            <span style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--rihla-cream)', letterSpacing: '0.01em' }}>
              Rihla<em style={{ fontStyle: 'normal', color: 'var(--rihla-gold)' }}>.</em>
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', fontSize: '0.92rem', color: 'var(--rihla-mist)' }}>
            <Link href="/" className="rihla-nav-link">Find a guide</Link>
            <NavActions variant="dark" />
          </nav>
        </div>
      </header>

      {/* Hero + searchable guide grid */}
      <SearchableGuides initialGuides={JSON.parse(JSON.stringify(initialGuides))} />

      {/* Footer */}
      <footer style={{ background: 'var(--rihla-forest)', color: 'var(--rihla-mist)', borderTop: '1px solid var(--rihla-border-gold)' }}>
        <div className="rihla-shell" style={{ padding: '2.6rem 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--rihla-font-display)', color: 'var(--rihla-cream)', fontSize: '1.3rem', fontWeight: 600 }}>
              Rihla<em style={{ fontStyle: 'normal', color: 'var(--rihla-gold)' }}>.</em>
            </div>
            <small style={{ fontSize: '0.82rem' }}>Local guides of Syria, Lebanon &amp; Jordan</small>
          </div>
          <small style={{ fontSize: '0.82rem' }}>
            <Link href="/impressum" style={{ color: 'var(--rihla-mist)' }}>Impressum</Link>
            {' · '}
            <Link href="/datenschutz" style={{ color: 'var(--rihla-mist)' }}>Datenschutz</Link>
            {' · '}
            <Link href="/agb" style={{ color: 'var(--rihla-mist)' }}>AGB</Link>
            &nbsp;•&nbsp; © 2026 Rihla
          </small>
        </div>
      </footer>
    </div>
  );
}
