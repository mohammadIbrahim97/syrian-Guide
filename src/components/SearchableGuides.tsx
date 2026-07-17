'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { THEME_TAGS } from '@/lib/themes';

interface Guide {
  id: string;
  bio: string;
  city: string;
  country: string;
  languages: string[];
  tags: string[];
  guideType: 'STUDENT' | 'PROFESSIONAL';
  university: string | null;
  hourlyRate: number | null;
  packagePrice: number | null;
  maxGroupSize: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  coverImage: string | null;
  user: {
    name: string | null;
    image: string | null;
  };
}

const ALL_LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Spanish'];
const COUNTRIES = ['Syria', 'Lebanon', 'Jordan'];
const PRICE_OPTIONS = [
  { label: 'Any price', value: '' },
  { label: 'Under $20', value: '20' },
  { label: 'Under $50', value: '50' },
  { label: 'Under $100', value: '100' },
];

// Card photo-area gradients per country (fallback when the guide has no cover photo)
const PHOTO_BG: Record<string, string> = {
  Syria: 'radial-gradient(90% 120% at 20% 0%, #0a5148, transparent 60%), linear-gradient(150deg,#054239,#4a151e)',
  Lebanon: 'radial-gradient(90% 120% at 80% 0%, #0a5148, transparent 55%), linear-gradient(150deg,#002623,#428177)',
  Jordan: 'radial-gradient(90% 120% at 30% 0%, #7a2530, transparent 60%), linear-gradient(150deg,#4a151e,#988561)',
};

// Card tag chips alternate between teal and gold tints
// (gold text is darkened to #6f6142 so small chip labels clear WCAG AA)
const TAG_STYLES = [
  { bg: 'rgba(66,129,119,0.14)', color: '#054239' },
  { bg: 'rgba(185,167,121,0.24)', color: '#6f6142' },
  { bg: 'rgba(66,129,119,0.14)', color: '#054239' },
];

// Country motifs drawn in the card photo area: minaret (Syria),
// cedar (Lebanon), Petra treasury (Jordan)
function MotifIcon({ country }: { country: string }) {
  const style = { width: '78px', height: '78px', color: 'rgba(237,235,224,0.9)' };
  if (country === 'Lebanon') {
    return (
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
        <path d="M40 68V30" />
        <path d="M40 30l-16-6 16 2 16-6-16 4 16-2-16 8z" />
        <path d="M40 40l-20-8 20 3 20-8-20 5 20-3-20 11z" />
        <path d="M40 52l-22-9 22 4 22-9-22 5 22-4-22 13z" />
        <path d="M32 72h16" />
      </svg>
    );
  }
  if (country === 'Jordan') {
    return (
      <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
        <path d="M20 72V34l6-8h28l6 8v38" />
        <path d="M28 72V44h10v28M42 72V44h10v28" />
        <path d="M33 30l7-9 7 9" />
        <circle cx="40" cy="40" r="3" />
        <path d="M16 72h48" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.6" style={style} aria-hidden="true">
      <path d="M40 8c-6 6-6 14 0 18 6-4 6-12 0-18z" />
      <line x1="40" y1="26" x2="40" y2="34" />
      <path d="M26 72V44a14 14 0 0128 0v28" />
      <path d="M26 44h28M20 72h40" strokeLinecap="round" />
      <path d="M40 44v28M33 72V54a7 7 0 0114 0v18" />
    </svg>
  );
}

// "Verified local guide" seal shown beside the hero copy
function VerifiedSeal() {
  return (
    <svg viewBox="0 0 200 200" style={{ width: 'min(240px,60vw)', height: 'auto' }} role="img" aria-label="Verified local guide seal">
      <defs>
        <path id="ring" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="88" fill="none" stroke="#b9a779" strokeWidth="1.5" opacity="0.6" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#b9a779" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#b9a779" strokeWidth="1" strokeDasharray="2 5" opacity="0.8" />
      <text fontFamily="Inter" fontSize="11.5" fontWeight="600" letterSpacing="3.4" fill="#edebe0">
        <textPath href="#ring" startOffset="0%">· VERIFIED LOCAL GUIDE · موثّق · </textPath>
      </text>
      <g transform="translate(100,102)" stroke="#428177" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M0 22 C0 5 0 -8 0 -20" />
        <path d="M0 6 C-12 2 -18 -6 -18 -16 C-8 -14 0 -8 0 2Z" fill="#428177" stroke="none" />
        <path d="M0 -2 C12 -6 18 -14 18 -24 C8 -22 0 -16 0 -6Z" fill="#b9a779" stroke="none" />
        <path d="M0 12 C-11 9 -16 2 -16 -7 C-7 -5 0 0 0 8Z" fill="#428177" stroke="none" opacity="0.85" />
      </g>
    </svg>
  );
}

export default function SearchableGuides({ initialGuides }: { initialGuides: Guide[] }) {
  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState('');
  const [theme, setTheme] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState('');

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Monotonic request id: only the most recently issued fetch is allowed to
  // commit its results, so a slow earlier response can't overwrite a newer one.
  const requestSeqRef = useRef(0);

  // Fetch filtered results
  const fetchGuides = useCallback(async (query: string, countryValue: string, themeValue: string, langs: string[], price: string) => {
    const requestId = ++requestSeqRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (countryValue) params.set('country', countryValue);
      if (themeValue) params.set('theme', themeValue);
      langs.forEach(l => params.append('lang', l));
      if (price) params.set('maxPrice', price);

      const res = await fetch(`/api/guides?${params.toString()}`);
      const data = await res.json();
      if (requestId !== requestSeqRef.current) return; // a newer request superseded this one
      setGuides(data.guides);
    } catch (err) {
      console.error('Failed to fetch guides:', err);
    } finally {
      if (requestId === requestSeqRef.current) setLoading(false);
    }
  }, []);

  // Trigger search with debounce for text, immediate for filters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGuides(searchQuery, country, theme, selectedLanguages, maxPrice);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, country, theme, selectedLanguages, maxPrice, fetchGuides]);

  // The Search button skips the debounce
  const searchNow = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchGuides(searchQuery, country, theme, selectedLanguages, maxPrice);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleTheme = (label: string) => {
    setTheme(prev => prev === label ? '' : label);
  };

  const activeFilterCount = selectedLanguages.length + (maxPrice ? 1 : 0) + (theme ? 1 : 0) + (country ? 1 : 0) + (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCountry('');
    setTheme('');
    setSelectedLanguages([]);
    setMaxPrice('');
  };

  return (
    <>
      {/* Hero */}
      <section style={{
        position: 'relative',
        background: 'radial-gradient(120% 90% at 85% -10%, rgba(107,31,42,0.5), transparent 55%), linear-gradient(155deg,#002623,#054239 70%, #063f36)',
        color: 'var(--rihla-cream)',
        overflow: 'hidden',
        borderBottom: '1px solid var(--rihla-border-gold)',
      }}>
        {/* Golden dune lines */}
        <svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.14, pointerEvents: 'none', width: '100%', height: '100%' }}>
          <g fill="none" stroke="#b9a779" strokeWidth="1">
            <path d="M-50 120 Q300 40 600 120 T1250 120" />
            <path d="M-50 190 Q300 110 600 190 T1250 190" />
            <path d="M-50 260 Q300 180 600 260 T1250 260" />
            <path d="M-50 330 Q300 250 600 330 T1250 330" />
            <path d="M-50 400 Q300 320 600 400 T1250 400" />
          </g>
        </svg>
        <div className="rihla-shell" style={{ position: 'relative', zIndex: 2, paddingTop: 'clamp(3rem,7vw,5rem)', paddingBottom: 'clamp(3rem,7vw,5rem)' }}>
          <div className="rihla-hero-grid">
            <div className="rihla-fade-up">
              <span className="rihla-eyebrow" style={{ color: 'var(--rihla-gold)' }}>Local guides of the Levant</span>
              <h1 className="rihla-hero-title" style={{
                fontFamily: 'var(--rihla-font-display)',
                fontSize: 'clamp(2.4rem,5vw,3.6rem)',
                color: 'var(--rihla-cream)',
                fontWeight: 400,
                lineHeight: 1.12,
                letterSpacing: '-0.01em',
                margin: '1.1rem 0 0 0',
              }}>
                Travel with someone <br />who calls it <em style={{ color: 'var(--rihla-gold)' }}>home.</em>
              </h1>
              <p style={{ margin: '1.25rem 0 0 0', maxWidth: '46ch', color: 'var(--rihla-mist)', fontSize: '1.05rem' }}>
                Verified student and professional guides across Syria, Lebanon, and Jordan.
                Book by the hour or take the full tour — authentic, private, personal.
              </p>

              {/* Search bar */}
              <div className="rihla-search-bar" style={{
                marginTop: '1.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: '#ffffff',
                border: '1px solid rgba(152,133,97,0.55)',
                borderRadius: '999px',
                padding: '0.5rem 0.6rem 0.5rem 1rem',
                maxWidth: '560px',
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ color: 'var(--rihla-bronze)', flex: '0 0 auto' }}>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Where to? Try “Damascus”, “Petra”, “Byblos”…"
                  aria-label="Search destinations"
                  style={{ border: 0, flex: 1, fontFamily: 'var(--rihla-font-body)', fontSize: '0.95rem', background: 'transparent', color: 'var(--rihla-ink)', minWidth: 0 }}
                />
                <span aria-hidden="true" style={{ width: '1px', height: '22px', background: 'var(--rihla-border-bronze)', flex: '0 0 auto' }} />
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  aria-label="Country"
                  style={{ border: 0, background: 'transparent', fontFamily: 'var(--rihla-font-body)', fontSize: '0.9rem', color: 'var(--rihla-ink-soft)', cursor: 'pointer' }}
                >
                  <option value="">All countries</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={searchNow} className="rihla-btn">Search</button>
              </div>

              {/* Theme chips */}
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                {THEME_TAGS.map(t => (
                  <button
                    key={t.label}
                    onClick={() => toggleTheme(t.label)}
                    aria-pressed={theme === t.label}
                    className={`rihla-chip${theme === t.label ? ' active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rihla-fade-up" style={{ display: 'grid', placeItems: 'center', animationDelay: '0.15s' }}>
              <VerifiedSeal />
            </div>
          </div>
        </div>
      </section>

      {/* Meet your guide */}
      <main style={{ flexGrow: 1 }}>
        <div className="rihla-shell" style={{ paddingTop: 'clamp(2.5rem,5vw,4rem)', paddingBottom: 'clamp(2.5rem,5vw,4rem)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.2rem' }}>
            <div>
              <span className="rihla-eyebrow" style={{ color: 'var(--rihla-bronze-text)' }}>Discover</span>
              <h2 style={{
                fontFamily: 'var(--rihla-font-display)',
                fontSize: 'clamp(1.8rem,4vw,2.4rem)',
                fontWeight: 500,
                lineHeight: 1.12,
                letterSpacing: '-0.01em',
                margin: '0.7rem 0 0 0',
                color: 'var(--rihla-ink)',
              }}>
                Meet your guide
              </h2>
            </div>
            <p role="status" aria-live="polite" style={{ margin: 0, fontSize: '0.82rem', color: 'var(--rihla-ink-soft)', fontWeight: 500 }}>
              {loading
                ? 'Searching…'
                : `${guides.length} guide${guides.length !== 1 ? 's' : ''} · Syria, Lebanon & Jordan`}
            </p>
          </div>

          <div className="rihla-results-layout">

            {/* Sidebar filters */}
            <aside className="rihla-filters">
              {activeFilterCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--rihla-bronze-text)', fontWeight: 600 }}>
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                  </span>
                  <button onClick={clearAllFilters} className="rihla-clear-link">Clear all</button>
                </div>
              )}

              <h3 style={{ fontFamily: 'var(--rihla-font-body)', fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rihla-ink-soft)', margin: '0 0 0.9rem 0' }}>
                Languages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {ALL_LANGUAGES.map(lang => (
                  <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      style={{ width: '17px', height: '17px', accentColor: 'var(--rihla-pine)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.92rem', color: 'var(--rihla-ink)' }}>{lang}</span>
                  </label>
                ))}
              </div>

              <h3 style={{ fontFamily: 'var(--rihla-font-body)', fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--rihla-ink-soft)', margin: '2rem 0 0.9rem 0' }}>
                Price
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {PRICE_OPTIONS.map(opt => (
                  <label key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="price"
                      checked={maxPrice === opt.value}
                      onChange={() => setMaxPrice(opt.value)}
                      style={{ width: '17px', height: '17px', accentColor: 'var(--rihla-pine)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.92rem', color: 'var(--rihla-ink)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </aside>

            {/* Guide cards */}
            <section style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.3rem' }}>
                {guides.map((guide, index) => {
                  const firstName = guide.user.name?.split(' ')[0] ?? 'Guide';
                  const motifCountry = PHOTO_BG[guide.country] ? guide.country : 'Syria';
                  const chips = guide.tags.length > 0 ? guide.tags : guide.languages;
                  return (
                    <article
                      key={guide.id}
                      className="rihla-card rihla-fade-up"
                      style={{ animationDelay: `${(index % 3) * 80}ms` }}
                    >
                      <Link href={`/guides/${guide.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{
                          position: 'relative',
                          height: '158px',
                          display: 'grid',
                          placeItems: 'center',
                          overflow: 'hidden',
                          ...(guide.coverImage
                            ? { backgroundImage: `url(${guide.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: PHOTO_BG[motifCountry] }),
                        }}>
                          {!guide.coverImage && <MotifIcon country={motifCountry} />}
                          <span style={{ position: 'absolute', left: '13.6px', bottom: '12px', color: 'var(--rihla-cream)', fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem', textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 0a4 4 0 00-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 00-4-4zm0 5.5A1.5 1.5 0 116 2.5a1.5 1.5 0 010 3z" /></svg>
                            {guide.city}, {guide.country}
                          </span>
                          {guide.isVerified && (
                            <svg viewBox="0 0 52 52" role="img" aria-label="Verified guide" style={{ position: 'absolute', top: '11.2px', right: '11.2px', width: '52px', height: '52px' }}>
                              <circle cx="26" cy="26" r="23" fill="none" stroke="#edebe0" strokeWidth="1.3" opacity="0.85" />
                              <circle cx="26" cy="26" r="18" fill="none" stroke="#edebe0" strokeWidth="0.7" strokeDasharray="1.3 3" opacity="0.7" />
                              <path d="M20 27l5 5 9-11" stroke="#edebe0" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div style={{ padding: '16.8px 18.4px 19.2px', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
                          <div>
                            <div style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.32rem', fontWeight: 500, color: 'var(--rihla-ink)' }}>{firstName}</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', marginTop: '-0.15rem' }}>
                              {guide.guideType === 'STUDENT' ? 'Student guide · by the hour' : 'Professional guide · tour package'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.15rem' }}>
                            {chips.map((label, i) => (
                              <span key={label} style={{ fontSize: '0.78rem', fontWeight: 500, padding: '0.32rem 0.75rem', borderRadius: '999px', background: TAG_STYLES[i % 3].bg, color: TAG_STYLES[i % 3].color, display: 'inline-flex', alignItems: 'center' }}>
                                {label}
                              </span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.7rem', paddingTop: '0.85rem', borderTop: '1px solid var(--rihla-border-bronze)' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--rihla-ink)' }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="#988561" aria-hidden="true"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.9 3.8 14l.8-4.7L1.2 6l4.7-.7z" /></svg>
                              {guide.rating.toFixed(1)} <small style={{ color: 'var(--rihla-ink-soft)', fontWeight: 400 }}>· {guide.reviewCount} trips</small>
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--rihla-ink-soft)' }}>
                              from <b style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.05rem', color: 'var(--rihla-ink)', fontWeight: 600 }}>
                                ${guide.guideType === 'STUDENT' ? guide.hourlyRate : guide.packagePrice}
                              </b> {guide.guideType === 'STUDENT' ? '/ hour' : '/ person'}
                            </div>
                          </div>
                          <span className="rihla-btn" style={{ marginTop: '0.8rem', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                            Meet {firstName}
                          </span>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {/* Empty state */}
              {!loading && guides.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <h3 style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.6rem', fontWeight: 500, margin: '0 0 0.5rem 0', color: 'var(--rihla-ink)' }}>
                    No guides found.
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)', margin: '0 0 1.4rem 0' }}>
                    Try another place, or loosen a filter — the Levant is generous.
                  </p>
                  <button onClick={clearAllFilters} className="rihla-btn-ghost">Clear all filters</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
