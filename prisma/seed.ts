import { prisma } from '../src/lib/prisma'

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
