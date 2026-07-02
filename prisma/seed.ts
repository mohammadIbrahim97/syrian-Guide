import { prisma } from '../src/lib/prisma'

async function main() {
  const guideUser = await prisma.user.upsert({
    where: { email: 'ahmad.guide@example.com' },
    update: {},
    create: {
      name: 'Ahmad Al-Dimashqi',
      email: 'ahmad.guide@example.com',
      role: 'GUIDE',
      guideProfile: {
        create: {
          bio: 'Expert in Umayyad history.',
          city: 'Damascus',
          languages: ['Arabic', 'English'],
          rating: 4.9,
          reviewCount: 42,
          isVerified: true
        }
      }
    },
    include: { guideProfile: true }
  })

  if (guideUser.guideProfile) {
    await prisma.tour.create({
      data: {
        title: 'Old Damascus Walking Tour',
        description: 'Explore the ancient alleys and the Umayyad Mosque.',
        price: 25.0,
        duration: 180,
        location: 'Damascus Old City',
        guideId: guideUser.guideProfile.id
      }
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
