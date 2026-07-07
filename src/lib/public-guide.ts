import { Prisma } from "../../generated/prisma";

// The only guide fields allowed on public surfaces (search API, home page).
// Contact details (guide phone, user email) are deliberately absent:
// they are revealed to the tourist only after a paid booking, never before.
export const publicGuideSelect = {
  id: true,
  bio: true,
  city: true,
  languages: true,
  guideType: true,
  university: true,
  hourlyRate: true,
  packagePrice: true,
  maxGroupSize: true,
  rating: true,
  reviewCount: true,
  isVerified: true,
  coverImage: true,
  user: { select: { name: true, image: true } },
} satisfies Prisma.GuideSelect;
