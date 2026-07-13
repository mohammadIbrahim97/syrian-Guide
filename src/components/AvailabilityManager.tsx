'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Slot {
  id: string;
  date: string; // ISO string, midnight UTC (DATE column)
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export default function AvailabilityManager({ slots }: { slots: Slot[] }) {
  const router = useRouter();

  const [form, setForm] = useState({ date: '', startTime: '09:00', endTime: '13:00' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [form] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not add the slot');
        return;
      }
      setForm(f => ({ ...f, date: '' }));
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    setError('');
    setDeletingId(slotId);
    try {
      const res = await fetch('/api/availability', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not delete the slot');
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong');
    } finally {
      setDeletingId('');
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });

  const fieldStyle: React.CSSProperties = {
    fontSize: '0.92rem', padding: '0.6rem 0.85rem', width: 'auto',
  };

  return (
    <div>
      {error && (
        <div className="rihla-error" role="status" aria-live="polite" style={{ marginBottom: '1.2rem' }}>
          {error}
        </div>
      )}

      {/* Add slot form */}
      <form onSubmit={addSlot} className="rihla-slot-form" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.6rem' }}>
        <label className="rihla-field-label" style={{ marginBottom: 0 }}>
          <span style={{ display: 'block', marginBottom: '0.35rem' }}>Date</span>
          <input type="date" required min={today} value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rihla-field" style={fieldStyle} />
        </label>
        <label className="rihla-field-label" style={{ marginBottom: 0 }}>
          <span style={{ display: 'block', marginBottom: '0.35rem' }}>From</span>
          <input type="time" required value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="rihla-field" style={fieldStyle} />
        </label>
        <label className="rihla-field-label" style={{ marginBottom: 0 }}>
          <span style={{ display: 'block', marginBottom: '0.35rem' }}>Until</span>
          <input type="time" required value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="rihla-field" style={fieldStyle} />
        </label>
        <button type="submit" disabled={saving} className="rihla-btn"
          style={{ padding: '0.65rem 1.3rem', fontSize: '0.9rem', lineHeight: 1.2, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Adding…' : 'Add slot'}
        </button>
      </form>

      {/* Slot list */}
      {slots.length === 0 ? (
        <p className="rihla-inset" style={{ padding: '1rem', fontSize: '0.88rem', color: 'var(--rihla-ink-soft)', margin: 0 }}>
          You have no upcoming availability. Add a slot above so tourists can book you.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {slots.map(slot => (
            <div key={slot.id} style={{
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem 1rem',
              borderRadius: '14px', border: '1px solid var(--rihla-border-bronze)', background: '#ffffff',
            }}>
              <div style={{ flex: 1, fontSize: '0.92rem', fontWeight: 600, color: 'var(--rihla-ink)' }}>
                {formatDate(slot.date)}
                <span style={{ fontWeight: 450, color: 'var(--rihla-ink-soft)' }}> · {slot.startTime}–{slot.endTime}</span>
              </div>
              {slot.isBooked ? (
                <span className="rihla-badge rihla-badge-pending">Booked</span>
              ) : (
                <>
                  <span className="rihla-badge rihla-badge-confirmed">Open</span>
                  <button onClick={() => deleteSlot(slot.id)} disabled={deletingId === slot.id}
                    style={{
                      background: 'none', border: 'none', cursor: deletingId === slot.id ? 'not-allowed' : 'pointer',
                      color: 'var(--rihla-ink-soft)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'underline',
                      fontFamily: 'var(--rihla-font-body)',
                    }}>
                    {deletingId === slot.id ? 'Removing…' : 'Remove'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
