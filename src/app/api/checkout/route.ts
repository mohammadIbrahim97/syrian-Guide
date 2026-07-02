import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to book" }, { status: 401 });
    }

    const { tourId, date, participants } = await request.json();

    if (!tourId || !date || !participants) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch tour details
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { guide: { include: { user: true } } },
    });

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    if (participants > tour.maxGroupSize) {
      return NextResponse.json(
        { error: `Maximum group size is ${tour.maxGroupSize}` },
        { status: 400 }
      );
    }

    const totalPrice = tour.price * participants;
    const serviceFee = Math.round(totalPrice * 0.1 * 100) / 100;
    const grandTotal = totalPrice + serviceFee;

    // Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: tour.title,
              description: `Tour with ${tour.guide.user.name} · ${participants} person(s) · ${new Date(date).toLocaleDateString("en-US", { dateStyle: "long" })}`,
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
        tourId,
        userId: session.user.id,
        date,
        participants: String(participants),
        totalPrice: String(grandTotal),
      },
      success_url: `${process.env.NEXTAUTH_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/tours/${tourId}?cancelled=true`,
    });

    // Create a PENDING booking
    await prisma.booking.create({
      data: {
        tourId,
        userId: session.user.id,
        date: new Date(date),
        participants,
        totalPrice: grandTotal,
        status: "PENDING",
        stripeSessionId: stripeSession.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
