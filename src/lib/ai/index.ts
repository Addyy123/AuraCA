import Groq from 'groq-sdk'
import { prisma } from '@/lib/db'
import { AIExtractionSchema } from './schema'
import { runInvoiceValidation } from '@/lib/validation'
import { suggestLedgers } from '@/lib/accounting/ledger-suggester'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const EXTRACTION_PROMPT = `
You are an expert accounting document extraction assistant specializing in Indian invoices.

Extract invoice data from the OCR text below. Return valid JSON only — no markdown, no commentary, no explanation.

Required JSON Structure (match this perfectly):
{
  "invoice_number": "string or null",
  "invoice_date": "string (YYYY-MM-DD) or null",
  "vendor_name": "string or null",
  "vendor_gstin": "string (15-char) or null",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "rate": number,
      "hsn_code": "string or null",
      "tax_rate": number or null,
      "tax_amount": number,
      "line_total": number
    }
  ],
  "subtotal": number or null,
  "cgst": number or null,
  "sgst": number or null,
  "igst": number or null,
  "total": number or null
}

Rules:
- Use null for genuinely missing values (not zero).
- Keep all monetary values as numbers (no currency symbols).
- Preserve invoice number formatting exactly as it appears.
- If tax is split into CGST+SGST, set igst to 0.
- If tax is IGST only, set cgst and sgst to 0.
- quantity and rate must be positive numbers.
- hsn_code should be the numeric code only (no text).
- Do not wrap the JSON in Markdown blocks like \`\`\`json. Output raw JSON.
- CRITICAL: Do NOT extract Taxes (CGST, SGST, IGST) or Freight Charges as Line Items in the "items" array. They belong in the tax/subtotal fields only.
- CRITICAL: The sum of line_total for all items MUST equal the subtotal.
- CRITICAL: subtotal + cgst + sgst + igst MUST equal total. Double check for OCR typos (like 8 vs 9).

OCR Text:
---
`

export async function extractInvoiceData(invoiceId: string, ocrText: string) {
  try {
    console.log(`[AI] Starting Groq Extraction for Invoice ${invoiceId}...`)

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT + ocrText + '\n---'
        }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' }
    })

    const rawResponse = chatCompletion.choices[0]?.message?.content
    if (!rawResponse) throw new Error('Empty response from Groq')

    // Parse and validate with Zod
    const parsedJson = JSON.parse(rawResponse)
    const validatedData = AIExtractionSchema.parse(parsedJson)

    // Save extracted data to the database
    await prisma.$transaction(async (tx) => {
      // 1. Update the main invoice record
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceNumber: validatedData.invoice_number,
          vendorName: validatedData.vendor_name,
          vendorGstin: validatedData.vendor_gstin,
          invoiceDate: validatedData.invoice_date ? new Date(validatedData.invoice_date) : null,
          subtotal: validatedData.subtotal,
          cgst: validatedData.cgst,
          sgst: validatedData.sgst,
          igst: validatedData.igst,
          total: validatedData.total,
          aiRawResponse: parsedJson as any,
          status: 'EXTRACTED'
        }
      })

      // 2. Create the line items
      if (validatedData.items && validatedData.items.length > 0) {
        await tx.invoiceItem.createMany({
          data: validatedData.items.map((item, index) => ({
            invoiceId: invoiceId,
            description: item.description,
            quantity: item.quantity,
            unitRate: item.rate,
            hsnCode: item.hsn_code,
            taxRate: item.tax_rate ?? 0,
            taxAmount: item.tax_amount,
            lineTotal: item.line_total,
            sortOrder: index
          }))
        })
      }
    })

    console.log(`[AI] Successfully extracted data for Invoice ${invoiceId}`)

    // Trigger validation and ledger suggestion asynchronously
    runInvoiceValidation(invoiceId)
      .then(() => suggestLedgers(invoiceId))
      .catch(console.error)

  } catch (error) {
    console.error(`[AI] Failed extraction for Invoice ${invoiceId}:`, error)
    // Mark as failed in DB
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'FAILED' }
    }).catch(console.error)
  }
}
