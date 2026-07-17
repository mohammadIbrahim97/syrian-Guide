import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const metadata = { title: 'Legal Notice — Rihla' };

const h2Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--rihla-ink)', margin: '2rem 0 0.7rem 0' };
const h3Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-body)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)', margin: '1.2rem 0 0.6rem 0' };
const pStyle: React.CSSProperties = { fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rihla-ink-soft)', margin: '0 0 1rem 0' };
const strongStyle: React.CSSProperties = { color: 'var(--rihla-ink)' };

export default function ImpressumPage() {
  return (
    <div className="rihla-page">
      <RihlaHeader />

      {/* Content */}
      <main className="rihla-legal-main" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card" style={{ maxWidth: '800px' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)' }}>Legal Notice</h1>
          <p style={{ ...pStyle, margin: '0 0 2rem 0' }}>
            Rihla is a platform for discovering and booking tours with local guides across Syria, Lebanon and Jordan. It is operated from Syria. The details below identify the operator responsible for this service.
          </p>

          <h2 style={h2Style}>Operator</h2>
          <p style={pStyle}>
            <strong style={strongStyle}>Rihla</strong><br />
            The operator&rsquo;s full name and postal address will be published here before launch.
          </p>

          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            A contact email address will be published here before launch.
          </p>

          <h2 style={h2Style}>Disclaimer</h2>

          <h3 style={h3Style}>Liability for content</h3>
          <p style={pStyle}>
            The content of our pages is created with care. We are responsible for our own content on these pages under the applicable law. However, we are not obliged to monitor third-party information transmitted or stored on the platform, or to investigate circumstances that indicate unlawful activity. Where we become aware of a specific infringement, we will remove the content concerned without delay.
          </p>

          <h3 style={h3Style}>Liability for links</h3>
          <p style={pStyle}>
            Our service contains links to external third-party websites over whose content we have no control. We therefore accept no responsibility for such external content. The respective provider or operator of a linked site is always responsible for its content. The linked pages were checked for possible legal violations at the time of linking, and no unlawful content was apparent. Ongoing monitoring of linked pages is not reasonable without concrete evidence of an infringement. Where we become aware of legal violations, we will remove the links concerned without delay.
          </p>
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
