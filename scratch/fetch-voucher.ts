import { config } from 'dotenv';
config({ path: '.env' });
import { prisma } from '../src/lib/db';
import { generateVoucherXml } from '../src/lib/tally/xml-generator';

async function main() {
  const latestVoucher = await prisma.voucher.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
      invoice: { include: { firm: true } }
    }
  });

  if (!latestVoucher) {
    console.log('No vouchers found in DB.');
    return;
  }

  console.log('Latest Voucher details:', JSON.stringify(latestVoucher, null, 2));
  console.log('\n--- Generated XML ---');
  try {
    const xml = generateVoucherXml(latestVoucher as any);
    console.log(xml);
    
    console.log('\n--- Testing Push to Tally ---');
    const TALLY_URL = 'http://localhost:9000';
    const response = await fetch(TALLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });
    console.log(await response.text());
  } catch (e) {
    console.error('Failed:', e);
  }
}

main();
