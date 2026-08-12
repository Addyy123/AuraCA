import { prisma } from '@/lib/db'
import Link from 'next/link'
import { FileText, Plus, ArrowRight, Upload, Download } from 'lucide-react'
import { PushToTallyButton } from '@/features/invoices/components/push-to-tally-button'
import { DeleteInvoiceButton } from '@/features/invoices/components/delete-invoice-button'
export default async function InvoiceDashboard() {
  // Fetch all invoices, ordered by most recent first
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      firm: true,
      vouchers: true,
    }
  })

  // Helper to format currency
  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(amount || 0))
  }

  // Helper for status colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
      case 'PROCESSING':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm animate-pulse">Processing...</span>
      case 'EXTRACTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">Ready for Review</span>
      case 'APPROVED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">Approved</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">Rejected</span>
      case 'FAILED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm shadow-red-500/20">Failed (Review Needed)</span>
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-indigo-600 drop-shadow-sm" />
              Invoice Register
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage all your uploaded invoices, review AI extractions, and export to Tally.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link
              href="/invoices/upload"
              className="group inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transform transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Upload Document
            </Link>
          </div>
        </div>

        {/* Data Table & Mobile Cards */}
        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-white/50">
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Invoice Info
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">No invoices uploaded yet</p>
                      <p className="mt-1">Get started by uploading your first invoice.</p>
                      <div className="mt-6">
                        <Link
                          href="/invoices/upload"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                          Upload Invoice
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber || 'Processing...'}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            ID: {invoice.id.substring(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.vendorName || '-'}</div>
                        <div className="text-xs text-gray-500">{invoice.vendorGstin || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                        {invoice.status === 'APPROVED' && invoice.vouchers?.[0] && (
                          <>
                            <PushToTallyButton voucherId={invoice.vouchers[0].id} />
                            <a 
                              href={`/api/export/xml/${invoice.vouchers[0].id}`}
                              download
                              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                            >
                              <Download className="w-4 h-4 mr-1" /> XML
                            </a>
                          </>
                        )}
                        <Link 
                          href={`/invoices/${invoice.id}`}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                        >
                          {invoice.status === 'APPROVED' ? 'View' : 'Review'} <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                        <DeleteInvoiceButton invoiceId={invoice.id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-900">No invoices uploaded yet</p>
                <div className="mt-6">
                  <Link
                    href="/invoices/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Upload Invoice
                  </Link>
                </div>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{invoice.vendorName || 'Unknown Vendor'}</div>
                      <div className="text-xs text-gray-500">{invoice.invoiceNumber || 'Processing...'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total)}</div>
                      <div className="text-xs text-gray-500">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    {getStatusBadge(invoice.status)}
                    <div className="flex space-x-2">
                      {invoice.status === 'APPROVED' && invoice.vouchers?.[0] && (
                        <>
                          <PushToTallyButton voucherId={invoice.vouchers[0].id} />
                          <a 
                            href={`/api/export/xml/${invoice.vouchers[0].id}`}
                            download
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                          >
                            <Download className="w-4 h-4 mr-1" /> XML
                          </a>
                        </>
                      )}
                      <Link 
                        href={`/invoices/${invoice.id}`}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                      >
                        {invoice.status === 'APPROVED' ? 'View' : 'Review'} <ArrowRight className="ml-1 w-4 h-4" />
                      </Link>
                      <DeleteInvoiceButton invoiceId={invoice.id} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
