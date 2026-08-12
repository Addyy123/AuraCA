import { prisma } from './src/lib/db'

async function check() {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'APPROVED' },
    include: { vouchers: true }
  })
  console.log(`Approved Invoices: ${invoices.length}`)
  invoices.forEach(i => console.log(`Invoice ${i.id}: ${i.vouchers.length} vouchers`))
}

check().catch(console.error).finally(() => process.exit(0))
