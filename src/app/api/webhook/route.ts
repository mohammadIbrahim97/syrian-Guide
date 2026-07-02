import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  // For local development without webhook signing secret, we handle both cases
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } else {
      // For development: parse the event directly
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // Update booking status to CONFIRMED
      await prisma.booking.update({
        where: { stripeSessionId: session.id },
        data: { status: "CONFIRMED" },
      });

      console.log(`✅ Booking confirmed for session ${session.id}`);
    } catch (error) {
      console.error("Failed to confirm booking:", error);
    }
  }

  return NextResponse.json({ received: true });
}
