'use server'

import { prisma } from '@/lib/db'
import { generateLedgerXml, generateVoucherXml, getParentGroup } from '@/lib/tally/xml-generator'
import { revalidatePath } from 'next/cache'

const TALLY_URL = process.env.TALLY_URL || 'http://localhost:9000'

async function postToTally(xml: string): Promise<string> {
  const response = await fetch(TALLY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
  })
  return response.text()
}

function getTagValue(xml: string, tag: string): number {
  const match = xml.match(new RegExp(`<${tag}>(\\d+)<\\/${tag}>`, 'i'))
  return match ? parseInt(match[1]) : 0
}

function parseTallyResponse(responseText: string, originalXml?: string): { success: boolean; error?: string } {
  console.log('--- RAW TALLY RESPONSE ---')
  console.log(responseText)
  console.log('--------------------------')

  const created  = getTagValue(responseText, 'CREATED')
  const altered  = getTagValue(responseText, 'ALTERED')
  const ignored  = getTagValue(responseText, 'IGNORED')
  const combined = getTagValue(responseText, 'COMBINED')
  const errors   = getTagValue(responseText, 'ERRORS')

  // Any record processed (created, altered, ignored, or combined) = success
  const anyProcessed = created > 0 || altered > 0 || ignored > 0 || combined > 0

  if (anyProcessed && errors === 0) {
    return { success: true }
  }

  // Check for real error text (not self-closing <LINEERROR/>)
  const lineErrorMatch = responseText.match(/<LINEERROR>([^<]+)<\/LINEERROR>/i)
  if (lineErrorMatch && lineErrorMatch[1].trim().length > 0) {
    const decodedError = lineErrorMatch[1]
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()

    // Treat "already exists" as success — ledger is already there
    if (decodedError.toLowerCase().includes('already exists')) {
      return { success: true }
    }

    return { success: false, error: `Tally Error: ${decodedError}` }
  }

  // If Tally returned a RESPONSE block but nothing was processed and no error text,
  // it likely means the record is a duplicate or was silently skipped.
  // Instead of pretending it was a success, let's return the raw response so the user can see it!
  if (responseText.includes('<RESPONSE>')) {
    if (created === 0 && ignored === 0 && altered === 0 && combined === 0) {
      console.error('--- SILENT REJECTION TALLY XML ---', originalXml || 'No XML available')
      return { 
        success: false, 
        error: `Tally silently rejected the voucher.\n\nThis is almost always caused by the Invoice Date being outside the active Financial Year of the currently open Tally company.\n\nPlease check the Current Period in Tally (Alt+F2) and ensure it covers the invoice date, then try again.\n\nRaw Response: ${responseText}` 
      }
    }
    return { success: true }
  }

  return { success: false, error: `Unexpected Tally response: ${responseText}` }
}


export async function pushToTallyDirect(voucherId: string) {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        invoice: { include: { firm: true } }
      }
    })

    if (!voucher) {
      return { success: false, error: 'Voucher not found' }
    }

    // Step 1: Create all ledgers one by one (separate POST per ledger)
    const processedLedgers = new Set<string>()
    for (const line of voucher.lines) {
      if (processedLedgers.has(line.ledgerName)) continue
      processedLedgers.add(line.ledgerName)

      const parentGroup = getParentGroup(line.ledgerName, line.entryType, voucher.voucherType)
      const ledgerXml = generateLedgerXml(line.ledgerName, parentGroup, voucher.invoice.firm.name)

      let ledgerResponse: string
      try {
        ledgerResponse = await postToTally(ledgerXml)
      } catch {
        return { success: false, error: `Could not connect to Tally at ${TALLY_URL}. Please ensure Tally Prime is open.` }
      }

      const ledgerResult = parseTallyResponse(ledgerResponse, ledgerXml)
      // We allow "already exists" silently. Any other error should stop the process.
      if (!ledgerResult.success) {
        console.warn(`Ledger creation warning for "${line.ledgerName}":`, ledgerResult.error)
        // Continue anyway — ledger might already exist with a different structure
      }
    }


    // Step 2: Push the Voucher
    const voucherXml = generateVoucherXml(voucher as any)
    let voucherResponse: string
    try {
      voucherResponse = await postToTally(voucherXml)
    } catch {
      return { success: false, error: `Could not connect to Tally at ${TALLY_URL}. Please ensure Tally Prime is open.` }
    }

    const voucherResult = parseTallyResponse(voucherResponse, voucherXml)

    // Log the result
    await prisma.xmlExport.create({
      data: {
        invoiceId: voucher.invoiceId,
        voucherId: voucher.id,
        exportStatus: voucherResult.success ? 'SUCCESS' : 'FAILED',
        errorMessage: voucherResult.success ? null : (voucherResult.error ?? null),
        exportedById: voucher.createdById,
      }
    })

    if (voucherResult.success) {
      revalidatePath(`/invoices`)
      revalidatePath(`/invoices/${voucher.invoiceId}`)
      return { success: true }
    }

    return { success: false, error: voucherResult.error }

  } catch (error: unknown) {
    console.error('Direct Export Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
