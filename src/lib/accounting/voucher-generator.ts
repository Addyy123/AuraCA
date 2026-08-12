import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function generateVoucher(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        ledgerSuggestions: true,
        firm: true,
      }
    })

    if (!invoice || invoice.status !== 'APPROVED') {
      throw new Error('Invoice not found or not approved')
    }

    // Determine Voucher Type
    const voucherType = 'PURCHASE' // Assuming all uploads are purchase invoices for this MVP
    
    // Generate a unique voucher number
    const voucherNumber = `VCH-${invoice.firmId.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`

    // Create the main Voucher record
    const voucher = await prisma.voucher.create({
      data: {
        invoiceId: invoiceId,
        voucherNumber: voucherNumber,
        voucherType: voucherType,
        voucherDate: invoice.invoiceDate || new Date(),
        totalAmount: invoice.total || 0,
        status: 'DRAFT',
        createdById: invoice.uploadedById, // Dummy user ID used during upload
        narration: `Being purchase from ${invoice.vendorName || 'Vendor'} vide Invoice #${invoice.invoiceNumber || 'NA'} dated ${invoice.invoiceDate?.toISOString().split('T')[0] || 'NA'}`
      }
    })

    const voucherLines: Prisma.VoucherLineCreateManyInput[] = []
    let sortOrder = 1
    let totalDebit = 0

    // 1. Debits for Items (Expense/Asset)
    for (const item of invoice.items) {
      const suggestion = invoice.ledgerSuggestions.find(ls => ls.itemId === item.id)
      const ledgerName = suggestion?.approvedLedger || suggestion?.suggestedLedger || 'Miscellaneous Expenses'
      
      const amount = Number(item.lineTotal || 0)
      totalDebit += amount

      voucherLines.push({
        voucherId: voucher.id,
        ledgerName: ledgerName,
        entryType: 'DEBIT',
        amount: amount,
        sortOrder: sortOrder++
      })
    }

    // 2. Debits for Taxes
    if (Number(invoice.cgst) > 0) {
      const amount = Number(invoice.cgst)
      totalDebit += amount
      voucherLines.push({
        voucherId: voucher.id,
        ledgerName: 'Input CGST',
        entryType: 'DEBIT',
        amount: amount,
        taxType: 'CGST',
        sortOrder: sortOrder++
      })
    }
    
    if (Number(invoice.sgst) > 0) {
      const amount = Number(invoice.sgst)
      totalDebit += amount
      voucherLines.push({
        voucherId: voucher.id,
        ledgerName: 'Input SGST',
        entryType: 'DEBIT',
        amount: amount,
        taxType: 'SGST',
        sortOrder: sortOrder++
      })
    }

    if (Number(invoice.igst) > 0) {
      const amount = Number(invoice.igst)
      totalDebit += amount
      voucherLines.push({
        voucherId: voucher.id,
        ledgerName: 'Input IGST',
        entryType: 'DEBIT',
        amount: amount,
        taxType: 'IGST',
        sortOrder: sortOrder++
      })
    }

    // 3. Credit for Vendor (Sundry Creditor)
    const totalCredit = Number(invoice.total || 0)
    voucherLines.push({
      voucherId: voucher.id,
      ledgerName: invoice.vendorName || 'Sundry Creditor',
      entryType: 'CREDIT',
      amount: totalCredit,
      sortOrder: sortOrder++
    })

    // 4. Auto-balance with Round Off if necessary
    const difference = totalCredit - totalDebit
    if (Math.abs(difference) > 0.01) {
      voucherLines.push({
        voucherId: voucher.id,
        ledgerName: 'Round Off',
        entryType: difference > 0 ? 'DEBIT' : 'CREDIT',
        amount: Math.abs(difference),
        sortOrder: sortOrder++
      })
    }

    // Save Voucher Lines
    await prisma.voucherLine.createMany({
      data: voucherLines
    })

    console.log(`[Voucher] Successfully generated Voucher ${voucherNumber} for Invoice ${invoiceId}`)
    return { success: true, voucherId: voucher.id }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Voucher] Failed to generate voucher for Invoice ${invoiceId}:`, message)
    return { success: false, error: message }
  }
}
