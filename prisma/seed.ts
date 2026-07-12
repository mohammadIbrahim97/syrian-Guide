import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../src/lib/prisma'

// IMPORTANT: DATABASE_URL must point at the SAME Supabase project as
// NEXT_PUBLIC_SUPABASE_URL. The auth admin API creates users on Supabase and
// the DB trigger mirrors them into public."User" THERE — if Prisma is pointed
// at a different database, the update below fails with P2025 (record not found).

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Password for the demo guide logins. A repo-committed password would let
// anyone log in as a verified guide in production, so the default is random
// per run (demo guides then serve as display data only). Set
// SEED_GUIDE_PASSWORD when you actually need to log in as a demo guide.
// Note: only applied when the auth user is first CREATED — re-running the
// seed never resets an existing user's password.
const DEMO_PASSWORD = process.env.SEED_GUIDE_PASSWORD ?? randomBytes(16).toString('base64url')

// Demo guide roster across the Levant (Syria, Lebanon, Jordan) — mirrors the
// Rihla design's demo data. STUDENT guides are hired by the hour,
// PROFESSIONAL guides sell a fixed tour package.
type SeedGuide = {
  name: string
  email: string
  phone: string
  bio: string
  city: string
  country: string
  languages: string[]
  guideType: 'STUDENT' | 'PROFESSIONAL'
  university?: string
  hourlyRate?: number
  packagePrice?: number
  packageDuration?: number
  maxGroupSize?: number
  rating: number
  reviewCount: number
  tags: string[]
}

const GUIDES: SeedGuide[] = [
  {
    name: 'Ahmad Al-Dimashqi', email: 'ahmad.guide@example.com', phone: '+963 944 123 456',
    bio: 'History student and expert in Umayyad heritage. I love showing visitors the ancient alleys, the spice souks and the Umayyad Mosque.',
    city: 'Damascus', country: 'Syria', languages: ['Arabic', 'English'], guideType: 'STUDENT',
    university: 'Damascus University', hourlyRate: 10, maxGroupSize: 1, rating: 4.9, reviewCount: 42,
    tags: ['Old City', 'Souks', 'Umayyad heritage'],
  },
  {
    name: 'Layla Haddad', email: 'layla.guide@example.com', phone: '+963 933 987 654',
    bio: 'Licensed tour guide working with Aleppo Heritage Tours. My signature package covers the Citadel, the old souks, and traditional food stops.',
    city: 'Aleppo', country: 'Syria', languages: ['Arabic', 'English', 'French'], guideType: 'PROFESSIONAL',
    packagePrice: 25, packageDuration: 180, maxGroupSize: 4, rating: 4.7, reviewCount: 118,
    tags: ['Citadel', 'Food & souks', 'Home cooking'],
  },
  {
    name: 'Karim Fares', email: 'karim.guide@example.com', phone: '+961 3 456 789',
    bio: 'Professional guide on the Lebanese coast. Cedars forest walks, Phoenician ruins of Byblos, and a long mezze lunch by the harbour.',
    city: 'Byblos', country: 'Lebanon', languages: ['Arabic', 'English', 'French'], guideType: 'PROFESSIONAL',
    packagePrice: 35, packageDuration: 240, maxGroupSize: 6, rating: 4.8, reviewCount: 64,
    tags: ['Cedars', 'Phoenician ruins', 'Mezze'],
  },
  {
    name: 'Yousef Nawafleh', email: 'yousef.guide@example.com', phone: '+962 79 123 4567',
    bio: 'Bedouin roots, licensed for Petra and Wadi Rum. Nabataean trails by day, desert tea by night — my package is the long way round, on purpose.',
    city: 'Petra', country: 'Jordan', languages: ['Arabic', 'English'], guideType: 'PROFESSIONAL',
    packagePrice: 45, packageDuration: 360, maxGroupSize: 10, rating: 4.9, reviewCount: 203,
    tags: ['Petra by night', 'Wadi hikes', 'Bedouin tea'],
  },
  {
    name: 'Nour Barakat', email: 'nour.guide@example.com', phone: '+963 955 221 340',
    bio: 'Art history student passionate about culture. My walks cover the Old City churches, mosques and the craft workshops of Straight Street.',
    city: 'Damascus', country: 'Syria', languages: ['Arabic', 'English', 'Spanish'], guideType: 'STUDENT',
    university: 'Damascus University', hourlyRate: 12, maxGroupSize: 3, rating: 5.0, reviewCount: 31,
    tags: ['Calligraphy', 'Old City', 'Crafts'],
  },
  {
    name: 'Maya Khalil', email: 'maya.guide@example.com', phone: '+961 71 890 234',
    bio: 'Architecture student in Beirut. Corniche sunsets, gallery hopping, street food and the stories the city walls still tell.',
    city: 'Beirut', country: 'Lebanon', languages: ['Arabic', 'English', 'French'], guideType: 'STUDENT',
    university: 'American University of Beirut', hourlyRate: 14, maxGroupSize: 3, rating: 4.9, reviewCount: 27,
    tags: ['Street food', 'Architecture', 'Corniche'],
  },
  {
    name: 'Rania Khoury', email: 'rania.guide@example.com', phone: '+963 988 410 275',
    bio: 'Professional culinary guide. My food and culture package takes you through Damascus markets, spice souks and a home-cooked lunch.',
    city: 'Damascus', country: 'Syria', languages: ['Arabic', 'English', 'French'], guideType: 'PROFESSIONAL',
    packagePrice: 40, packageDuration: 240, maxGroupSize: 6, rating: 4.8, reviewCount: 86,
    tags: ['Food & souks', 'Home cooking', 'Markets'],
  },
  {
    name: 'Salma Odeh', email: 'salma.guide@example.com', phone: '+962 77 654 3210',
    bio: 'Student guide in Amman. Roman theatre, downtown balad walks, and the best kunafa food stop in the city — half-day walks my speciality.',
    city: 'Amman', country: 'Jordan', languages: ['Arabic', 'English', 'German'], guideType: 'STUDENT',
    university: 'University of Jordan', hourlyRate: 11, maxGroupSize: 4, rating: 4.6, reviewCount: 19,
    tags: ['Roman heritage', 'Kunafa', 'Downtown'],
  },
  {
    name: 'Dima Aziz', email: 'dima.guide@example.com', phone: '+963 941 778 902',
    bio: 'Literature student from the coast. Latakia seafront culture, the mountain castle of Saladin and the best seafood stops.',
    city: 'Latakia', country: 'Syria', languages: ['Arabic', 'English', 'French'], guideType: 'STUDENT',
    university: 'Tishreen University', hourlyRate: 8, maxGroupSize: 2, rating: 4.7, reviewCount: 12,
    tags: ['Coast', 'Seafood', 'Castles'],
  },
  {
    name: 'Omar Kassab', email: 'omar.guide@example.com', phone: '+963 932 645 118',
    bio: 'Architecture student fascinated by history. Day walks around old Homs, Khalid ibn al-Walid Mosque and the covered souk markets.',
    city: 'Homs', country: 'Syria', languages: ['Arabic', 'English', 'German'], guideType: 'STUDENT',
    university: 'Al-Baath University', hourlyRate: 8, maxGroupSize: 2, rating: 4.6, reviewCount: 23,
    tags: ['Old Homs', 'Heritage', 'Souks'],
  },
  {
    name: 'Sami Al-Halabi', email: 'sami.guide@example.com', phone: '+963 999 305 461',
    bio: 'Engineering student and photography lover. Sunrise walks around the Citadel of Aleppo and portraits in the old alleys.',
    city: 'Aleppo', country: 'Syria', languages: ['Arabic', 'English'], guideType: 'STUDENT',
    university: 'University of Aleppo', hourlyRate: 9, maxGroupSize: 2, rating: 4.5, reviewCount: 17,
    tags: ['Photography', 'Citadel', 'Sunrise walks'],
  },
  {
    name: 'Khaled Mansour', email: 'khaled.guide@example.com', phone: '+963 945 530 287',
    bio: 'Professional guide for Krak des Chevaliers and the Homs countryside. Fixed-route heritage package including the monastery of Mar Musa.',
    city: 'Homs', country: 'Syria', languages: ['Arabic', 'English'], guideType: 'PROFESSIONAL',
    packagePrice: 30, packageDuration: 300, maxGroupSize: 8, rating: 4.4, reviewCount: 52,
    tags: ['Krak des Chevaliers', 'Ruins', 'Countryside'],
  },
]

// A date N days from now, normalized to midnight UTC (AvailabilitySlot.date is a DATE column)
function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

// Create the auth user (idempotent) and return its id. The DB trigger creates
// the matching public.User row; we return the id to attach a guide profile.
async function ensureAuthUser(email: string, password: string, name: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (data?.user) return data.user.id

  // Already exists — find the id by paging the user list.
  if (error) {
    for (let page = 1; page <= 10; page++) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
      const found = list.users.find((u) => u.email === email)
      if (found) return found.id
      if (list.users.length < 200) break
    }
  }
  throw new Error(`Could not create or find auth user for ${email}: ${error?.message}`)
}

async function main() {
  const userIds: string[] = []

  for (const g of GUIDES) {
    const userId = await ensureAuthUser(g.email, DEMO_PASSWORD, g.name)
    userIds.push(userId)

    const profile = {
      bio: g.bio,
      city: g.city,
      country: g.country,
      phone: g.phone,
      languages: g.languages,
      guideType: g.guideType,
      university: g.university ?? null,
      hourlyRate: g.hourlyRate ?? null,
      packagePrice: g.packagePrice ?? null,
      packageDuration: g.packageDuration ?? null,
      maxGroupSize: g.maxGroupSize ?? 1,
      rating: g.rating,
      reviewCount: g.reviewCount,
      isVerified: true,
      tags: g.tags,
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: g.name,
        role: 'GUIDE',
        guideProfile: {
          upsert: {
            create: profile,
            // Backfill fields added since the profile was first seeded
            // (phone, and the Rihla country/tags) on already-seeded databases
            update: { phone: g.phone, country: g.country, tags: g.tags },
          },
        },
      },
    })
  }

  // Open upcoming availability for all guides so they are bookable
  const guides = await prisma.guide.findMany({
    where: { userId: { in: userIds } },
  })
  for (const guide of guides) {
    await prisma.availabilitySlot.createMany({
      data: [
        { guideId: guide.id, date: daysFromNow(2), startTime: '09:00', endTime: '13:00' },
        { guideId: guide.id, date: daysFromNow(4), startTime: '10:00', endTime: '16:00' },
        { guideId: guide.id, date: daysFromNow(7), startTime: '09:00', endTime: '12:00' },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
