import { prisma } from '../src/lib/prisma'

// A date N days from now, normalized to midnight UTC (AvailabilitySlot.date is a DATE column)
function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

async function main() {
  // Student guide: hired by the hour
  await prisma.user.upsert({
    where: { email: 'ahmad.guide@example.com' },
    update: {},
    create: {
      name: 'Ahmad Al-Dimashqi',
      email: 'ahmad.guide@example.com',
      role: 'GUIDE',
      guideProfile: {
        create: {
          bio: 'History student and expert in Umayyad history. I love showing visitors the ancient alleys and the Umayyad Mosque.',
          city: 'Damascus',
          languages: ['Arabic', 'English'],
          guideType: 'STUDENT',
          university: 'Damascus University',
          hourlyRate: 10.0,
          rating: 4.9,
          reviewCount: 42,
          isVerified: true
        }
      }
    }
  })

  // Professional guide: sells a fixed tour package
  await prisma.user.upsert({
    where: { email: 'layla.guide@example.com' },
    update: {},
    create: {
      name: 'Layla Haddad',
      email: 'layla.guide@example.com',
      role: 'GUIDE',
      guideProfile: {
        create: {
          bio: 'Licensed tour guide working with Aleppo Heritage Tours. My signature package covers the Citadel, the old souks, and traditional food stops.',
          city: 'Aleppo',
          languages: ['Arabic', 'English', 'French'],
          guideType: 'PROFESSIONAL',
          packagePrice: 25.0,
          packageDuration: 180,
          maxGroupSize: 4,
          rating: 4.7,
          reviewCount: 118,
          isVerified: true
        }
      }
    }
  })

  // Open upcoming availability for both guides so they are bookable
  const guides = await prisma.guide.findMany({
    where: { user: { email: { in: ['ahmad.guide@example.com', 'layla.guide@example.com'] } } },
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
