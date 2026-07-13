import React from 'react';
import Link from 'next/link';

// Shared dark-green Rihla page footer (rihla/*.dc.html)
export default function RihlaFooter() {
  return (
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
  );
}
