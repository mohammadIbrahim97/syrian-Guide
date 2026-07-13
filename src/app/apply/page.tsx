import React from 'react';
import RihlaHeader from '@/components/RihlaHeader';
import ApplyForm from './ApplyForm';

// Server shell: renders the auth-aware Rihla chrome around the client form
// (RihlaHeader/NavActions read the session server-side and must not be
// imported from a client component).
export default function ApplyPage() {
  return (
    <div className="rihla-page">
      <RihlaHeader />
      <ApplyForm />
    </div>
  );
}
