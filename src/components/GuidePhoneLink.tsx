import React from 'react';

// WhatsApp deep links (wa.me) only work with a full international number,
// so numbers without a country code fall back to plain text.
export default function GuidePhoneLink({ phone }: { phone: string }) {
  if (!phone.startsWith('+')) {
    return <span style={{ fontWeight: 600 }}>📱 {phone}</span>;
  }
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, '')}`}
      target="_blank"
      rel="noreferrer"
      className="rihla-link"
    >
      📱 {phone}
    </a>
  );
}
