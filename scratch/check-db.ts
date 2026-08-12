import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
config() // Loads .env

const prisma = new PrismaClient()

async function checkDb() {
  const firms = await prisma.firm.findMany()
  console.log('Firms:', firms.length)
  const clients = await prisma.client.findMany()
  console.log('Clients:', clients.length, clients.map(c => c.name))
}

checkDb().catch(console.error).finally(() => prisma.$disconnect())
