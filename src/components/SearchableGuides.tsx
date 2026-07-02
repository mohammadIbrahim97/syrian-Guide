'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Tour {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  maxGroupSize: number;
  location: string;
  guide: {
    id: string;
    rating: number;
    reviewCount: number;
    languages: string[];
    isVerified: boolean;
    user: {
      name: string | null;
      image: string | null;
    };
  };
}

const ALL_LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Spanish'];
const CITY_TAGS = ['Damascus', 'Aleppo', 'Homs', 'History', 'Food', 'Culture', 'Photography'];
const PRICE_OPTIONS = [
  { label: 'Any price', value: '' },
  { label: 'Under €20', value: '20' },
  { label: 'Under €50', value: '50' },
  { label: 'Under €100', value: '100' },
];

export default function SearchableGuides({ initialTours }: { initialTours: Tour[] }) {
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [loading, setLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState('');
  const [activeCity, setActiveCity] = useState('');

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch filtered results
  const fetchTours = useCallback(async (query: string, langs: string[], price: string, city: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      langs.forEach(l => params.append('lang', l));
      if (price) params.set('maxPrice', price);
      if (city) params.set('city', city);

      const res = await fetch(`/api/tours?${params.toString()}`);
      const data = await res.json();
      setTours(data.tours);
    } catch (err) {
      console.error('Failed to fetch tours:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search with debounce for text, immediate for filters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTours(searchQuery, selectedLanguages, maxPrice, activeCity);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, selectedLanguages, maxPrice, activeCity, fetchTours]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleCity = (city: string) => {
    setActiveCity(prev => prev === city ? '' : city);
  };

  const activeFilterCount = selectedLanguages.length + (maxPrice ? 1 : 0) + (activeCity ? 1 : 0) + (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedLanguages([]);
    setMaxPrice('');
    setActiveCity('');
  };

  return (
    <>
      {/* Hero Search */}
      <section className="animate-fade-up" style={{ padding: 'var(--sz-64) 0 var(--sz-48) 0' }}>
        <h1 className="text-display" style={{ marginBottom: '12px', fontSize: '42px', color: 'var(--neutral-dark)' }}>
          Private guides in Syria
        </h1>
        <p className="text-body" style={{ color: 'var(--neutral-gray)', marginBottom: 'var(--sz-48)', fontSize: '18px', maxWidth: '700px' }}>
          Discover the beauty and history of Syria with our certified university student guides. Authentic, private, and personalized.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="hero-search" style={{ margin: 0, flex: 1, maxWidth: '500px' }}>
            <div className="hero-search-input-wrap">
              <span className="hero-search-icon" style={{ opacity: 0.5 }}>📍</span>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Search guides, tours, cities…"
                style={{ fontSize: '16px', fontWeight: 500 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--neutral-gray)', padding: '0 8px' }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* City/Category Tags */}
      <section className="animate-fade-up delay-100" style={{ marginBottom: 'var(--sz-32)', display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
        {CITY_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => toggleCity(tag)}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: activeCity === tag ? '2px solid var(--brand-coral)' : '1px solid rgba(0,0,0,0.1)',
              backgroundColor: activeCity === tag ? 'var(--brand-coral)' : 'var(--color-white)',
              color: activeCity === tag ? 'white' : 'var(--neutral-dark)',
              fontSize: '15px',
              fontWeight: activeCity === tag ? 600 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {tag}
          </button>
        ))}
      </section>

      {/* Main Layout: Sidebar + Grid */}
      <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start', marginBottom: 'var(--sz-80)' }}>

        {/* Sidebar Filters */}
        <aside className="animate-fade-up delay-200" style={{ width: '250px', flexShrink: 0, position: 'sticky', top: '32px' }}>

          {/* Active filters badge */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: 'var(--brand-coral)', fontWeight: 600 }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
              <button
                onClick={clearAllFilters}
                style={{ fontSize: '13px', color: 'var(--neutral-gray)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear all
              </button>
            </div>
          )}

          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Language spoken</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ALL_LANGUAGES.map(lang => (
              <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-coral)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', color: 'var(--neutral-dark)' }}>{lang}</span>
              </label>
            ))}
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', marginTop: '32px' }}>Price</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PRICE_OPTIONS.map(opt => (
              <label key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="price"
                  checked={maxPrice === opt.value}
                  onChange={() => setMaxPrice(opt.value)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-coral)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', color: 'var(--neutral-dark)' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Guides Grid Section */}
        <section style={{ flex: 1 }}>
          {/* Results count */}
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', margin: 0 }}>
              {loading ? 'Searching…' : `${tours.length} guide${tours.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{
                width: '36px', height: '36px', border: '3px solid rgba(0,0,0,0.08)',
                borderTopColor: 'var(--brand-coral)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}

          {/* Tour Cards */}
          {!loading && (
            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
              {tours.map((tour, index) => (
                <Link href={`/tours/${tour.id}`} key={tour.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article className={`wl-card animate-fade-up delay-${(index % 3 + 1) * 100}`}>
                    <div className="wl-card-header">
                      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, backgroundColor: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <span style={{ fontSize: '18px', color: 'var(--neutral-gray)' }}>♡</span>
                      </div>

                      <div className="wl-card-img" style={{ background: 'linear-gradient(135deg, var(--brand-indigo), var(--brand-coral))', width: '100%', height: '100%' }} />

                      <div className="wl-card-avatar-container">
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--brand-coral)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px' }}>
                          {tour.guide.user.name ? tour.guide.user.name.substring(0, 1).toUpperCase() : 'SG'}
                        </div>
                      </div>
                    </div>

                    <div className="wl-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h3 className="wl-card-title" style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                          With {tour.guide.user.name?.split(' ')[0]}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600 }}>
                          <span style={{ color: 'var(--brand-sand)' }}>★</span>
                          {tour.guide.rating.toFixed(1)} <span style={{ color: 'var(--neutral-gray)', fontWeight: 400 }}>({tour.guide.reviewCount})</span>
                        </div>
                      </div>

                      <div style={{ fontSize: '15px', color: 'var(--neutral-dark)', marginBottom: '8px', fontWeight: 500 }}>
                        {tour.title}
                      </div>

                      <div style={{ fontSize: '14px', color: 'var(--neutral-gray)', marginBottom: '16px' }}>
                        {tour.guide.languages.join(' · ')}
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}>From </span>
                          <span style={{ fontSize: '16px', fontWeight: 700 }}>€{tour.price}</span>
                          <span style={{ fontSize: '13px', color: 'var(--neutral-gray)' }}> / person</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}

              {tours.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No guides found</h3>
                  <p style={{ fontSize: '15px', color: 'var(--neutral-gray)', marginBottom: '24px' }}>
                    Try adjusting your filters or search terms.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="btn btn-pill btn-sm btn-primary"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
