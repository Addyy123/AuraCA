import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'

type InvoiceSummary = {
  id: string
  invoiceNumber: string | null
  vendorName: string | null
  total: number
  status: string
  createdAt: Date
}

export function RecentActivity({ invoices }: { invoices: InvoiceSummary[] }) {
  // Helper for status colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Processing</span>
      case 'EXTRACTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Review Needed</span>
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Approved</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Rejected</span>
      case 'FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(amount || 0))
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-indigo-500" /> Recent Uploads
        </h3>
        <Link href="/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {invoices.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No recent activity found.
            </li>
          ) : (
            invoices.map((invoice) => (
              <li key={invoice.id} className="hover:bg-indigo-50/50 transition-colors">
                <Link href={`/invoices/${invoice.id}`} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invoice.vendorName || 'Unknown Vendor'}</div>
                    <div className="text-xs text-gray-500 mt-1 flex space-x-2">
                      <span>{invoice.invoiceNumber || 'No Inv #'}</span>
                      <span>•</span>
                      <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-gray-900 mb-1">{formatCurrency(invoice.total)}</div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
