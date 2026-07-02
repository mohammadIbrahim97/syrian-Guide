import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch availability slots for a guide
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const guideId = searchParams.get("guideId");

  if (!guideId) {
    return NextResponse.json({ error: "guideId is required" }, { status: 400 });
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      guideId,
      date: { gte: new Date() },
      isBooked: false,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}

// POST: Create availability slots (guide only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guide = await prisma.guide.findUnique({
    where: { userId: session.user.id },
  });

  if (!guide) {
    return NextResponse.json({ error: "You are not a guide" }, { status: 403 });
  }

  const { slots } = await request.json();
  // slots: [{ date: "2026-07-10", startTime: "09:00", endTime: "13:00" }, ...]

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: "Provide at least one slot" }, { status: 400 });
  }

  const created = await prisma.availabilitySlot.createMany({
    data: slots.map((slot: { date: string; startTime: string; endTime: string }) => ({
      guideId: guide.id,
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ created: created.count });
}

// DELETE: Remove an availability slot (guide only)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await request.json();

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: slotId },
    include: { guide: true },
  });

  if (!slot || slot.guide.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
  }

  if (slot.isBooked) {
    return NextResponse.json({ error: "Cannot delete a booked slot" }, { status: 400 });
  }

  await prisma.availabilitySlot.delete({ where: { id: slotId } });

  return NextResponse.json({ deleted: true });
}
