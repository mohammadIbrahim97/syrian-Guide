export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

// Most unpaid (PENDING) bookings one user may hold at once. Each checkout
// claims its slot (isBooked=true) before payment and only frees it when the
// Stripe session expires (~35 min later, via checkout.session.expired). Without
// this cap a user could loop over every guide's slots and lock the whole
// marketplace's inventory for free. Abandoned sessions expire and release their
// slot, so a capped user recovers automatically.
const MAX_PENDING_BOOKINGS = 3;

function pendingLimitResponse() {
  return NextResponse.json(
    {
      error:
        "You have too many unpaid bookings. Please complete a payment or wait for one to expire before booking again.",
    },
    { status: 409 }
  );
}

// Length of a slot like 09:00–13:00 in whole hours (rounded down)
function slotLengthHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.floor((eh * 60 + em - (sh * 60 + sm)) / 60);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to book" }, { status: 401 });
    }
    const userId = user.id;

    const rl = rateLimit("checkout", userId);
    if (!rl.ok) {
      return tooManyRequests(rl.retryAfterSeconds);
    }

    const { guideId, slotId, durationHours, participants } = await request.json();

    if (!guideId || !slotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fast pre-check: reject before creating a Stripe session (which costs API
    // quota) when the user is already at the unpaid-booking cap. The
    // transactional re-check below is the race-safe authority.
    const pendingCount = await prisma.booking.count({
      where: { userId, status: "PENDING" },
    });
    if (pendingCount >= MAX_PENDING_BOOKINGS) {
      return pendingLimitResponse();
    }

    // The slot decides the date; the client can only pick from real availability
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { guide: { include: { user: true } } },
    });

    if (!slot) {
      return NextResponse.json({ error: "Availability slot not found" }, { status: 404 });
    }
    if (slot.guideId !== guideId) {
      return NextResponse.json({ error: "Slot does not belong to this guide" }, { status: 400 });
    }
    if (slot.isBooked) {
      return NextResponse.json({ error: "This slot has just been booked" }, { status: 409 });
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (slot.date < today) {
      return NextResponse.json({ error: "This slot is in the past" }, { status: 400 });
    }

    const guide = slot.guide;

    // Pricing depends on the guide type:
    // - STUDENT guides are hired by the hour (hourlyRate × durationHours)
    // - PROFESSIONAL guides sell a fixed package (packagePrice × participants)
    let totalPrice: number;
    let description: string;
    const dateLabel = slot.date.toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });

    if (guide.guideType === "STUDENT") {
      if (!Number.isInteger(durationHours) || durationHours < 1) {
        return NextResponse.json(
          { error: "Please select how many hours to book" },
          { status: 400 }
        );
      }
      if (durationHours > slotLengthHours(slot.startTime, slot.endTime)) {
        return NextResponse.json(
          { error: `This slot is only ${slotLengthHours(slot.startTime, slot.endTime)} hour(s) long` },
          { status: 400 }
        );
      }
      if (!guide.hourlyRate) {
        return NextResponse.json({ error: "This guide has no hourly rate set" }, { status: 400 });
      }
      totalPrice = guide.hourlyRate * durationHours;
      description = `${durationHours} hour(s) with ${guide.user.name} · ${dateLabel} from ${slot.startTime}`;
    } else {
      if (!Number.isInteger(participants) || participants < 1) {
        return NextResponse.json(
          { error: "Please select the number of participants" },
          { status: 400 }
        );
      }
      if (participants > guide.maxGroupSize) {
        return NextResponse.json(
          { error: `Maximum group size is ${guide.maxGroupSize}` },
          { status: 400 }
        );
      }
      if (!guide.packagePrice) {
        return NextResponse.json({ error: "This guide has no package price set" }, { status: 400 });
      }
      totalPrice = guide.packagePrice * participants;
      description = `Tour package with ${guide.user.name} · ${participants} person(s) · ${dateLabel} from ${slot.startTime}`;
    }

    const serviceFee = Math.round(totalPrice * 0.1 * 100) / 100;
    const grandTotal = totalPrice + serviceFee;

    // Create Stripe Checkout Session. The slot is claimed below before the
    // user pays, so the session must expire quickly — the webhook releases
    // the slot on checkout.session.expired (Stripe's minimum is 30 minutes).
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 35 * 60,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Private guide: ${guide.user.name}`,
              description,
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe uses cents
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Service Fee",
            },
            unit_amount: Math.round(serviceFee * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        guideId,
        slotId,
        userId,
        date: slot.date.toISOString(),
        durationHours: durationHours ? String(durationHours) : "",
        participants: participants ? String(participants) : "1",
        totalPrice: String(grandTotal),
      },
      success_url: `${process.env.APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/guides/${guideId}?cancelled=true`,
    });

    // Claim the slot and create the booking atomically. The compare-and-set
    // update is the double-booking guard: only one request can flip
    // isBooked false -> true, and Booking.slotId is unique as a backstop.
    try {
      await prisma.$transaction(async (tx) => {
        // Lock this user's row so concurrent checkouts for the same account
        // serialize here; the pending re-check below then sees an accurate
        // count and the cap can't be raced past. (Same technique the gallery
        // photo cap uses via a FOR UPDATE row lock.)
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

        const pending = await tx.booking.count({
          where: { userId, status: "PENDING" },
        });
        if (pending >= MAX_PENDING_BOOKINGS) {
          throw new Error("PENDING_LIMIT");
        }

        const claimed = await tx.availabilitySlot.updateMany({
          where: { id: slotId, isBooked: false },
          data: { isBooked: true },
        });
        if (claimed.count !== 1) {
          throw new Error("SLOT_TAKEN");
        }

        await tx.booking.create({
          data: {
            guideId,
            slotId,
            userId,
            date: slot.date,
            durationHours: guide.guideType === "STUDENT" ? durationHours : null,
            participants: guide.guideType === "PROFESSIONAL" ? participants : 1,
            totalPrice: grandTotal,
            status: "PENDING",
            stripeSessionId: stripeSession.id,
          },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "PENDING_LIMIT") {
        return pendingLimitResponse();
      }
      if (err instanceof Error && err.message === "SLOT_TAKEN") {
        return NextResponse.json({ error: "This slot has just been booked" }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
