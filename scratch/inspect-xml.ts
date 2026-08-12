import { prisma } from '../src/lib/db'
import { generateLedgerXml, generateVoucherXml, getParentGroup } from '../src/lib/tally/xml-generator'

async function run() {
  const voucher = await prisma.voucher.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
      invoice: { include: { firm: true } }
    }
  });

  if (!voucher) {
    console.log('No voucher found.');
    return;
  }

  console.log('--- LATEST VOUCHER ---');
  console.log('Invoice Vendor:', voucher.invoice.vendorName);
  
  for (const line of voucher.lines) {
    const parentGroup = getParentGroup(line.ledgerName, line.entryType, voucher.voucherType);
    console.log(`\nLedger: ${line.ledgerName} | Parent: ${parentGroup}`);
    const lXml = generateLedgerXml(line.ledgerName, parentGroup, voucher.invoice.firm.name);
    console.log(lXml);
  }

  console.log('\n--- VOUCHER XML ---');
  console.log(generateVoucherXml(voucher));
}

run().catch(console.error).finally(() => process.exit(0));
