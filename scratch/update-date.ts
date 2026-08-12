import { config } from 'dotenv';
config({ path: '.env' });
import { prisma } from '../src/lib/db';

async function main() {
  const vouchers = await prisma.voucher.findMany();
  let updatedCount = 0;
  
  for (const voucher of vouchers) {
    if (voucher.voucherDate) {
      const d = new Date(voucher.voucherDate);
      if (d.getFullYear() === 2025) {
        d.setFullYear(2026);
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { voucherDate: d }
        });
        updatedCount++;
      }
    }
  }
  
  console.log(`Updated ${updatedCount} vouchers to year 2026.`);
}

main();
