'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function uploadInvoiceAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    let clientId = formData.get('clientId') as string

    if (!file) {
      return { success: false, error: 'File is required' }
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 10MB limit' }
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' }
    }

    // Dynamic lookup for default user/firm instead of hardcoding
    const defaultUser = await prisma.user.findFirst({ where: { email: 'admin@demo-ca.com' } })
    if (!defaultUser) {
      return { success: false, error: 'System not initialized. Please seed the database.' }
    }

    // Auto-resolve clientId if not provided by the form
    if (!clientId) {
      const firstClient = await prisma.client.findFirst({ where: { firmId: defaultUser.firmId } })
      if (!firstClient) {
        return { success: false, error: 'No client found. Please add a client first.' }
      }
      clientId = firstClient.id
    }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${clientId}/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('invoices')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload Error:', uploadError)
      return { success: false, error: 'Failed to upload to storage: ' + uploadError.message }
    }

    // 2. Get Public URL (Assuming 'invoices' is a public bucket as requested)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('invoices')
      .getPublicUrl(filePath)

    // 3. Save to database
    const invoice = await prisma.invoice.create({
      data: {
        firmId: defaultUser.firmId,
        clientId: clientId,
        uploadedById: defaultUser.id,
        sourceFileUrl: publicUrlData.publicUrl,
        status: 'UPLOADED' // Set to UPLOADED, ready for OCR processing next
      }
    })

    // 4. Trigger OCR Asynchronously via Webhook
    // This isolates heavy Node modules from the Server Action bundle
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        fileUrl: publicUrlData.publicUrl,
        fileName: file.name
      })
    }).catch(console.error)

    return { success: true, invoiceId: invoice.id }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    console.error('Action Error:', error)
    return { success: false, error: message }
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  try {
    
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })
    
    if (!invoice) return { success: false, error: 'Invoice not found' }
    
    // Attempt to delete from Supabase storage
    if (invoice.sourceFileUrl) {
      try {
        const urlObj = new URL(invoice.sourceFileUrl)
        const pathSegments = urlObj.pathname.split('/invoices/')
        if (pathSegments.length > 1) {
          const filePath = pathSegments[1]
          await supabaseAdmin.storage.from('invoices').remove([filePath])
        }
      } catch (e) {
        console.error('Failed to delete file from storage', e)
      }
    }
    
    // Delete related records that have Restrict constraint
    await prisma.xmlExport.deleteMany({ where: { invoiceId } });
    await prisma.voucher.deleteMany({ where: { invoiceId } });
    
    // Delete the invoice (items, validation results, ledger suggestions are Cascade)
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })
    
    revalidatePath('/invoices')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete invoice:', error);
    return { success: false, error: error.message || 'Failed to delete invoice' }
  }
}