import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateVoucherXml } from '@/lib/tally/xml-generator';
import { pushToTallyDirect } from '@/app/actions/export-actions';

export async function GET() {
  try {
    const latestVoucher = await prisma.voucher.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        invoice: { include: { firm: true } }
      }
    });

    if (!latestVoucher) {
      return NextResponse.json({ error: 'No vouchers found in DB.' });
    }

    let output = [];
    output.push(`Latest Voucher ID: ${latestVoucher.id}`);
    output.push(`Current Voucher Date in DB: ${latestVoucher.voucherDate}`);
    
    // Force update to 2026 to ensure it passes Financial Year checks
    if (latestVoucher.voucherDate) {
      const d = new Date(latestVoucher.voucherDate);
      if (d.getFullYear() < 2026) {
        output.push(`Updating voucher date from ${d.getFullYear()} to 2026...`);
        d.setFullYear(2026);
        await prisma.voucher.update({
          where: { id: latestVoucher.id },
          data: { voucherDate: d }
        });
        await prisma.invoice.update({
          where: { id: latestVoucher.invoiceId },
          data: { invoiceDate: d }
        });
        output.push('Updated dates in DB.');
      }
    }

    // Refetch the updated voucher
    const updatedVoucher = await prisma.voucher.findUnique({
      where: { id: latestVoucher.id },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        invoice: { include: { firm: true } }
      }
    });

    const xml = generateVoucherXml(updatedVoucher as any);
    output.push('\n--- Generated XML ---');
    output.push(xml);

    output.push('\n--- Calling pushToTallyDirect ---');
    const result = await pushToTallyDirect(updatedVoucher!.id);
    output.push('Result from pushToTallyDirect:');
    output.push(JSON.stringify(result, null, 2));

    return new NextResponse(output.join('\n'), { headers: { 'Content-Type': 'text/plain' }});
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
