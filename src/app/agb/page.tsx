import React from 'react';
import Link from 'next/link';

export const metadata = { title: 'AGB — SyriaGuide' };

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '800px', backgroundColor: 'var(--color-white)',
  borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.06)',
};
const h2Style: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: 'var(--neutral-dark)', marginTop: '32px', marginBottom: '12px' };
const pStyle: React.CSSProperties = { fontSize: '15px', lineHeight: 1.7, color: 'var(--neutral-gray)', marginBottom: '16px' };

export default function AgbPage() {
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
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p style={{ ...pStyle, marginBottom: '32px' }}>
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
            <strong>[PLATZHALTER: Stornierungsbedingungen — Fristen, Rückerstattungsregelungen sowie Sonderfälle wie ein Ausfall des Guides sind vor Launch verbindlich festzulegen und an dieser Stelle auszuformulieren.]</strong>
          </p>

          <h2 style={h2Style}>§ 5 Pflichten der Nutzer</h2>
          <p style={pStyle}>
            Nutzer verpflichten sich, bei der Nutzung der Plattform wahrheitsgemäße Angaben zu machen, vereinbarte Treffpunkte und Termine einzuhalten und sich gegenüber Guides respektvoll zu verhalten. Die missbräuchliche Nutzung der Plattform, insbesondere die Umgehung der Buchungs- und Zahlungsfunktion, ist untersagt.
          </p>

          <h2 style={h2Style}>§ 6 Haftung</h2>
          <p style={pStyle}>
            <strong>[PLATZHALTER: rechtliche Prüfung erforderlich — Umfang und etwaige Beschränkungen der Haftung von SyriaGuide gegenüber Nutzern und Guides sind vor Launch durch eine rechtliche Prüfung festzulegen.]</strong>
          </p>

          <h2 style={h2Style}>§ 7 Schlussbestimmungen</h2>
          <p style={pStyle}>
            Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt.
          </p>

          <p style={{ fontSize: '13px', color: 'var(--neutral-muted)', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            Dieses Dokument ist eine Vorlage und wird vor dem offiziellen Start rechtlich geprüft.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,0,0,0.1)', padding: 'var(--sz-24) var(--sz-32)', marginTop: 'auto', backgroundColor: 'var(--color-white)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--neutral-gray)', margin: 0 }}>
          <Link href="/impressum" style={{ color: 'var(--neutral-gray)' }}>Impressum</Link>
          {' · '}
          <Link href="/datenschutz" style={{ color: 'var(--neutral-gray)' }}>Datenschutz</Link>
          {' · '}
          © 2026 SyriaGuide
        </p>
      </footer>
    </div>
  );
}
