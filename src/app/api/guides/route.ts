export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicGuideSelect } from '@/lib/public-guide';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q') || '';
  const languages = searchParams.getAll('lang');
  const maxPrice = searchParams.get('maxPrice');
  const city = searchParams.get('city');

  // Build the Prisma where clause as an AND of independent filters
  const conditions: Record<string, unknown>[] = [];

  // Text search: match guide bio, city, or guide name
  if (q) {
    conditions.push({
      OR: [
        { bio: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  // Language filter: guide must speak ALL selected languages
  if (languages.length > 0) {
    conditions.push({ languages: { hasEvery: languages } });
  }

  // Price filter: students are priced hourly, professionals per package
  if (maxPrice) {
    const price = parseFloat(maxPrice);
    conditions.push({
      OR: [{ hourlyRate: { lte: price } }, { packagePrice: { lte: price } }],
    });
  }

  // City/tag filter: tags like "Damascus" match the city, tags like "Food" match the bio
  if (city) {
    conditions.push({
      OR: [
        { city: { contains: city, mode: 'insensitive' } },
        { bio: { contains: city, mode: 'insensitive' } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  try {
    const guides = await prisma.guide.findMany({
      where,
      select: publicGuideSelect,
      orderBy: { rating: 'desc' },
      take: 20,
    });

    return NextResponse.json({ guides, count: guides.length });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ guides: [], count: 0, error: 'Search failed' }, { status: 500 });
  }
}
