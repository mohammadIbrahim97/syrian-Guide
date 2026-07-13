import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const metadata = { title: 'Datenschutzerklärung — SyriaGuide' };

const h2Style: React.CSSProperties = { fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--rihla-ink)', margin: '2rem 0 0.7rem 0' };
const pStyle: React.CSSProperties = { fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--rihla-ink-soft)', margin: '0 0 1rem 0' };
const ulStyle: React.CSSProperties = { ...pStyle, paddingLeft: '1.25rem' };
const strongStyle: React.CSSProperties = { color: 'var(--rihla-ink)' };

export default function DatenschutzPage() {
  return (
    <div className="rihla-page">
      {/* TEMPLATE — vor Launch prüfen und Platzhalter ersetzen. Keine Rechtsberatung. */}
      <RihlaHeader />

      {/* Content */}
      <main className="rihla-legal-main" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '3rem 24px' }}>
        <div className="rihla-form-card" style={{ maxWidth: '800px' }}>
          <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Rechtliches</span>
          <h1 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 500, margin: '0.6rem 0 0.5rem 0', color: 'var(--rihla-ink)' }}>Datenschutzerklärung</h1>
          <p style={{ ...pStyle, margin: '0 0 2rem 0' }}>
            Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Diese Datenschutzerklärung informiert Sie darüber, welche Daten wir bei der Nutzung von SyriaGuide verarbeiten, zu welchem Zweck dies geschieht und welche Rechte Ihnen zustehen.
          </p>

          <h2 style={h2Style}>1. Verantwortlicher</h2>
          <p style={pStyle}>
            Verantwortlicher für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p style={pStyle}>
            <strong style={strongStyle}>[PLATZHALTER: Vollständiger Name / Firmenname]</strong><br />
            [PLATZHALTER: Anschrift]<br />
            E-Mail: [PLATZHALTER: E-Mail-Adresse]
          </p>

          <h2 style={h2Style}>2. Hosting</h2>
          <p style={pStyle}>
            Diese Website sowie die zugehörige Infrastruktur werden bei <strong style={strongStyle}>[PLATZHALTER: Hosting-Anbieter nach Deployment]</strong> gehostet. Beim Aufruf unserer Website erhebt der Hosting-Anbieter automatisch sogenannte Server-Logfiles (u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, verwendeter Browser), die zur technischen Bereitstellung und Absicherung des Angebots erforderlich sind. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem stabilen und sicheren Betrieb).
          </p>

          <h2 style={h2Style}>3. Datenbank und Authentifizierung (Supabase)</h2>
          <p style={pStyle}>
            Wir nutzen den Dienst Supabase zur Speicherung unserer Datenbank sowie zur Verwaltung der Nutzer-Authentifizierung. Die Verarbeitung erfolgt in der EU-Region eu-central-1 (Frankfurt am Main). Dabei werden insbesondere folgende personenbezogene Daten verarbeitet: E-Mail-Adresse, Name, ein Passwort-Hash (Ihr tatsächliches Passwort wird zu keinem Zeitpunkt im Klartext gespeichert) sowie die im Rahmen von Buchungen anfallenden Daten (Buchungsdaten). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Plattformbetrieb).
          </p>

          <h2 style={h2Style}>4. Zahlungsabwicklung (Stripe)</h2>
          <p style={pStyle}>
            Zur Abwicklung von Zahlungen nutzen wir den Zahlungsdienstleister Stripe. Bei einer Buchung werden Sie zu Stripe Checkout weitergeleitet; die Eingabe Ihrer Zahlungsdaten erfolgt ausschließlich auf den Servern von Stripe. Zahlungs- bzw. Kartendaten werden zu keinem Zeitpunkt auf unseren eigenen Servern gespeichert oder verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Mit Supabase und Stripe bestehen bzw. werden vor Produktivbetrieb entsprechende Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO abgeschlossen.
          </p>

          <h2 style={h2Style}>5. Schriftarten (Google Fonts)</h2>
          <p style={pStyle}>
            Zur einheitlichen Darstellung der Typografie bindet diese Website derzeit Web-Schriftarten (Plus Jakarta Sans, Inter und Noto Sans Arabic) von den Servern von Google (Google Fonts) ein. Beim Aufruf einer Seite stellt Ihr Browser eine Verbindung zu einem Google-Server her und übermittelt dabei Ihre IP-Adresse an Google, damit die Schriftarten geladen und die Website in der vorgesehenen Gestaltung angezeigt werden können. Google kann diese Daten hierbei verarbeiten; Anbieter ist die Google Ireland Ltd., Gordon House, Barrow Street, Dublin 4, Irland, wobei eine Übermittlung in die USA nicht ausgeschlossen werden kann. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer einheitlichen Darstellung des Angebots).
          </p>
          <p style={pStyle}>
            <strong style={strongStyle}>[PLATZHALTER: ggf. auf selbst-gehostete Schriftarten umstellen — siehe Datenschutzhinweis]</strong> Um diese Datenübermittlung an Google zu vermeiden, sollten die Schriftarten vor dem Start idealerweise lokal (selbst-gehostet) ausgeliefert werden.
          </p>

          <h2 style={h2Style}>6. Cookies</h2>
          <p style={pStyle}>
            Wir setzen ausschließlich technisch notwendige Cookies ein, die für den Betrieb der Anmelde- und Sitzungsfunktion (Auth-Session-Cookies) erforderlich sind. Diese Cookies dienen keinem Tracking und keiner Analyse Ihres Nutzungsverhaltens und werden nicht zu Marketing- oder Werbezwecken eingesetzt. Da es sich ausschließlich um technisch notwendige Cookies handelt, ist gemäß § 25 Abs. 2 Nr. 2 TTDSG keine gesonderte Einwilligung erforderlich.
          </p>

          <h2 style={h2Style}>7. Ihre Rechte als betroffene Person</h2>
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

          <h2 style={h2Style}>8. Speicherdauer</h2>
          <p style={pStyle}>
            Wir speichern personenbezogene Daten nur so lange, wie dies für die Erbringung unserer Leistungen sowie zur Erfüllung gesetzlicher Aufbewahrungspflichten erforderlich ist. Nach Wegfall des jeweiligen Zwecks bzw. nach Ablauf gesetzlicher Aufbewahrungsfristen werden die Daten gelöscht oder anonymisiert.
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
