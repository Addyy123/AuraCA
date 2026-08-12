import { NextResponse } from 'next/server'
import { processInvoiceOcr } from '@/lib/ocr'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { invoiceId, fileUrl, fileName } = body

    if (!invoiceId || !fileUrl || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Run the heavy OCR process.
    // In a real production app (Vercel), we'd use waitUntil or a queue.
    // For local MVP, we await it here.
    await processInvoiceOcr(invoiceId, fileUrl, fileName)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('OCR Webhook Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
