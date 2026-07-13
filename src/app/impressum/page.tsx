import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const metadata = { title: 'Impressum — SyriaGuide' };

const h2Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--rihla-ink)', margin: '2rem 0 0.7rem 0' };
const h3Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-body)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)', margin: '1.2rem 0 0.6rem 0' };
const pStyle: React.CSSProperties = { fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rihla-ink-soft)', margin: '0 0 1rem 0' };
const strongStyle: React.CSSProperties = { color: 'var(--rihla-ink)' };

export default function ImpressumPage() {
  return (
    <div className="rihla-page">
      {/* TEMPLATE — vor Launch prüfen und Platzhalter ersetzen. Keine Rechtsberatung. */}
      <RihlaHeader />

      {/* Content */}
      <main className="rihla-legal-main" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card" style={{ maxWidth: '800px' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Rechtliches</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)' }}>Impressum</h1>
          <p style={{ ...pStyle, margin: '0 0 2rem 0' }}>
            Diese Angaben dienen der Erfüllung der gesetzlichen Informationspflichten für geschäftsmäßige digitale Dienste in Deutschland.
          </p>

          <h2 style={h2Style}>Angaben gemäß § 5 DDG</h2>
          <p style={pStyle}>
            <strong style={strongStyle}>[PLATZHALTER: Vollständiger Name / Firmenname]</strong><br />
            [PLATZHALTER: Straße und Hausnummer]<br />
            [PLATZHALTER: Postleitzahl und Ort]<br />
            [PLATZHALTER: Land]
          </p>

          <h2 style={h2Style}>Kontakt</h2>
          <p style={pStyle}>
            E-Mail: <strong style={strongStyle}>[PLATZHALTER: E-Mail-Adresse]</strong>
          </p>

          <h2 style={h2Style}>Verantwortlich i.S.d. § 18 Abs. 2 MStV</h2>
          <p style={pStyle}>
            <strong style={strongStyle}>[PLATZHALTER: Vollständiger Name der presserechtlich verantwortlichen Person]</strong><br />
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

          <p style={{ fontSize: '0.78rem', color: 'var(--rihla-bronze-text)', margin: '2.5rem 0 0 0', paddingTop: '1.2rem', borderTop: '1px solid var(--rihla-border-bronze)' }}>
            Dieses Dokument ist eine Vorlage und wird vor dem offiziellen Start rechtlich geprüft.
          </p>
        </div>
      </main>

      <RihlaFooter />
    </div>
  );
}
