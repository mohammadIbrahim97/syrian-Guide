import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Payment webhooks must always be signature-verified — a forged
  // checkout.session.completed event would confirm an unpaid booking.
  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set; refusing to process webhook");
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  }
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only confirm what Stripe reports as paid, and only bookings still
    // awaiting payment — re-deliveries and the success page stay idempotent.
    if (session.payment_status === "paid") {
      await prisma.booking.updateMany({
        where: { stripeSessionId: session.id, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;

    // The checkout claimed the slot before payment; an abandoned session
    // must give it back. Cancel the booking and reopen the slot together.
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { stripeSessionId: session.id },
      });
      if (!booking || booking.status !== "PENDING") return;

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });
      if (booking.slotId) {
        await tx.availabilitySlot.update({
          where: { id: booking.slotId },
          data: { isBooked: false },
        });
      }
    });
  }

  return NextResponse.json({ received: true });
}
