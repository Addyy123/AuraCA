'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, Edit2, Save, Download, FileText, Send } from 'lucide-react'
import { approveInvoice, rejectInvoice, saveInvoiceEdits } from '@/app/actions/review-actions'
import { pushToTallyDirect } from '@/app/actions/export-actions'

import type { Invoice, InvoiceItem, ValidationResult, Voucher, LedgerSuggestion } from '@prisma/client'

type ReviewScreenProps = {
  invoice: Invoice & { vouchers: Voucher[] }
  items: InvoiceItem[]
  validations: ValidationResult[]
  ledgerSuggestions: LedgerSuggestion[]
}

const STANDARD_LEDGERS = [
  'Computer & IT Equipment',
  'Communication Expense',
  'Freight Charges',
  'Fuel Expense',
  'Printing & Stationery',
  'Electricity Expense',
  'Professional Fees',
  'Rent Expense',
  'Insurance Expense',
  'Furniture & Fixtures',
  'Repairs & Maintenance',
  'Miscellaneous Expenses'
]

export function ReviewScreen({ invoice, items, validations, ledgerSuggestions }: ReviewScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [formData, setFormData] = useState({
    vendorName: invoice.vendorName || '',
    vendorGstin: invoice.vendorGstin || '',
    invoiceNumber: invoice.invoiceNumber || '',
    invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
    subtotal: Number(invoice.subtotal) || 0,
    cgst: Number(invoice.cgst) || 0,
    sgst: Number(invoice.sgst) || 0,
    igst: Number(invoice.igst) || 0,
    total: Number(invoice.total) || 0,
  })

  // Sync formData if invoice prop changes from server (after save)
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        vendorName: invoice.vendorName || '',
        vendorGstin: invoice.vendorGstin || '',
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
        subtotal: Number(invoice.subtotal) || 0,
        cgst: Number(invoice.cgst) || 0,
        sgst: Number(invoice.sgst) || 0,
        igst: Number(invoice.igst) || 0,
        total: Number(invoice.total) || 0,
      })
    }
  }, [invoice, isEditing])

  // Initialize ledger mappings state
  const initialMappings: Record<string, string> = {}
  items.forEach(item => {
    const suggestion = ledgerSuggestions.find(ls => ls.itemId === item.id)
    initialMappings[item.id] = suggestion?.approvedLedger || suggestion?.suggestedLedger || 'Miscellaneous Expenses'
  })
  const [ledgerMappings, setLedgerMappings] = useState<Record<string, string>>(initialMappings)

  const handleApprove = async () => {
    await approveInvoice(invoice.id)
  }

  const handleReject = async () => {
    await rejectInvoice(invoice.id)
  }

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      ledgerMappings: Object.entries(ledgerMappings).map(([itemId, ledgerName]) => ({ itemId, ledgerName }))
    }
    const result = await saveInvoiceEdits(invoice.id, dataToSave)
    if (result.success) {
      setIsEditing(false)
    } else {
      alert(`Failed to save edits: ${result.error}`)
    }
  }

  const handlePushToTally = async () => {
    if (!invoice.vouchers?.[0]) return
    setIsPushing(true)
    const result = await pushToTallyDirect(invoice.vouchers[0].id)
    setIsPushing(false)
    if (result.success) {
      alert('Successfully pushed to Tally!')
    } else {
      alert(`Failed to push to Tally:\n${result.error}`)
    }
  }

  // Visual cues for validation
  const errors = validations.filter(v => v.severity === 'ERROR')
  const warnings = validations.filter(v => v.severity === 'WARNING')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      
      {/* LEFT: Document Viewer */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/50 shadow-xl flex flex-col h-full relative group">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-3 text-sm font-semibold flex justify-between items-center shadow-md z-10">
          <span className="flex items-center"><FileText className="w-4 h-4 mr-2 text-indigo-400" /> Original Document</span>
          <span className="text-gray-300 font-mono text-xs">{invoice.sourceFileUrl?.split('/').pop() || 'Document'}</span>
        </div>
        <div className="flex-1 w-full h-full overflow-y-auto bg-gray-100/50 relative">
          {invoice.sourceFileUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null ? (
            <div className="w-full min-h-full p-4 flex justify-center">
              <Image 
                src={invoice.sourceFileUrl} 
                alt="Invoice Document" 
                width={900}
                height={1200}
                className="w-full h-auto max-w-4xl shadow-md rounded border border-gray-200 bg-white"
              />
            </div>
          ) : (
            <object 
              data={invoice.sourceFileUrl} 
              type="application/pdf" 
              className="w-full h-full min-h-[600px]"
            >
              <div className="flex items-center justify-center h-full flex-col space-y-4 p-8 text-center">
                 <p>Your browser does not support PDFs.</p>
                 <a href={invoice.sourceFileUrl} target="_blank" className="text-blue-500 underline">Download instead</a>
              </div>
            </object>
          )}
        </div>
      </div>

      {/* RIGHT: Data Form & Review */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl flex flex-col h-full overflow-y-auto">
        
        {/* Header Actions */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10 shadow-sm">
          <div>
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Extracted Data</h2>
            <div className="flex space-x-2 mt-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                invoice.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                invoice.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                invoice.status === 'FAILED' ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' :
                'bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <button onClick={handleSave} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> Save
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </button>
            )}
            
            {['EXTRACTED', 'NEEDS_REVIEW'].includes(invoice.status) && (
              <>
                <button 
                  onClick={handleReject}
                  className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </button>
                
                <button 
                  onClick={handleApprove}
                  disabled={errors.length > 0}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  title={errors.length > 0 ? "Resolve errors before approving" : ""}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </button>
              </>
            )}

            {invoice.status === 'APPROVED' && invoice.vouchers?.[0] && (
              <div className="flex space-x-2">
                <a 
                  href={`/api/export/xml/${invoice.vouchers[0].id}`}
                  download
                  className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 border border-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" /> Download XML
                </a>
                <button
                  onClick={handlePushToTally}
                  disabled={isPushing}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPushing ? (
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" /> 
                  )}
                  Push to Tally
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Validation Banners */}
        <div className="p-5 space-y-3">
          {invoice.status === 'FAILED' && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-sm flex flex-col items-start text-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <div className="flex items-center font-bold text-red-900 mb-1">
                <AlertTriangle className="w-5 h-5 mr-2" /> Processing Failed
              </div>
              <p className="ml-7 text-red-700">
                The AI could not extract data. 
                {invoice.sourceFileUrl?.toLowerCase().endsWith('.pdf') 
                  ? ' If this is a Scanned PDF, please upload it as an Image (.jpg or .png) instead.' 
                  : ' Please ensure the image is clear, well-lit, and legible.'}
              </p>
            </div>
          )}
          {errors.map(err => (
            <div key={err.id} className="bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-100 shadow-sm flex items-start text-sm">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <div>
                <strong>{err.ruleName}</strong>: {err.message}
              </div>
            </div>
          ))}
          {warnings.map(warn => (
            <div key={warn.id} className="bg-yellow-50 text-yellow-800 p-3 rounded-lg flex items-start text-sm">
              <Info className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <div>
                <strong>{warn.ruleName}</strong>: {warn.message}
              </div>
            </div>
          ))}
        </div>

        {/* Data Form */}
        <div className="p-4 space-y-6">
          
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Vendor Name</label>
              {isEditing ? (
                <input type="text" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <div className="mt-1 text-sm font-semibold text-gray-900">{invoice.vendorName || '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Vendor GSTIN</label>
              {isEditing ? (
                <input type="text" value={formData.vendorGstin} onChange={e => setFormData({...formData, vendorGstin: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <div className="mt-1 text-sm font-medium text-gray-900">{invoice.vendorGstin || '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Invoice Number</label>
              {isEditing ? (
                <input type="text" value={formData.invoiceNumber} onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <div className="mt-1 text-sm font-medium text-gray-900">{invoice.invoiceNumber || '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase">Invoice Date</label>
              {isEditing ? (
                <input type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <div className="mt-1 text-sm font-medium text-gray-900">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}</div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Line Items</label>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tally Ledger</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                      <td className="px-3 py-2 text-sm text-gray-500 text-right">{Number(item.quantity)}</td>
                      <td className="px-3 py-2 text-sm text-gray-500 text-right">₹{Number(item.unitRate).toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium">₹{Number(item.lineTotal).toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm text-left">
                        {isEditing ? (
                          <select
                            value={ledgerMappings[item.id] || ''}
                            onChange={(e) => setLedgerMappings({ ...ledgerMappings, [item.id]: e.target.value })}
                            className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1 text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500"
                          >
                            {STANDARD_LEDGERS.map(ledger => (
                              <option key={ledger} value={ledger}>{ledger}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {ledgerMappings[item.id]}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-sm text-gray-500 text-center">No items extracted</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 border">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              {isEditing ? (
                 <input type="number" value={formData.subtotal} onChange={e => setFormData({...formData, subtotal: Number(e.target.value)})} className="w-24 text-right border rounded p-1 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <span className="font-medium text-gray-900">₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">CGST</span>
              {isEditing ? (
                 <input type="number" value={formData.cgst} onChange={e => setFormData({...formData, cgst: Number(e.target.value)})} className="w-24 text-right border rounded p-1 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <span className="font-medium text-gray-900">₹{Number(invoice.cgst || 0).toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">SGST</span>
              {isEditing ? (
                 <input type="number" value={formData.sgst} onChange={e => setFormData({...formData, sgst: Number(e.target.value)})} className="w-24 text-right border rounded p-1 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <span className="font-medium text-gray-900">₹{Number(invoice.sgst || 0).toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IGST</span>
              {isEditing ? (
                 <input type="number" value={formData.igst} onChange={e => setFormData({...formData, igst: Number(e.target.value)})} className="w-24 text-right border rounded p-1 text-sm text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500" />
              ) : (
                <span className="font-medium text-gray-900">₹{Number(invoice.igst || 0).toFixed(2)}</span>
              )}
            </div>
            <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="font-extrabold text-gray-900 text-lg uppercase tracking-wider">Grand Total</span>
              {isEditing ? (
                 <input type="number" value={formData.total} onChange={e => setFormData({...formData, total: Number(e.target.value)})} className="w-32 text-right border rounded-lg p-2 font-bold text-xl text-indigo-700 bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-inner" />
              ) : (
                <span className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 drop-shadow-sm">₹{Number(invoice.total || 0).toFixed(2)}</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
