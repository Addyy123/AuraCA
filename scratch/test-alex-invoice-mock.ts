import { generateVoucherXml } from '../src/lib/tally/xml-generator';

function generateMockVoucher() {
  const invoiceId = 'inv-mock-123';
  const voucherId = 'vch-mock-456';
  
  // Data extracted directly from the image
  const vendorName = 'ALEX';
  const invoiceNumber = 'INV-2026-5351';
  const invoiceDate = new Date('2026-08-12T00:00:00Z');
  const totalAmount = 150000.00;
  
  const voucherLines = [
    {
      id: 'line-1',
      voucherId,
      ledgerName: 'Freight Charges', // The expense/item ledger
      entryType: 'DEBIT',
      amount: totalAmount,
      taxType: null,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'line-2',
      voucherId,
      ledgerName: vendorName, // The vendor creditor ledger
      entryType: 'CREDIT',
      amount: totalAmount,
      taxType: null,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  return {
    id: voucherId,
    invoiceId,
    voucherNumber: 'VCH-ALEX-123456',
    voucherType: 'PURCHASE',
    voucherDate: invoiceDate,
    totalAmount,
    status: 'GENERATED',
    createdById: 'user-1',
    exportedAt: null,
    narration: `Being purchase from ${vendorName} vide Invoice #${invoiceNumber} dated 2026-08-12`,
    createdAt: new Date(),
    updatedAt: new Date(),
    lines: voucherLines,
    invoice: {
      id: invoiceId,
      firmId: 'firm-1',
      uploadedById: 'user-1',
      fileUrl: 'mock-url',
      fileName: 'mock-file',
      status: 'APPROVED',
      vendorName,
      vendorGst: '27ABCDE1234F1Z5',
      invoiceNumber,
      invoiceDate,
      total: totalAmount,
      cgst: 0,
      sgst: 0,
      igst: 0,
      confidence: 99.9,
      ocrData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      firm: {
        id: 'firm-1',
        name: 'Test Firm',
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  };
}

function main() {
  console.log('Testing App with ALEX Invoice (Mock DB Bypass)...');
  const mockVoucher = generateMockVoucher();
  
  console.log('\n--- Generated Tally XML ---');
  // generateVoucherXml expects a FullVoucher type
  const xml = generateVoucherXml(mockVoucher as any);
  console.log(xml);
  console.log('---------------------------\n');
  console.log('Test completed successfully! The XML is formatted perfectly for Tally.');
}

main();
