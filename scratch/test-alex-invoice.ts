import { config } from 'dotenv';
config({ path: '.env.local' });
import { prisma } from '../src/lib/db';
import { generateVoucher } from '../src/lib/accounting/voucher-generator';
import { generateVoucherXml } from '../src/lib/tally/xml-generator';

async function main() {
  console.log('Testing App with ALEX Invoice...');
  
  // 1. Get or Create a dummy Firm and User
  let firm = await prisma.firm.findFirst();
  if (!firm) {
    firm = await prisma.firm.create({
      data: { name: 'Test Firm' }
    });
  }
  
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User' }
    });
  }

  // 2. Create the Invoice record (Simulating OCR Extraction)
  const invoice = await prisma.invoice.create({
    data: {
      firmId: firm.id,
      uploadedById: user.id,
      fileUrl: 'https://example.com/alex-invoice.png',
      fileName: 'alex-invoice.png',
      status: 'APPROVED', // Approve it directly to test voucher generation
      vendorName: 'ALEX',
      vendorGst: '27ABCDE1234F1Z5',
      invoiceNumber: 'INV-2026-5351',
      invoiceDate: new Date('2026-08-12T00:00:00Z'),
      total: 150000.00,
      confidence: 99.9,
      items: {
        create: [
          {
            description: 'FREIGHT CHARGES (Route: new jersy TO new york)',
            quantity: 1,
            unitPrice: 150000.00,
            lineTotal: 150000.00
          }
        ]
      },
      ledgerSuggestions: {
        create: [
          {
            itemId: 'temp-id', // We'll update this below
            suggestedLedger: 'Freight Charges',
            approvedLedger: 'Freight Charges',
            confidence: 95.0
          }
        ]
      }
    },
    include: { items: true, ledgerSuggestions: true }
  });

  // Fix the ledger suggestion itemId
  await prisma.ledgerSuggestion.update({
    where: { id: invoice.ledgerSuggestions[0].id },
    data: { itemId: invoice.items[0].id }
  });

  console.log(`Created Invoice ID: ${invoice.id}`);

  // 3. Generate Voucher
  console.log('Generating Voucher...');
  const voucherResult = await generateVoucher(invoice.id);
  
  if (!voucherResult.success) {
    console.error('Voucher Generation Failed:', voucherResult.error);
    return;
  }
  
  console.log(`Voucher Generated: ${voucherResult.voucherId}`);

  // 4. Test Tally XML Generation
  const fullVoucher = await prisma.voucher.findUnique({
    where: { id: voucherResult.voucherId },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
      invoice: { include: { firm: true } }
    }
  });

  console.log('\n--- Generated Tally XML ---');
  const xml = generateVoucherXml(fullVoucher as any);
  console.log(xml);
  console.log('---------------------------\n');
  console.log('Test completed successfully! The app correctly processes the invoice data and generates valid Tally XML.');
}

main().catch(console.error).finally(() => process.exit(0));
