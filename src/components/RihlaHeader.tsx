import React from 'react';
import Link from 'next/link';
import NavActions from './NavActions';

// Rihla brand mark: gold ring around a teal leaf split by a cream midrib
export function RihlaLogo({ size = 38 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ width: size, height: size, flex: '0 0 auto' }}>
      <circle cx="20" cy="20" r="19" stroke="#b9a779" strokeWidth="1.4" />
      <path d="M20 8 C13 14 13 22 20 32 C27 22 27 14 20 8Z" fill="#428177" />
      <path d="M20 8 C20 16 20 24 20 32" stroke="#edebe0" strokeWidth="1.2" opacity="0.8" />
    </svg>
  );
}

// Shared dark-green Rihla page header (rihla/*.dc.html)
export default function RihlaHeader() {
  return (
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
  );
}
