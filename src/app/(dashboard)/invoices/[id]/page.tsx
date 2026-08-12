import { prisma } from '@/lib/db'
import { ReviewScreen } from '@/features/invoices/components/review-screen'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DeleteInvoiceButton } from '@/features/invoices/components/delete-invoice-button'

export default async function InvoiceReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const invoice = await prisma.invoice.findUnique({
    where: { id: id },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
      validationResults: true,
      vouchers: true,
      ledgerSuggestions: true,
    }
  })

  if (!invoice) {
    notFound()
  }

  // Determine if AI extraction is still running
  if (invoice.status === 'UPLOADED' || invoice.status === 'PROCESSING') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-xl font-semibold text-gray-800">Processing Document...</h2>
        <p className="text-gray-500 max-w-md">
          The AI is currently extracting data from this invoice. This usually takes about 10-15 seconds.
        </p>
        <Link 
          href={`/invoices/${id}`}
          className="mt-4 px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-white inline-block text-center"
        >
          Refresh to check status
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-white border-b px-4 py-3 flex items-center shadow-sm">
        <Link href="/invoices" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Invoices
        </Link>
        <div className="mx-auto flex space-x-2 items-center">
          <span className="font-medium text-gray-800">Invoice Review Mode</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm font-mono text-gray-500">{invoice.id.split('-')[0]}</span>
        </div>
        <div className="w-40 flex justify-end">
          <DeleteInvoiceButton invoiceId={invoice.id} redirectOnDelete={true} />
        </div>
      </header>

      {/* Main Review Content */}
      <main className="flex-1 p-6">
        <ReviewScreen 
          invoice={JSON.parse(JSON.stringify(invoice))} 
          items={JSON.parse(JSON.stringify(invoice.items))} 
          validations={JSON.parse(JSON.stringify(invoice.validationResults))} 
          ledgerSuggestions={JSON.parse(JSON.stringify(invoice.ledgerSuggestions))}
        />
      </main>
    </div>
  )
}
