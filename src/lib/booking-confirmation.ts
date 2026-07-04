import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Look up a booking by its Stripe checkout session, confirming it only when
// Stripe says the session was actually paid. The webhook does the same on
// checkout.session.completed; both paths only ever transition PENDING →
// CONFIRMED, so they are idempotent and never resurrect a cancelled booking.
export async function getVerifiedBooking(sessionId: string) {
  let paid = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    paid = session.payment_status === "paid";
  } catch {
    // Unknown or malformed session id — treat as unpaid
    paid = false;
  }

  if (paid) {
    await prisma.booking.updateMany({
      where: { stripeSessionId: sessionId, status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
  }

  return prisma.booking.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      guide: { include: { user: true } },
    },
  });
}
