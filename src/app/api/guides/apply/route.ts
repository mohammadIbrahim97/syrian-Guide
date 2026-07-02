import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { city, bio, languages } = body;

    if (!city || !bio || !languages || !languages.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hole User aus DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prüfe, ob bereits ein Profil existiert
    const existingGuide = await prisma.guide.findUnique({
      where: { userId: user.id }
    });

    if (existingGuide) {
      return NextResponse.json({ error: 'Application already submitted' }, { status: 400 });
    }

    // Erstelle das Guide-Profil und setze die Rolle
    const guide = await prisma.$transaction(async (tx) => {
      const newGuide = await tx.guide.create({
        data: {
          userId: user.id,
          city,
          bio,
          languages,
          isVerified: false // Admin muss dies später auf true setzen
        }
      });

      // Update User Role to GUIDE
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'GUIDE' }
      });

      return newGuide;
    });

    return NextResponse.json({ success: true, guide });
  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
