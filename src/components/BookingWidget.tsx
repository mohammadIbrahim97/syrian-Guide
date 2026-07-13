'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface BookingWidgetProps {
  guideId: string;
  guideType: 'STUDENT' | 'PROFESSIONAL';
  hourlyRate: number | null;
  packagePrice: number | null;
  maxGroupSize: number;
  rating: number;
  reviewCount: number;
  isLoggedIn: boolean;
}

const MAX_BOOKING_HOURS = 8;

export default function BookingWidget({ guideId, guideType, hourlyRate, packagePrice, maxGroupSize, rating, reviewCount, isLoggedIn }: BookingWidgetProps) {
  const router = useRouter();

  const isStudent = guideType === 'STUDENT';

  const [slotId, setSlotId] = useState('');
  const [durationHours, setDurationHours] = useState(2);
  const [participants, setParticipants] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Fetch availability slots; bumping slotsVersion re-fetches (e.g. after a 409)
  const [slotsVersion, setSlotsVersion] = useState(0);
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/availability?guideId=${guideId}`);
        if (!res.ok) throw new Error('availability request failed');
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setError('Could not load available dates. Please refresh the page.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [guideId, slotsVersion]);

  // Students are hired by the hour; professionals sell a fixed package per person
  const basePrice = isStudent
    ? (hourlyRate ?? 0) * durationHours
    : (packagePrice ?? 0) * participants;
  const serviceFee = Math.round(basePrice * 0.1 * 100) / 100;
  const grandTotal = basePrice + serviceFee;

  // Hours in a slot like 09:00–13:00 (rounded down)
  const slotLengthHours = (slot: Slot) => {
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    return Math.floor((eh * 60 + em - (sh * 60 + sm)) / 60);
  };

  const selectedSlot = slots.find(s => s.id === slotId);
  // A student can book at most the length of the chosen slot (capped at MAX_BOOKING_HOURS)
  const maxHours = selectedSlot
    ? Math.max(1, Math.min(MAX_BOOKING_HOURS, slotLengthHours(selectedSlot)))
    : MAX_BOOKING_HOURS;

  const formatSlot = (slot: Slot) => {
    const day = new Date(slot.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', timeZone: 'UTC',
    });
    return `${day} · ${slot.startTime}–${slot.endTime}`;
  };

  const handleSelectSlot = (id: string) => {
    setSlotId(id);
    const slot = slots.find(s => s.id === id);
    if (slot && isStudent) {
      // Keep the chosen hours within the new slot's length
      setDurationHours(h => Math.min(h, Math.max(1, Math.min(MAX_BOOKING_HOURS, slotLengthHours(slot)))));
    }
  };

  const handleReserve = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (!slotId) {
      setError('Please select an available date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isStudent
            ? { guideId, slotId, durationHours }
            : { guideId, slotId, participants }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking failed');
        if (res.status === 409) {
          // Someone else won this slot — drop it and show what's still free
          setSlotId('');
          setSlotsVersion(v => v + 1);
        }
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  const reserveDisabled = loading || (!loadingSlots && slots.length === 0);

  return (
    <div
      className="rihla-panel rihla-fade-up rihla-booking-panel"
      style={{ width: '360px', flexShrink: 0, position: 'sticky', top: '24px', animationDelay: '0.1s' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>
          €{isStudent ? hourlyRate : packagePrice}
        </span>
        <span style={{ fontSize: '0.92rem', color: 'var(--rihla-ink-soft)' }}>
          {isStudent ? '/ hour' : '/ person'}
        </span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--rihla-ink)', marginTop: '0.2rem' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="#988561" aria-hidden="true"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.9 3.8 14l.8-4.7L1.2 6l4.7-.7z" /></svg>
        {rating.toFixed(1)} <small style={{ color: 'var(--rihla-ink-soft)', fontWeight: 400 }}>· {reviewCount} trips</small>
      </div>

      {error && (
        <div role="alert" className="rihla-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          {loadingSlots ? (
            <>
              <span className="rihla-field-label">Date &amp; time</span>
              <div role="status" aria-live="polite" style={{ padding: '0.72rem 0', fontSize: '0.85rem', color: 'var(--rihla-ink-soft)' }}>
                Loading available dates…
              </div>
            </>
          ) : slots.length > 0 ? (
            <label className="rihla-field-label" style={{ marginBottom: 0 }}>
              Date &amp; time
              <select
                value={slotId}
                onChange={e => handleSelectSlot(e.target.value)}
                className="rihla-field"
                style={{ marginTop: '0.4rem' }}
              >
                <option value="">Select an available slot</option>
                {slots.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {formatSlot(slot)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <span className="rihla-field-label">Date &amp; time</span>
              <p className="rihla-inset" style={{ padding: '0.8rem 0.9rem', fontSize: '0.85rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
                No available dates yet — this guide hasn&apos;t opened their calendar. Check back soon.
              </p>
            </>
          )}
        </div>

        {isStudent ? (
          <label className="rihla-field-label" style={{ marginBottom: 0 }}>
            Hours
            <select
              value={durationHours}
              onChange={e => setDurationHours(Number(e.target.value))}
              className="rihla-field"
              style={{ marginTop: '0.4rem' }}
            >
              {[...Array(maxHours)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Hour' : 'Hours'}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="rihla-field-label" style={{ marginBottom: 0 }}>
            Guests
            <select
              value={participants}
              onChange={e => setParticipants(Number(e.target.value))}
              className="rihla-field"
              style={{ marginTop: '0.4rem' }}
            >
              {[...Array(maxGroupSize)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Person' : 'People'}</option>
              ))}
            </select>
          </label>
        )}

        <button
          onClick={handleReserve}
          disabled={reserveDisabled}
          className="rihla-btn"
          style={{
            width: '100%', marginTop: '0.4rem', justifyContent: 'center',
            fontSize: '0.95rem', padding: '0.85rem 1.4rem',
            opacity: reserveDisabled ? 0.7 : 1,
            cursor: reserveDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Redirecting to payment…' : !isLoggedIn ? 'Log in to reserve' : 'Reserve'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
          {isLoggedIn ? "You won't be charged yet" : 'Secure checkout via Stripe'}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--rihla-border-bronze)', marginTop: '1.4rem', paddingTop: '1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.92rem', color: 'var(--rihla-ink-soft)' }}>
          <span>
            {isStudent
              ? `€${hourlyRate} × ${durationHours} hour${durationHours > 1 ? 's' : ''}`
              : `€${packagePrice} × ${participants} person${participants > 1 ? 's' : ''}`}
          </span>
          <span>€{basePrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.92rem', color: 'var(--rihla-ink-soft)' }}>
          <span>Service fee</span>
          <span>€{serviceFee.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid var(--rihla-border-bronze)' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>Total</span>
          <span style={{ fontFamily: 'var(--rihla-font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>€{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
