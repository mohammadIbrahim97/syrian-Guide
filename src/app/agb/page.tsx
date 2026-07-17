import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const metadata = { title: 'Terms of Service — Rihla' };

const h2Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--rihla-ink)', margin: '2rem 0 0.7rem 0' };
const pStyle: React.CSSProperties = { fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rihla-ink-soft)', margin: '0 0 1rem 0' };
const strongStyle: React.CSSProperties = { color: 'var(--rihla-ink)' };

export default function AgbPage() {
  return (
    <div className="rihla-page">
      <RihlaHeader />

      {/* Content */}
      <main className="rihla-legal-main" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card" style={{ maxWidth: '800px' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)' }}>Terms of Service</h1>
          <p style={{ ...pStyle, margin: '0 0 2rem 0' }}>
            These Terms of Service govern the use of the Rihla platform by travellers and the arrangement of city tours and experiences by registered local guides.
          </p>

          <h2 style={h2Style}>§ 1 Scope</h2>
          <p style={pStyle}>
            These Terms apply to the use of the Rihla platform (the &ldquo;Platform&rdquo;) by travellers (&ldquo;Users&rdquo;) and to the arrangement of city tours and experiences by registered local guides (&ldquo;Guides&rdquo;). By registering for or using the Platform, Users and Guides accept these Terms.
          </p>

          <h2 style={h2Style}>§ 2 Contractual relationship</h2>
          <p style={pStyle}>
            Rihla provides only the technical platform that connects travellers and Guides. The contract for carrying out a tour is concluded directly between the User and the respective Guide; Rihla does not become a party to that tour contract. The respective Guide alone is responsible for the content, conduct and quality of the tours offered.
          </p>

          <h2 style={h2Style}>§ 3 Booking and payment</h2>
          <p style={pStyle}>
            Tours are booked through the Platform. Payment is handled by the payment provider Stripe. The price shown at booking includes the Rihla service fee. Once the booking is completed and payment is successful, the tour contract between the User and the Guide is binding.
          </p>

          <h2 style={h2Style}>§ 4 Cancellation</h2>
          <p style={pStyle}>
            To cancel a booking, please contact Rihla by email at the address published in the <strong style={strongStyle}>Legal Notice</strong>. Cancellation and refund requests are reviewed on a case-by-case basis. Where a Guide cancels a tour or fails to appear, the User is entitled to a full refund, including the Rihla service fee. Refunds are issued to the original payment method through Stripe.
          </p>

          <h2 style={h2Style}>§ 5 User obligations</h2>
          <p style={pStyle}>
            Users undertake to provide truthful information when using the Platform, to keep agreed meeting points and appointments, and to behave respectfully towards Guides. Misuse of the Platform, in particular circumventing the booking and payment functions, is prohibited.
          </p>

          <h2 style={h2Style}>§ 6 Liability</h2>
          <p style={pStyle}>
            As Rihla only arranges the connection between Users and Guides and is not a party to the tour contract, Rihla is not liable for the performance, content or quality of the tours themselves, which are the sole responsibility of the respective Guide. Rihla is liable for its own conduct in operating the Platform in cases of intent and gross negligence. Liability for slight negligence is limited to the breach of essential contractual obligations and, in such cases, to the foreseeable damage typical for this type of contract.
          </p>

          <h2 style={h2Style}>§ 7 Final provisions</h2>
          <p style={pStyle}>
            These Terms are governed by the laws of Syria. Should individual provisions of these Terms be or become invalid, the validity of the remaining provisions shall not be affected.
          </p>
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
