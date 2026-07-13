import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const metadata = { title: 'AGB — SyriaGuide' };

const h2Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--rihla-ink)', margin: '2rem 0 0.7rem 0' };
const pStyle: React.CSSProperties = { fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rihla-ink-soft)', margin: '0 0 1rem 0' };
const strongStyle: React.CSSProperties = { color: 'var(--rihla-ink)' };

export default function AgbPage() {
  return (
    <div className="rihla-page">
      {/* TEMPLATE — vor Launch prüfen und Platzhalter ersetzen. Keine Rechtsberatung. */}
      <RihlaHeader />

      {/* Content */}
      <main className="rihla-legal-main" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card" style={{ maxWidth: '800px' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Rechtliches</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)' }}>Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p style={{ ...pStyle, margin: '0 0 2rem 0' }}>
            Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der Plattform SyriaGuide durch Reisende und die Vermittlung von Stadtführungen und Touren durch registrierte Guides.
          </p>

          <h2 style={h2Style}>§ 1 Geltungsbereich</h2>
          <p style={pStyle}>
            Diese AGB gelten für die Nutzung der Plattform SyriaGuide (nachfolgend die Plattform) durch Reisende (nachfolgend Nutzer) sowie für die Vermittlung von Stadtführungen und Touren durch registrierte Guides (nachfolgend Guides). Mit der Registrierung bzw. der Nutzung der Plattform erkennen Nutzer und Guides diese AGB an.
          </p>

          <h2 style={h2Style}>§ 2 Vertragsverhältnis</h2>
          <p style={pStyle}>
            SyriaGuide stellt ausschließlich die technische Plattform zur Vermittlung zwischen Reisenden und Guides zur Verfügung. Der Vertrag über die Durchführung einer Tour kommt unmittelbar zwischen dem Nutzer und dem jeweiligen Guide zustande; SyriaGuide wird nicht Vertragspartei dieses Tour-Vertrags. Für Inhalt, Durchführung und Qualität der angebotenen Touren ist allein der jeweilige Guide verantwortlich.
          </p>

          <h2 style={h2Style}>§ 3 Buchung und Bezahlung</h2>
          <p style={pStyle}>
            Die Buchung einer Tour erfolgt über die Plattform. Die Bezahlung wird über den Zahlungsdienstleister Stripe abgewickelt. Der bei der Buchung ausgewiesene Preis versteht sich inklusive der SyriaGuide-Servicegebühr. Mit Abschluss der Buchung und erfolgreicher Zahlung ist der Tour-Vertrag zwischen Nutzer und Guide verbindlich zustande gekommen.
          </p>

          <h2 style={h2Style}>§ 4 Stornierung</h2>
          <p style={pStyle}>
            <strong style={strongStyle}>[PLATZHALTER: Stornierungsbedingungen — Fristen, Rückerstattungsregelungen sowie Sonderfälle wie ein Ausfall des Guides sind vor Launch verbindlich festzulegen und an dieser Stelle auszuformulieren.]</strong>
          </p>

          <h2 style={h2Style}>§ 5 Pflichten der Nutzer</h2>
          <p style={pStyle}>
            Nutzer verpflichten sich, bei der Nutzung der Plattform wahrheitsgemäße Angaben zu machen, vereinbarte Treffpunkte und Termine einzuhalten und sich gegenüber Guides respektvoll zu verhalten. Die missbräuchliche Nutzung der Plattform, insbesondere die Umgehung der Buchungs- und Zahlungsfunktion, ist untersagt.
          </p>

          <h2 style={h2Style}>§ 6 Haftung</h2>
          <p style={pStyle}>
            <strong style={strongStyle}>[PLATZHALTER: rechtliche Prüfung erforderlich — Umfang und etwaige Beschränkungen der Haftung von SyriaGuide gegenüber Nutzern und Guides sind vor Launch durch eine rechtliche Prüfung festzulegen.]</strong>
          </p>

          <h2 style={h2Style}>§ 7 Schlussbestimmungen</h2>
          <p style={pStyle}>
            Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
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
