import React from 'react';
import Link from 'next/link';

export const metadata = { title: 'Datenschutzerklärung — SyriaGuide' };

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '800px', backgroundColor: 'var(--color-white)',
  borderRadius: '16px', padding: '48px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
  border: '1px solid rgba(0,0,0,0.06)',
};
const h2Style: React.CSSProperties = { fontSize: '20px', fontWeight: 700, color: 'var(--neutral-dark)', marginTop: '32px', marginBottom: '12px' };
const pStyle: React.CSSProperties = { fontSize: '15px', lineHeight: 1.7, color: 'var(--neutral-gray)', marginBottom: '16px' };
const ulStyle: React.CSSProperties = { ...pStyle, paddingLeft: '20px' };

export default function DatenschutzPage() {
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
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Datenschutzerklärung</h1>
          <p style={{ ...pStyle, marginBottom: '32px' }}>
            Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Diese Datenschutzerklärung informiert Sie darüber, welche Daten wir bei der Nutzung von SyriaGuide verarbeiten, zu welchem Zweck dies geschieht und welche Rechte Ihnen zustehen.
          </p>

          <h2 style={h2Style}>1. Verantwortlicher</h2>
          <p style={pStyle}>
            Verantwortlicher für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p style={pStyle}>
            <strong>[PLATZHALTER: Vollständiger Name / Firmenname]</strong><br />
            [PLATZHALTER: Anschrift]<br />
            E-Mail: [PLATZHALTER: E-Mail-Adresse]
          </p>

          <h2 style={h2Style}>2. Hosting</h2>
          <p style={pStyle}>
            Diese Website sowie die zugehörige Infrastruktur werden bei <strong>[PLATZHALTER: Hosting-Anbieter nach Deployment]</strong> gehostet. Beim Aufruf unserer Website erhebt der Hosting-Anbieter automatisch sogenannte Server-Logfiles (u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, verwendeter Browser), die zur technischen Bereitstellung und Absicherung des Angebots erforderlich sind. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem stabilen und sicheren Betrieb).
          </p>

          <h2 style={h2Style}>3. Datenbank und Authentifizierung (Supabase)</h2>
          <p style={pStyle}>
            Wir nutzen den Dienst Supabase zur Speicherung unserer Datenbank sowie zur Verwaltung der Nutzer-Authentifizierung. Die Verarbeitung erfolgt in der EU-Region eu-central-1 (Frankfurt am Main). Dabei werden insbesondere folgende personenbezogene Daten verarbeitet: E-Mail-Adresse, Name, ein Passwort-Hash (Ihr tatsächliches Passwort wird zu keinem Zeitpunkt im Klartext gespeichert) sowie die im Rahmen von Buchungen anfallenden Daten (Buchungsdaten). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Plattformbetrieb).
          </p>

          <h2 style={h2Style}>4. Zahlungsabwicklung (Stripe)</h2>
          <p style={pStyle}>
            Zur Abwicklung von Zahlungen nutzen wir den Zahlungsdienstleister Stripe. Bei einer Buchung werden Sie zu Stripe Checkout weitergeleitet; die Eingabe Ihrer Zahlungsdaten erfolgt ausschließlich auf den Servern von Stripe. Zahlungs- bzw. Kartendaten werden zu keinem Zeitpunkt auf unseren eigenen Servern gespeichert oder verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Mit Supabase und Stripe bestehen bzw. werden vor Produktivbetrieb entsprechende Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO abgeschlossen.
          </p>

          <h2 style={h2Style}>5. Cookies</h2>
          <p style={pStyle}>
            Wir setzen ausschließlich technisch notwendige Cookies ein, die für den Betrieb der Anmelde- und Sitzungsfunktion (Auth-Session-Cookies) erforderlich sind. Diese Cookies dienen keinem Tracking und keiner Analyse Ihres Nutzungsverhaltens und werden nicht zu Marketing- oder Werbezwecken eingesetzt. Da es sich ausschließlich um technisch notwendige Cookies handelt, ist gemäß § 25 Abs. 2 Nr. 2 TTDSG keine gesonderte Einwilligung erforderlich.
          </p>

          <h2 style={h2Style}>6. Ihre Rechte als betroffene Person</h2>
          <p style={pStyle}>
            Ihnen stehen als betroffene Person hinsichtlich der Sie betreffenden personenbezogenen Daten grundsätzlich folgende Rechte zu:
          </p>
          <ul style={ulStyle}>
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          </ul>
          <p style={pStyle}>
            Darüber hinaus haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.
          </p>

          <h2 style={h2Style}>7. Speicherdauer</h2>
          <p style={pStyle}>
            Wir speichern personenbezogene Daten nur so lange, wie dies für die Erbringung unserer Leistungen sowie zur Erfüllung gesetzlicher Aufbewahrungspflichten erforderlich ist. Nach Wegfall des jeweiligen Zwecks bzw. nach Ablauf gesetzlicher Aufbewahrungsfristen werden die Daten gelöscht oder anonymisiert.
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
          <Link href="/agb" style={{ color: 'var(--neutral-gray)' }}>AGB</Link>
          {' · '}
          © 2026 SyriaGuide
        </p>
      </footer>
    </div>
  );
}
