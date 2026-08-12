import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateTallyXml } from '@/lib/tally/xml-generator'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ voucherId: string }> }
) {
  try {
    const { voucherId } = await params;
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        invoice: { include: { firm: true } }
      }
    })

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    // Generate the XML string
    const xmlContent = generateTallyXml(voucher as any)

    // Log the export in the database
    await prisma.xmlExport.create({
      data: {
        invoiceId: voucher.invoiceId,
        voucherId: voucher.id,
        exportStatus: 'SUCCESS',
        exportedById: voucher.createdById, // Using the same dummy user
      }
    })

    // Return the XML file as a downloadable response
    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="tally_vch_${voucher.voucherNumber}.xml"`,
      },
    })

  } catch (error: unknown) {
    console.error('XML Export Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
