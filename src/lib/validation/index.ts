import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function runInvoiceValidation(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    })

    if (!invoice) return

    const results: Prisma.ValidationResultCreateManyInput[] = []

    // Helper to add a validation result
    const addResult = (ruleName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, severity: 'ERROR' | 'WARNING' | 'INFO') => {
      results.push({
        invoiceId,
        ruleName,
        status,
        message,
        severity
      })
    }

    // --- MATH VALIDATIONS ---

    const subtotal = Number(invoice.subtotal || 0)
    const cgst = Number(invoice.cgst || 0)
    const sgst = Number(invoice.sgst || 0)
    const igst = Number(invoice.igst || 0)
    const total = Number(invoice.total || 0)

    // Check 1: Do taxes + subtotal = total?
    const calculatedTotal = subtotal + cgst + sgst + igst
    if (Math.abs(calculatedTotal - total) > 0.01) {
      addResult(
        'V021: Total Mismatch', 
        'FAIL', 
        `Subtotal + Taxes (${calculatedTotal.toFixed(2)}) does not equal Grand Total (${total.toFixed(2)})`, 
        'ERROR'
      )
    } else {
      addResult('V021: Total Mismatch', 'PASS', 'Subtotal and taxes match grand total', 'INFO')
    }

    // Check 2: Do item lines = subtotal?
    if (invoice.items.length > 0) {
      const itemsSum = invoice.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
      if (Math.abs(itemsSum - subtotal) > 0.01) {
        addResult(
          'V020: Item Subtotal Mismatch', 
          'WARNING', 
          `Sum of line items (${itemsSum.toFixed(2)}) does not equal Invoice Subtotal (${subtotal.toFixed(2)})`, 
          'WARNING'
        )
      } else {
        addResult('V020: Item Subtotal Mismatch', 'PASS', 'Line items sum matches subtotal', 'INFO')
      }
    }

    // --- GST VALIDATIONS ---
    
    // Check 3: Mixed taxes
    if ((cgst > 0 || sgst > 0) && igst > 0) {
      addResult(
        'V012: Inconsistent Tax Split', 
        'WARNING', 
        'Invoice has both Intra-state (CGST/SGST) and Inter-state (IGST) taxes applied', 
        'WARNING'
      )
    }

    // Check 4: Missing Required Fields
    if (!invoice.invoiceNumber) {
      addResult('V001: Missing Invoice Number', 'FAIL', 'Invoice number is missing', 'ERROR')
    }
    if (!invoice.vendorName) {
      addResult('V002: Missing Vendor Name', 'FAIL', 'Vendor name is missing', 'ERROR')
    }
    
    if (invoice.vendorGstin) {
      const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/
      if (!gstinRegex.test(invoice.vendorGstin)) {
         addResult('V010: Invalid GSTIN Format', 'FAIL', `GSTIN ${invoice.vendorGstin} is improperly formatted`, 'ERROR')
      }
    }

    // Save all results to the database
    // First clear old results
    await prisma.validationResult.deleteMany({ where: { invoiceId } })
    
    // Then insert new ones
    if (results.length > 0) {
      await prisma.validationResult.createMany({
        data: results
      })

      const hasErrors = results.some(r => r.status === 'FAIL' && r.severity === 'ERROR')
      if (hasErrors) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'NEEDS_REVIEW' }
        })
      }
    }
    console.log(`[Validation] Completed for Invoice ${invoiceId}. Generated ${results.length} results.`)

  } catch (error) {
    console.error(`[Validation] Failed for Invoice ${invoiceId}:`, error)
  }
}
