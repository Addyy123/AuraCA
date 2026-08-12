'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { generateVoucher } from '@/lib/accounting/voucher-generator'
import { z } from 'zod'

const EditFormSchema = z.object({
  vendorName: z.string().optional().nullable(),
  vendorGstin: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  invoiceDate: z.coerce.date().optional().nullable(),
  subtotal: z.number().optional().nullable(),
  cgst: z.number().optional().nullable(),
  sgst: z.number().optional().nullable(),
  igst: z.number().optional().nullable(),
  total: z.number().optional().nullable(),
  ledgerMappings: z.array(z.object({
    itemId: z.string(),
    ledgerName: z.string()
  })).optional(),
})

export async function approveInvoice(invoiceId: string) {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'APPROVED', approvedAt: new Date() }
    })
    
    // Generate the Tally voucher automatically upon approval
    const voucherResult = await generateVoucher(invoiceId)
    if (!voucherResult.success) {
      // Rollback status if voucher generation fails
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'EXTRACTED', approvedAt: null }
      })
      throw new Error(`Invoice approved but voucher generation failed: ${voucherResult.error}`)
    }

    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error approving invoice:', message)
    return { success: false, error: message }
  }
}

export async function rejectInvoice(invoiceId: string) {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'REJECTED' }
    })
    
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error rejecting invoice:', message)
    return { success: false, error: message }
  }
}

export async function saveInvoiceEdits(invoiceId: string, formData: any) {
  try {
    const parsedData = EditFormSchema.parse(formData)
    
    const { ledgerMappings, ...invoiceData } = parsedData
    
    // Convert empty strings to null to avoid unique constraint violations
    if (invoiceData.vendorGstin === '') invoiceData.vendorGstin = null
    if (invoiceData.invoiceNumber === '') invoiceData.invoiceNumber = null
    
    // Basic implementation: update main invoice fields
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: invoiceData
    })
    
    // Update ledger mappings if provided
    if (ledgerMappings && ledgerMappings.length > 0) {
      for (const mapping of ledgerMappings) {
        await prisma.ledgerSuggestion.updateMany({
          where: { invoiceId, itemId: mapping.itemId },
          data: { approvedLedger: mapping.ledgerName }
        })
      }
    }
    
    // Rerun validation on the edited data
    const { runInvoiceValidation } = await import('@/lib/validation/index')
    await runInvoiceValidation(invoiceId)
    
    // If the invoice is already APPROVED, regenerate the voucher so the new edits (like date) are reflected in the XML
    const currentInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { status: true } })
    if (currentInvoice?.status === 'APPROVED') {
      // Delete old vouchers first to avoid duplicates or pushing stale vouchers
      await prisma.voucher.deleteMany({ where: { invoiceId } })
      
      const { generateVoucher } = await import('@/lib/accounting/voucher-generator')
      await generateVoucher(invoiceId)
    }

    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true }
  } catch (error: any) {
    let message = error instanceof Error ? error.message : 'Unknown error'
    
    // Handle Prisma unique constraint violation
    if (error?.code === 'P2002' || message.includes('Unique constraint failed')) {
      message = 'An invoice with this Vendor GSTIN and Invoice Number already exists.'
    }
    
    console.error('Error saving edits:', message)
    return { success: false, error: message }
  }
}
