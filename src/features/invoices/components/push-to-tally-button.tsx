'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { pushToTallyDirect } from '@/app/actions/export-actions'

export function PushToTallyButton({ voucherId }: { voucherId: string }) {
  const [isPushing, setIsPushing] = useState(false)

  const handlePush = async () => {
    setIsPushing(true)
    const result = await pushToTallyDirect(voucherId)
    setIsPushing(false)
    if (result.success) {
      alert('Successfully pushed to Tally!')
    } else {
      alert(`Failed to push to Tally:\n${result.error}`)
    }
  }

  return (
    <button
      onClick={handlePush}
      disabled={isPushing}
      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      title="Push Directly to Tally"
    >
      {isPushing ? (
        <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Send className="w-4 h-4 mr-1" />
      )}
      Push
    </button>
  )
}
