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
  tourId: string;
  price: number;
  maxGroupSize: number;
  guideId: string;
  rating: number;
  reviewCount: number;
}

export default function BookingWidget({ tourId, price, maxGroupSize, guideId, rating, reviewCount }: BookingWidgetProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // Fetch availability slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/availability?guideId=${guideId}`);
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [guideId]);

  const totalPrice = price * participants;
  const serviceFee = Math.round(totalPrice * 0.1 * 100) / 100;
  const grandTotal = totalPrice + serviceFee;

  // Get unique available dates
  const availableDates = [...new Set(slots.map(s => s.date.split('T')[0]))];

  const handleReserve = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId, date, participants }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking failed');
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
        €{price} <span style={{ fontSize: '16px', color: 'var(--neutral-gray)', fontWeight: 500 }}>/ person</span>
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Date</label>
          {loadingSlots ? (
            <div style={{ padding: '12px', fontSize: '14px', color: 'var(--neutral-gray)' }}>Loading available dates…</div>
          ) : availableDates.length > 0 ? (
            <select
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', backgroundColor: 'white',
              }}
            >
              <option value="">Select a date</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
          ) : (
            <div>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.1)', fontSize: '15px', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--neutral-gray)', marginTop: '4px' }}>
                No pre-set slots — pick any date
              </p>
            </div>
          )}
        </div>

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

        <button
          onClick={handleReserve}
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: '100%', marginTop: '16px', padding: '16px', fontSize: '16px',
            borderRadius: '8px', opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
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
          <span>€{price} × {participants} person{participants > 1 ? 's' : ''}</span>
          <span>€{totalPrice.toFixed(2)}</span>
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
