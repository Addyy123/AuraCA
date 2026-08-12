import { z } from 'zod'

// Schema for a single invoice line item
export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  rate: z.number().positive('Rate must be positive'),
  hsn_code: z.string().nullable().optional(),
  tax_rate: z.number().min(0).max(100).nullable().optional(),
  tax_amount: z.number().min(0, 'Tax amount cannot be negative'),
  line_total: z.number().positive('Line total must be positive'),
})

// Schema for the complete AI extraction response
export const AIExtractionSchema = z.object({
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  vendor_name: z.string().nullable(),
  vendor_gstin: z.string().nullable(),
  items: z.array(InvoiceItemSchema),
  subtotal: z.number().nullable(),
  cgst: z.number().nullable(),
  sgst: z.number().nullable(),
  igst: z.number().nullable(),
  total: z.number().nullable(),
})

export type AIExtractionResult = z.infer<typeof AIExtractionSchema>
