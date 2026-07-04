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

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
    fontSize: '15px', backgroundColor: 'white',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--neutral-gray)',
  };

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEE2E2',
          color: '#DC2626', fontSize: '14px', marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Add slot form */}
      <form onSubmit={addSlot} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" required min={today} value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>From</label>
          <input type="time" required value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Until</label>
          <input type="time" required value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} />
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: '15px', borderRadius: '8px', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Adding…' : 'Add slot'}
        </button>
      </form>

      {/* Slot list */}
      {slots.length === 0 ? (
        <p style={{
          padding: '16px', borderRadius: '8px', backgroundColor: 'var(--neutral-light)',
          fontSize: '14px', color: 'var(--neutral-gray)', margin: 0,
        }}>
          You have no upcoming availability. Add a slot above so tourists can book you.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {slots.map(slot => (
            <div key={slot.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px',
              borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: 'white',
            }}>
              <div style={{ flex: 1, fontSize: '15px', fontWeight: 600 }}>
                {formatDate(slot.date)}
                <span style={{ fontWeight: 500, color: 'var(--neutral-gray)' }}> · {slot.startTime}–{slot.endTime}</span>
              </div>
              {slot.isBooked ? (
                <span className="tag-badge tag-badge-neutral">Booked</span>
              ) : (
                <>
                  <span className="tag-badge tag-badge-success">Open</span>
                  <button onClick={() => deleteSlot(slot.id)} disabled={deletingId === slot.id}
                    style={{
                      background: 'none', border: 'none', cursor: deletingId === slot.id ? 'not-allowed' : 'pointer',
                      color: 'var(--neutral-gray)', fontSize: '14px', fontWeight: 600, textDecoration: 'underline',
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
