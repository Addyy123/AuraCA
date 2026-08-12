import { prisma } from '@/lib/db'
import { UploadForm } from '@/features/invoices/components/upload-form'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  // Fetch default firm for MVP instead of hardcoding user email
  const defaultFirm = await prisma.firm.findFirst()
  const firmId = defaultFirm?.id || ''

  // Fetch clients for the dropdown
  const clients = await prisma.client.findMany({
    where: { firmId: firmId },
    select: { id: true, name: true }
  })

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-300 to-indigo-300 rounded-full blur-3xl transform -translate-y-1/2"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Link 
          href="/invoices" 
          className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-slate-600 bg-white/50 backdrop-blur-md border border-slate-200 rounded-full hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Invoices
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Intelligent Processing
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
            Upload a PDF or image of your invoice. Our advanced AI will extract the data, validate GST rules, and prepare it for Tally XML generation automatically.
          </p>
        </div>
        
        <UploadForm clients={clients} />
      </div>
    </div>
  )
}
