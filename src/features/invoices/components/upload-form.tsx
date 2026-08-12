'use client'

import { useState, useEffect } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, FileText, Sparkles } from 'lucide-react'
import { uploadInvoiceAction } from '@/app/actions/invoice-actions'
import Link from 'next/link'

interface UploadFormProps {
  clients: { id: string, name: string }[]
  defaultClientId?: string
}

export function UploadForm({ clients, defaultClientId }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  // Use the first available client ID from props, or fall back to the default passed from the server
  const resolvedClientId = clients[0]?.id || defaultClientId || ''
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus('idle')
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setStatus('idle')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setStatus('idle')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', resolvedClientId)

    const result = await uploadInvoiceAction(formData)

    if (result.success) {
      setStatus('success')
      setFile(null)
    } else {
      setStatus('error')
      setErrorMessage(result.error || 'Upload failed')
    }
    
    setIsUploading(false)
  }

  return (
    <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 sm:p-10 mx-auto mt-6 relative overflow-hidden group">
      
      {/* Decorative gradient orb inside the card */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>

      <div className="flex items-center space-x-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Upload Invoice</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        
        {/* Client info (auto-resolved server side) */}
        {clients.length > 0 && (
          <div className="flex items-center px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mr-2">Client:</span>
            <span className="text-sm font-bold text-slate-800">{clients[0]?.name || 'Default Client'}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden
            ${isDragActive ? 'border-indigo-500 bg-indigo-50/80 scale-[1.02] shadow-inner' : ''}
            ${!isDragActive && file ? 'border-violet-300 bg-violet-50/50 shadow-sm hover:shadow-md hover:border-violet-400' : ''}
            ${!isDragActive && !file ? 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 bg-white' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          {/* Animated background on drag */}
          {isDragActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse"></div>
          )}

          {file ? (
            <div className="text-center relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-violet-100">
                <FileText className="w-8 h-8 text-violet-600" />
              </div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1 px-4">{file.name}</p>
              <p className="text-xs font-medium text-slate-500 mt-1.5 px-3 py-1 bg-white rounded-full shadow-sm border border-slate-100">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
                className="mt-6 px-4 py-2 text-xs font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors focus:ring-2 focus:ring-rose-200 outline-none"
                disabled={isUploading}
              >
                Remove & Choose Another
              </button>
            </div>
          ) : (
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                <UploadCloud className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="text-sm text-slate-600 font-medium">
                <label htmlFor="file-upload" className="relative cursor-pointer text-indigo-600 hover:text-indigo-700 font-bold focus-within:outline-none underline decoration-indigo-200 underline-offset-4 hover:decoration-indigo-500 transition-colors">
                  <span>Browse files</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                </label>
                {' '}or drag and drop here
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium tracking-wide uppercase">PDF, PNG, JPG (Max 10MB)</p>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className={`transition-all duration-500 overflow-hidden ${status === 'idle' ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
          {status === 'success' && (
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex items-center text-emerald-800 mb-4 sm:mb-0">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-medium">Invoice uploaded successfully!<br/><span className="text-emerald-600/80 text-xs">The AI is now processing the document.</span></span>
              </div>
              <Link 
                href="/invoices" 
                className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all font-semibold text-xs whitespace-nowrap group hover:-translate-y-0.5"
              >
                Go to Invoices <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center text-sm text-rose-700 bg-rose-50 p-4 rounded-2xl border border-rose-100">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isUploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Processing via AI...
            </span>
          ) : (
            'Extract & Process Invoice'
          )}
        </button>

      </form>
    </div>
  )
}
