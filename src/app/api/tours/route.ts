import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q') || '';
  const languages = searchParams.getAll('lang');
  const maxPrice = searchParams.get('maxPrice');
  const city = searchParams.get('city');
  const sortBy = searchParams.get('sort') || 'rating';

  // Build the Prisma where clause dynamically
  const where: Record<string, unknown> = {};

  // Text search: match tour title, description, location, or guide name
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
      { guide: { user: { name: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  // Language filter: guide must speak ALL selected languages
  if (languages.length > 0) {
    where.guide = {
      ...(where.guide as Record<string, unknown> || {}),
      languages: { hasEvery: languages },
    };
  }

  // Price filter
  if (maxPrice) {
    where.price = { lte: parseFloat(maxPrice) };
  }

  // City/tag filter
  if (city) {
    where.location = { contains: city, mode: 'insensitive' };
  }

  // Sort
  let orderBy: Record<string, unknown> = {};
  switch (sortBy) {
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    default: // rating
      orderBy = { guide: { rating: 'desc' } };
  }

  try {
    const tours = await prisma.tour.findMany({
      where,
      include: {
        guide: {
          include: { user: true },
        },
      },
      orderBy,
      take: 20,
    });

    return NextResponse.json({ tours, count: tours.length });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ tours: [], count: 0, error: 'Search failed' }, { status: 500 });
  }
}
