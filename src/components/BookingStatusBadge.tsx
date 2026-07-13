import React from 'react';

const BADGE_CLASS: Record<string, string> = {
  CONFIRMED: 'rihla-badge-confirmed',
  PENDING: 'rihla-badge-pending',
  CANCELLED: 'rihla-badge-cancelled',
  COMPLETED: 'rihla-badge-confirmed',
};

export default function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rihla-badge ${BADGE_CLASS[status] ?? 'rihla-badge-cancelled'}`}>
      {status.toLowerCase()}
    </span>
  );
}
