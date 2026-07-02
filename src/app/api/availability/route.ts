import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:MM", 00:00–23:59

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

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

  // Validate each slot's shape and times
  for (const slot of slots as { date?: string; startTime?: string; endTime?: string }[]) {
    if (!slot.date || !slot.startTime || !slot.endTime ||
        !TIME_RE.test(slot.startTime) || !TIME_RE.test(slot.endTime)) {
      return NextResponse.json(
        { error: "Each slot needs a date and times in HH:MM format" },
        { status: 400 }
      );
    }
    if (toMinutes(slot.endTime) <= toMinutes(slot.startTime)) {
      return NextResponse.json(
        { error: "endTime must be after startTime" },
        { status: 400 }
      );
    }
  }

  // A guide must not have overlapping slots — that would allow double-booking
  // their time even though each individual slot can only be sold once.
  const typedSlots = slots as { date: string; startTime: string; endTime: string }[];
  for (let i = 0; i < typedSlots.length; i++) {
    for (let j = i + 1; j < typedSlots.length; j++) {
      if (
        typedSlots[i].date === typedSlots[j].date &&
        overlaps(typedSlots[i].startTime, typedSlots[i].endTime, typedSlots[j].startTime, typedSlots[j].endTime)
      ) {
        return NextResponse.json(
          { error: `Slots on ${typedSlots[i].date} overlap each other` },
          { status: 400 }
        );
      }
    }
  }

  const existing = await prisma.availabilitySlot.findMany({
    where: {
      guideId: guide.id,
      date: { in: [...new Set(typedSlots.map(s => s.date))].map(d => new Date(d)) },
    },
  });

  for (const slot of typedSlots) {
    const slotDate = new Date(slot.date).getTime();
    const conflict = existing.find(
      e => e.date.getTime() === slotDate && overlaps(slot.startTime, slot.endTime, e.startTime, e.endTime)
    );
    if (conflict) {
      return NextResponse.json(
        { error: `A slot on ${slot.date} overlaps your existing ${conflict.startTime}–${conflict.endTime} slot` },
        { status: 400 }
      );
    }
  }

  const created = await prisma.availabilitySlot.createMany({
    data: typedSlots.map((slot) => ({
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

  // Conditional delete: if a checkout claims the slot between the check above
  // and this statement, the isBooked filter matches 0 rows instead of tripping
  // the Booking.slotId foreign key.
  const deleted = await prisma.availabilitySlot.deleteMany({
    where: { id: slotId, isBooked: false },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Cannot delete a booked slot" }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
