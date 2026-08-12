import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ log: ['error'] })

async function seed() {
  let firm = await prisma.firm.findFirst()
  if (!firm) {
    firm = await prisma.firm.create({
      data: {
        name: 'Demo CA Firm',
        gstin: '27ABCDE1234F1Z5',
        settings: {}
      }
    })
    console.log('Created Firm:', firm.name)
  } else {
    console.log('Firm exists:', firm.name)
  }

  let client = await prisma.client.findFirst({ where: { firmId: firm.id } })
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: 'Dummy Client',
        gstin: '27XYZDE1234F1Z5',
        firmId: firm.id,
        settings: {}
      }
    })
    console.log('Created Client:', client.name)
  } else {
    console.log('Client exists:', client.name)
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect())
