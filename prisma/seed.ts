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
  const ahmadId = await ensureAuthUser('ahmad.guide@example.com', 'SyriaGuide-Demo-2026!', 'Ahmad Al-Dimashqi')
  const laylaId = await ensureAuthUser('layla.guide@example.com', 'SyriaGuide-Demo-2026!', 'Layla Haddad')

  // Student guide: hired by the hour
  await prisma.user.update({
    where: { id: ahmadId },
    data: {
      name: 'Ahmad Al-Dimashqi',
      role: 'GUIDE',
      guideProfile: {
        upsert: {
          create: {
            bio: 'History student and expert in Umayyad history. I love showing visitors the ancient alleys and the Umayyad Mosque.',
            city: 'Damascus',
            phone: '+963 944 123 456',
            languages: ['Arabic', 'English'],
            guideType: 'STUDENT',
            university: 'Damascus University',
            hourlyRate: 10.0,
            rating: 4.9,
            reviewCount: 42,
            isVerified: true,
          },
          // Backfill the demo phone on already-seeded databases
          update: { phone: '+963 944 123 456' },
        },
      },
    },
  })

  // Professional guide: sells a fixed tour package
  await prisma.user.update({
    where: { id: laylaId },
    data: {
      name: 'Layla Haddad',
      role: 'GUIDE',
      guideProfile: {
        upsert: {
          create: {
            bio: 'Licensed tour guide working with Aleppo Heritage Tours. My signature package covers the Citadel, the old souks, and traditional food stops.',
            city: 'Aleppo',
            phone: '+963 933 987 654',
            languages: ['Arabic', 'English', 'French'],
            guideType: 'PROFESSIONAL',
            packagePrice: 25.0,
            packageDuration: 180,
            maxGroupSize: 4,
            rating: 4.7,
            reviewCount: 118,
            isVerified: true,
          },
          // Backfill the demo phone on already-seeded databases
          update: { phone: '+963 933 987 654' },
        },
      },
    },
  })

  // Open upcoming availability for both guides so they are bookable
  const guides = await prisma.guide.findMany({
    where: { userId: { in: [ahmadId, laylaId] } },
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
