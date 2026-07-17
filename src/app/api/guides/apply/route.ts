export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to become a guide" }, { status: 401 });
    }
    const userId = user.id;

    const rl = rateLimit("apply", userId);
    if (!rl.ok) {
      return tooManyRequests(rl.retryAfterSeconds);
    }

    // A user may hold only one guide profile
    const existing = await prisma.guide.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "You already have a guide profile" }, { status: 409 });
    }

    const {
      guideType,
      bio,
      city,
      languages,
      maxGroupSize,
      university,
      hourlyRate,
      packagePrice,
      packageDuration,
      phone: phoneRaw,
    } = await request.json();

    if (!bio || !city || !Array.isArray(languages) || languages.length === 0) {
      return NextResponse.json(
        { error: "Bio, city, and at least one language are required" },
        { status: 400 }
      );
    }

    if (guideType !== "STUDENT" && guideType !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Please choose a guide type" }, { status: 400 });
    }

    const groupSize = Number.isInteger(maxGroupSize) && maxGroupSize > 0 ? maxGroupSize : 1;

    // Optional WhatsApp/phone number. Only shared with a tourist after a paid
    // booking (never on public surfaces), but validated here on the way in.
    let phone: string | null = null;
    if (phoneRaw != null && phoneRaw !== "") {
      if (typeof phoneRaw !== "string" || !/^\+?[\d\s\-()]{6,20}$/.test(phoneRaw.trim())) {
        return NextResponse.json(
          { error: "Please enter a valid phone number, e.g. +963 944 123 456" },
          { status: 400 }
        );
      }
      phone = phoneRaw.trim();
    }

    // Students are hired by the hour; professionals sell a fixed package
    let data;
    if (guideType === "STUDENT") {
      if (typeof hourlyRate !== "number" || hourlyRate <= 0) {
        return NextResponse.json({ error: "Please set an hourly rate" }, { status: 400 });
      }
      data = {
        userId,
        guideType,
        bio,
        city,
        phone,
        languages,
        university: university || null,
        hourlyRate,
        maxGroupSize: groupSize,
        isVerified: false,
      };
    } else {
      if (typeof packagePrice !== "number" || packagePrice <= 0) {
        return NextResponse.json({ error: "Please set a package price" }, { status: 400 });
      }
      data = {
        userId,
        guideType,
        bio,
        city,
        phone,
        languages,
        packagePrice,
        packageDuration: typeof packageDuration === "number" ? packageDuration : null,
        maxGroupSize: groupSize,
        isVerified: false,
      };
    }

    // Create the profile and promote the user to GUIDE atomically
    const guide = await prisma.$transaction(async (tx) => {
      const created = await tx.guide.create({ data });
      await tx.user.update({ where: { id: userId }, data: { role: "GUIDE" } });
      return created;
    });

    return NextResponse.json({ id: guide.id }, { status: 201 });
  } catch (error) {
    console.error("Guide application error:", error);
    return NextResponse.json({ error: "Failed to create guide profile" }, { status: 500 });
  }
}
