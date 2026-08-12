import { prisma } from '@/lib/db'
import pdfParse from 'pdf-parse'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import { extractInvoiceData } from '@/lib/ai'
import { convertPdfToImages } from './pdf-to-image'

/**
 * Downloads the file buffer from a public URL.
 */
async function downloadFile(fileUrl: string): Promise<Buffer> {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to download file from ${fileUrl}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Extracts text from a native PDF using pdf-parse.
 */
async function processPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}

/**
 * Extracts text from an image using Tesseract.js, with optional Sharp preprocessing.
 */
async function processImage(buffer: Buffer): Promise<string> {
  // Pre-process the image for better OCR accuracy (grayscale, increase contrast)
  const processedBuffer = await sharp(buffer)
    .flatten({ background: '#ffffff' })
    .grayscale()
    .normalize()
    .toBuffer()

  const worker = await createWorker('eng')
  
  try {
    const { data: { text } } = await worker.recognize(processedBuffer)
    return text
  } finally {
    await worker.terminate()
  }
}

/**
 * The main OCR orchestrator function.
 * Downloads the file, detects type, extracts text, and saves to the DB.
 */
export async function processInvoiceOcr(invoiceId: string, fileUrl: string, fileName: string) {
  try {
    // 0. Update status to PROCESSING immediately
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PROCESSING' }
    })

    // 1. Download file buffer
    const buffer = await downloadFile(fileUrl)
    
    // 2. Detect type based on extension
    const isPdf = fileName.toLowerCase().endsWith('.pdf')
    
    let extractedText = ''

    // 3. Extract Text
    if (isPdf) {
      console.log(`[OCR] Processing PDF for Invoice ${invoiceId}...`)
      extractedText = await processPdf(buffer)
      
      // Fallback to image OCR if the PDF was just a scanned image wrapper (empty text)
      if (!extractedText || extractedText.trim().length < 50) {
         console.log(`[OCR] PDF text is too short. It might be a scanned PDF. Converting to images for OCR...`)
         const imageBuffers = await convertPdfToImages(buffer)
         console.log(`[OCR] Converted PDF to ${imageBuffers.length} images.`)
         
         const texts = []
         for (let i = 0; i < imageBuffers.length; i++) {
            console.log(`[OCR] Processing page ${i + 1} with Tesseract...`)
            const pageText = await processImage(imageBuffers[i])
            texts.push(pageText)
         }
         extractedText = texts.join('\n\n--- Page Break ---\n\n')
      }
    } else {
      console.log(`[OCR] Processing Image for Invoice ${invoiceId}...`)
      extractedText = await processImage(buffer)
    }

    // 4. Update Database
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ocrText: extractedText,
      }
    })
    
    console.log(`[OCR] Successfully processed Invoice ${invoiceId}`)

    // 5. Trigger AI Extraction Asynchronously
    // Fire and forget so we don't block
    if (extractedText && extractedText.trim().length > 0) {
      extractInvoiceData(invoiceId, extractedText).catch(console.error)
    } else {
      console.warn(`[OCR] No text extracted for Invoice ${invoiceId}. Skipping AI Extraction.`)
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'FAILED' }
      }).catch(console.error)
    }

  } catch (error) {
    console.error(`[OCR] Failed to process Invoice ${invoiceId}:`, error)
    
    // Mark as failed in DB
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'FAILED' }
    }).catch(console.error)
  }
}
