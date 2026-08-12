import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center space-y-8">
        <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-indigo-600" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
          AuraCA
        </h1>
        
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Intelligent OCR extraction, automatic ledger suggestion, and seamless Tally XML export for modern accounting firms.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Open Dashboard
            <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/invoices/upload"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Upload Invoice
          </Link>
        </div>
      </main>
    </div>
  );
}
