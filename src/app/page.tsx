import React from 'react';
import { prisma } from '@/lib/prisma';
import { publicGuideSelect } from '@/lib/public-guide';
import SearchableGuides from '@/components/SearchableGuides';
import RihlaHeader from '@/components/RihlaHeader';
import RihlaFooter from '@/components/RihlaFooter';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch initial guides on the server for fast first paint.
  // publicGuideSelect: these rows are serialized into the client payload,
  // so contact fields must never be included here.
  const initialGuides = await prisma.guide.findMany({
    select: publicGuideSelect,
    take: 20,
    orderBy: { rating: 'desc' }
  });

  return (
    <div className="rihla-page">
      <RihlaHeader />

      {/* Hero + searchable guide grid */}
      <SearchableGuides initialGuides={JSON.parse(JSON.stringify(initialGuides))} />

      <RihlaFooter />
    </div>
  );
}
