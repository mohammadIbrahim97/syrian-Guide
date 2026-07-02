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

    const { guideId, date, durationHours, participants } = await request.json();

    if (!guideId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch guide details
    const guide = await prisma.guide.findUnique({
      where: { id: guideId },
      include: { user: true },
    });

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    // Pricing depends on the guide type:
    // - STUDENT guides are hired by the hour (hourlyRate × durationHours)
    // - PROFESSIONAL guides sell a fixed package (packagePrice × participants)
    let totalPrice: number;
    let description: string;

    if (guide.guideType === "STUDENT") {
      if (!Number.isInteger(durationHours) || durationHours < 1) {
        return NextResponse.json(
          { error: "Please select how many hours to book" },
          { status: 400 }
        );
      }
      if (!guide.hourlyRate) {
        return NextResponse.json({ error: "This guide has no hourly rate set" }, { status: 400 });
      }
      totalPrice = guide.hourlyRate * durationHours;
      description = `${durationHours} hour(s) with ${guide.user.name} · ${new Date(date).toLocaleDateString("en-US", { dateStyle: "long" })}`;
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
      description = `Tour package with ${guide.user.name} · ${participants} person(s) · ${new Date(date).toLocaleDateString("en-US", { dateStyle: "long" })}`;
    }

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
        userId: session.user.id,
        date,
        durationHours: durationHours ? String(durationHours) : "",
        participants: participants ? String(participants) : "1",
        totalPrice: String(grandTotal),
      },
      success_url: `${process.env.NEXTAUTH_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/guides/${guideId}?cancelled=true`,
    });

    // Create a PENDING booking
    await prisma.booking.create({
      data: {
        guideId,
        userId: session.user.id,
        date: new Date(date),
        durationHours: guide.guideType === "STUDENT" ? durationHours : null,
        participants: guide.guideType === "PROFESSIONAL" ? participants : 1,
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
