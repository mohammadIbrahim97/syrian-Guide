import React from 'react';
import Link from 'next/link';

export const metadata = { title: 'Impressum — SyriaGuide' };

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '800px', backgroundColor: 'var(--color-white)',
  borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.06)',
};
const h2Style: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: 'var(--neutral-dark)', marginTop: '32px', marginBottom: '12px' };
const h3Style: React.CSSProperties = { fontSize: '17px', fontWeight: 700, color: 'var(--neutral-dark)', marginTop: '20px', marginBottom: '10px' };
const pStyle: React.CSSProperties = { fontSize: '15px', lineHeight: 1.7, color: 'var(--neutral-gray)', marginBottom: '16px' };

export default function ImpressumPage() {
  return (
    <div className="layout-wrapper" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      {/* TEMPLATE — vor Launch prüfen und Platzhalter ersetzen. Keine Rechtsberatung. */}

      {/* Header */}
      <header style={{ padding: 'var(--sz-16) var(--sz-32)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.jpg" alt="SyriaGuide Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', margin: '-20px 0 -20px -10px' }} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 'var(--sz-48) var(--sz-32)' }}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Impressum</h1>
          <p style={{ ...pStyle, marginBottom: '32px' }}>
            Diese Angaben dienen der Erfüllung der gesetzlichen Informationspflichten für geschäftsmäßige digitale Dienste in Deutschland.
          </p>

          <h2 style={h2Style}>Angaben gemäß § 5 DDG</h2>
          <p style={pStyle}>
            <strong>[PLATZHALTER: Vollständiger Name / Firmenname]</strong><br />
            [PLATZHALTER: Straße und Hausnummer]<br />
            [PLATZHALTER: Postleitzahl und Ort]<br />
            [PLATZHALTER: Land]
          </p>

          <h2 style={h2Style}>Kontakt</h2>
          <p style={pStyle}>
            E-Mail: <strong>[PLATZHALTER: E-Mail-Adresse]</strong>
          </p>

          <h2 style={h2Style}>Verantwortlich i.S.d. § 18 Abs. 2 MStV</h2>
          <p style={pStyle}>
            <strong>[PLATZHALTER: Vollständiger Name der presserechtlich verantwortlichen Person]</strong><br />
            [PLATZHALTER: Anschrift, sofern abweichend von oben]
          </p>

          <h2 style={h2Style}>Haftungsausschluss</h2>

          <h3 style={h3Style}>Haftung für Inhalte</h3>
          <p style={pStyle}>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>

          <h3 style={h3Style}>Haftung für Links</h3>
          <p style={pStyle}>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seite verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>

          <p style={{ fontSize: '13px', color: 'var(--neutral-muted)', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            Dieses Dokument ist eine Vorlage und wird vor dem offiziellen Start rechtlich geprüft.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: 'var(--sz-24) var(--sz-32)', marginTop: 'auto', backgroundColor: 'var(--color-white)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
          <Link href="/datenschutz" style={{ color: 'var(--neutral-gray)' }}>Datenschutz</Link>
          {' · '}
          <Link href="/agb" style={{ color: 'var(--neutral-gray)' }}>AGB</Link>
          {' · '}
          © 2026 SyriaGuide
        </p>
      </footer>
    </div>
  );
}
