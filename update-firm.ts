import { prisma } from './src/lib/db'

async function main() {
  const firm = await prisma.firm.findFirst()
  if (firm) {
    await prisma.firm.update({
      where: { id: firm.id },
      data: { name: 'Dummy Clint' }
    })
    console.log('Firm name updated to Dummy Clint')
  } else {
    console.log('No firm found in database')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })

