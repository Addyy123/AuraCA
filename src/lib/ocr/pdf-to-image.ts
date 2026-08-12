import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas, Canvas, SKRSContext2D as CanvasRenderingContext2D } from '@napi-rs/canvas'

// Disable workers for Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    return {
      canvas,
      context,
    }
  }

  reset(canvasAndContext: { canvas: Canvas; context: CanvasRenderingContext2D }, width: number, height: number) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext: { canvas: Canvas | null; context: CanvasRenderingContext2D | null }) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0
      canvasAndContext.canvas.height = 0
    }
    canvasAndContext.canvas = null
    canvasAndContext.context = null
  }
}

/**
 * Converts a PDF buffer into an array of Image Buffers (PNGs).
 * @param pdfBuffer The PDF data buffer
 * @param scale The resolution scale (default 2 for better OCR)
 * @returns Array of Buffer objects containing PNG image data
 */
export async function convertPdfToImages(pdfBuffer: Buffer, scale: number = 2): Promise<Buffer[]> {
  const data = new Uint8Array(pdfBuffer)
  const loadingTask = pdfjsLib.getDocument({
    data,
    // Add these for Node.js environment
    disableFontFace: true,
  })
  
  const pdfDocument = await loadingTask.promise
  
  const numPages = pdfDocument.numPages
  const imageBuffers: Buffer[] = []
  
  // We'll limit to a maximum of 5 pages to avoid memory exhaustion
  // and excessive processing time for this MVP.
  const maxPages = Math.min(numPages, 5)
  const canvasFactory = new NodeCanvasFactory()

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdfDocument.getPage(i)
    
    // Set up viewport and canvas
    const viewport = page.getViewport({ scale })
    
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
    
    // Render PDF page into canvas context
    const renderContext = {
      canvasContext: canvasAndContext.context as any,
      canvas: canvasAndContext.canvas as any,
      viewport: viewport,
      canvasFactory: canvasFactory as any,
    }
    
    await page.render(renderContext).promise
    
    // Convert canvas to PNG Buffer
    const imageBuffer = canvasAndContext.canvas.toBuffer('image/png')
    imageBuffers.push(imageBuffer)
    
    page.cleanup()
  }
  
  await loadingTask.destroy()
  
  return imageBuffers
}
