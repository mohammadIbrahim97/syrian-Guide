import React from 'react';

const BADGE_CLASS: Record<string, string> = {
  CONFIRMED: 'tag-badge-success',
  PENDING: 'tag-badge-warning',
  CANCELLED: 'tag-badge-neutral',
  COMPLETED: 'tag-badge-success',
};

export default function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`tag-badge ${BADGE_CLASS[status] ?? 'tag-badge-neutral'}`}>
      {status.toLowerCase()}
    </span>
  );
}
