'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
}

const MAX_BOOKING_HOURS = 8;

export default function BookingWidget({ guideId, guideType, hourlyRate, packagePrice, maxGroupSize, rating, reviewCount }: BookingWidgetProps) {
  const { status } = useSession();
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
    if (status !== 'authenticated') {
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

  return (
    <div style={{
      width: '380px', flexShrink: 0, position: 'sticky', top: '120px',
      backgroundColor: 'white', borderRadius: '16px', padding: '32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>
        €{isStudent ? hourlyRate : packagePrice}{' '}
        <span style={{ fontSize: '16px', color: 'var(--neutral-gray)', fontWeight: 500 }}>
          {isStudent ? '/ hour' : '/ person'}
        </span>
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600, color: 'var(--neutral-gray)' }}>
        <span style={{ color: 'var(--brand-sand)' }}>★</span>
        {rating.toFixed(1)} <span style={{ fontWeight: 400 }}>· {reviewCount} reviews</span>
      </div>

      {error && (
        <div style={{
          marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
          backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Date & time</label>
          {loadingSlots ? (
            <div style={{ padding: '12px', fontSize: '14px', color: 'var(--neutral-gray)' }}>Loading available dates…</div>
          ) : slots.length > 0 ? (
            <select
              value={slotId}
              onChange={e => handleSelectSlot(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'white',
              }}
            >
              <option value="">Select an available slot</option>
              {slots.map(slot => (
                <option key={slot.id} value={slot.id}>
                  {formatSlot(slot)}
                </option>
              ))}
            </select>
          ) : (
            <p style={{
              padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--neutral-light)',
              fontSize: '14px', color: 'var(--neutral-gray)', margin: 0,
            }}>
              No available dates yet — this guide hasn&apos;t opened their calendar. Check back soon.
            </p>
          )}
        </div>

        {isStudent ? (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Hours</label>
            <select
              value={durationHours}
              onChange={e => setDurationHours(Number(e.target.value))}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'white',
              }}
            >
              {[...Array(maxHours)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Hour' : 'Hours'}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Guests</label>
            <select
              value={participants}
              onChange={e => setParticipants(Number(e.target.value))}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'white',
              }}
            >
              {[...Array(maxGroupSize)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Person' : 'People'}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleReserve}
          disabled={loading || (!loadingSlots && slots.length === 0)}
          className="btn btn-primary"
          style={{
            width: '100%', marginTop: '16px', padding: '16px', fontSize: '16px',
            borderRadius: '8px', opacity: loading || (!loadingSlots && slots.length === 0) ? 0.7 : 1,
            cursor: loading || (!loadingSlots && slots.length === 0) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Redirecting to payment…' : status !== 'authenticated' ? 'Log in to Reserve' : 'Reserve'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--neutral-gray)', margin: 0 }}>
          {status === 'authenticated' ? "You won't be charged yet" : 'Secure checkout via Stripe'}
        </p>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '24px', paddingTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', color: 'var(--neutral-gray)' }}>
          <span>
            {isStudent
              ? `€${hourlyRate} × ${durationHours} hour${durationHours > 1 ? 's' : ''}`
              : `€${packagePrice} × ${participants} person${participants > 1 ? 's' : ''}`}
          </span>
          <span>€{basePrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', color: 'var(--neutral-gray)' }}>
          <span>Service fee</span>
          <span>€{serviceFee.toFixed(2)}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px',
          borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '16px', fontWeight: 700,
        }}>
          <span>Total</span>
          <span>€{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
