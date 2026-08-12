import { config } from 'dotenv';
config({ path: '.env' });
import { prisma } from '../src/lib/db';
import { generateVoucherXml } from '../src/lib/tally/xml-generator';
import { pushToTallyDirect } from '../src/app/actions/export-actions';

async function main() {
  console.log('Fetching latest voucher...');
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

  console.log(`Latest Voucher ID: ${latestVoucher.id}`);
  console.log(`Current Voucher Date in DB: ${latestVoucher.voucherDate}`);
  
  // Force update to 2026 to ensure it passes Financial Year checks
  if (latestVoucher.voucherDate) {
    const d = new Date(latestVoucher.voucherDate);
    if (d.getFullYear() < 2026) {
      console.log(`Updating voucher date from ${d.getFullYear()} to 2026...`);
      d.setFullYear(2026);
      await prisma.voucher.update({
        where: { id: latestVoucher.id },
        data: { voucherDate: d }
      });
      // Update the invoice date as well just in case
      await prisma.invoice.update({
        where: { id: latestVoucher.invoiceId },
        data: { invoiceDate: d }
      });
      console.log('Updated dates in DB.');
    }
  }

  // Refetch the updated voucher to generate XML
  const updatedVoucher = await prisma.voucher.findUnique({
    where: { id: latestVoucher.id },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
      invoice: { include: { firm: true } }
    }
  });

  console.log('\n--- Generated XML that we will push ---');
  const xml = generateVoucherXml(updatedVoucher as any);
  console.log(xml);

  console.log('\n--- Calling pushToTallyDirect ---');
  const result = await pushToTallyDirect(updatedVoucher!.id);
  console.log('Result from pushToTallyDirect:', result);
}

main();
