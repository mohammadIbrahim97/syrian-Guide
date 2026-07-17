import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const metadata = { title: 'Privacy Policy — Rihla' };

const h2Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--rihla-ink)', margin: '2rem 0 0.7rem 0' };
const pStyle: React.CSSProperties = { fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rihla-ink-soft)', margin: '0 0 1rem 0' };
const ulStyle: React.CSSProperties = { ...pStyle, paddingLeft: '1.25rem' };
const strongStyle: React.CSSProperties = { color: 'var(--rihla-ink)' };

export default function DatenschutzPage() {
  return (
    <div className="rihla-page">
      <RihlaHeader />

      {/* Content */}
      <main className="rihla-legal-main" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card" style={{ maxWidth: '800px' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)' }}>Privacy Policy</h1>
          <p style={{ ...pStyle, margin: '0 0 2rem 0' }}>
            Protecting your personal data matters to us. This policy explains which data we process when you use Rihla, why we process it, and what rights you have.
          </p>

          <h2 style={h2Style}>1. Controller</h2>
          <p style={pStyle}>
            The controller responsible for processing your personal data is the operator of Rihla. The operator&rsquo;s full name, postal address and contact email address will be published in the <strong style={strongStyle}>Legal Notice</strong> before launch.
          </p>

          <h2 style={h2Style}>2. Hosting</h2>
          <p style={pStyle}>
            This website and its infrastructure are served by a hosting provider. When you access the site, the hosting provider automatically records server log files (including your IP address, the date and time of access, the page requested and the browser used), which are required to deliver and secure the service. The legal basis is our legitimate interest in stable and secure operation.
          </p>

          <h2 style={h2Style}>3. Database and Authentication (Supabase)</h2>
          <p style={pStyle}>
            We use Supabase to store our database and to manage user authentication. Processing takes place in the EU region eu-central-1 (Frankfurt, Germany). The data processed includes your email address, name, a password hash (your actual password is never stored in plain text) and the data arising from bookings. The legal basis is the performance of a contract (or pre-contractual measures) and our legitimate interest in secure platform operation.
          </p>

          <h2 style={h2Style}>4. Payments (Stripe)</h2>
          <p style={pStyle}>
            Payments are handled by the payment provider Stripe. When you make a booking you are redirected to Stripe Checkout, and your payment details are entered exclusively on Stripe&rsquo;s servers. Payment or card data is never stored or processed on our own servers. The legal basis is the performance of a contract.
          </p>

          <h2 style={h2Style}>5. Fonts (Google Fonts)</h2>
          <p style={pStyle}>
            To present typography consistently, this website currently loads web fonts (Plus Jakarta Sans, Inter and Noto Sans Arabic) from Google&rsquo;s servers (Google Fonts). When a page loads, your browser connects to a Google server and transmits your IP address to Google so the fonts can be delivered. The provider is Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Ireland, and a transfer to the USA cannot be ruled out. To avoid this transfer, we intend to self-host the fonts before launch.
          </p>

          <h2 style={h2Style}>6. Cookies</h2>
          <p style={pStyle}>
            We use only technically necessary cookies required to operate the sign-in and session functions (authentication session cookies). These cookies are not used for tracking, analysis of your behaviour, marketing or advertising.
          </p>

          <h2 style={h2Style}>7. Your rights</h2>
          <p style={pStyle}>
            In relation to your personal data, you generally have the following rights:
          </p>
          <ul style={ulStyle}>
            <li>Right of access</li>
            <li>Right to rectification</li>
            <li>Right to erasure</li>
            <li>Right to restriction of processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
          </ul>
          <p style={pStyle}>
            You also have the right to lodge a complaint with a competent data protection authority regarding our processing of your personal data.
          </p>

          <h2 style={h2Style}>8. Retention</h2>
          <p style={pStyle}>
            We store personal data only for as long as necessary to provide our services and to meet statutory retention obligations. Once the relevant purpose no longer applies, or a statutory retention period expires, the data is deleted or anonymised.
          </p>
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
