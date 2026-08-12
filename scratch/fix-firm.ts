import { prisma } from '../src/lib/db'

async function fix() {
  const firm = await prisma.firm.findFirst();
  console.log('Current Firm Name:', firm?.name);
  if (firm && firm.name === 'Dummy Clint') {
    await prisma.firm.update({
      where: { id: firm.id },
      data: { name: 'Dummy Client' }
    });
    console.log('Fixed firm name to Dummy Client');
  } else {
    console.log('Firm name is already', firm?.name);
  }
}

fix()
  .then(() => process.exit(0))
  .catch(e => { 
    console.error(e); 
    process.exit(1); 
  });
