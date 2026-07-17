import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    await prisma.user.findMany({ take: 1 })
    console.log('✅ Connected')
  } catch (error) {
    console.error('Connection failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
