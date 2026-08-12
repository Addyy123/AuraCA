'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteInvoiceAction } from '@/app/actions/invoice-actions'
import { useRouter } from 'next/navigation'

export function DeleteInvoiceButton({ invoiceId, redirectOnDelete = false }: { invoiceId: string, redirectOnDelete?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteInvoiceAction(invoiceId)
      if (result.success) {
        if (redirectOnDelete) {
          router.push('/invoices')
        }
      } else {
        alert(result.error || 'Failed to delete invoice')
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors border shadow-sm ${
        isPending
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300'
      }`}
      title="Delete Invoice"
    >
      {isPending ? (
        <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  )
}
