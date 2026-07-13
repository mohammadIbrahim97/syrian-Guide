export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicGuideSelect } from '@/lib/public-guide';
import { THEME_TAGS } from '@/lib/themes';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q') || '';
  const languages = searchParams.getAll('lang');
  const maxPrice = searchParams.get('maxPrice');
  const country = searchParams.get('country');
  const theme = searchParams.get('theme');

  // Build the Prisma where clause as an AND of independent filters
  const conditions: Record<string, unknown>[] = [];

  // Text search: match guide bio, city, country, or guide name
  if (q) {
    conditions.push({
      OR: [
        { bio: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }

  // Country filter: exact match from the hero dropdown (Syria/Lebanon/Jordan)
  if (country) {
    conditions.push({ country });
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

  // Theme filter: a hero chip label maps to keywords matched against bio or city
  if (theme) {
    const themeDef = THEME_TAGS.find((t) => t.label === theme);
    if (themeDef) {
      conditions.push({
        OR: themeDef.keywords.flatMap((keyword) => [
          { bio: { contains: keyword, mode: 'insensitive' } },
          { city: { contains: keyword, mode: 'insensitive' } },
        ]),
      });
    }
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
