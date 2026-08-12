import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding the database with default firm and user...')

  // 1. Create Default Firm
  const firm = await prisma.firm.upsert({
    where: { gstin: '27AAAAA0000A1Z5' },
    update: {},
    create: {
      name: 'Default Demo CA Firm',
      gstin: '27AAAAA0000A1Z5',
      email: 'admin@demo-ca.com',
      phone: '9999999999',
    },
  })

  // 2. Create Default User (No-Auth Mode)
  const user = await prisma.user.upsert({
    where: { email: 'admin@demo-ca.com' },
    update: {},
    create: {
      email: 'admin@demo-ca.com',
      role: 'ADMIN',
      firmId: firm.id,
      isActive: true,
    },
  })

  // 3. Create a Default Client for this firm
  let client = await prisma.client.findFirst({ where: { email: 'billing@acmecorp.com' } })
  if (!client) {
    client = await prisma.client.create({
      data: {
        firmId: firm.id,
        name: 'Acme Corp',
        companyName: 'Acme Corporation Ltd',
        email: 'billing@acmecorp.com',
      }
    })
  }

  console.log('✅ Seeding finished.')
  console.log('Firm ID:', firm.id)
  console.log('Admin User ID:', user.id)
  console.log('Client ID:', client.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
