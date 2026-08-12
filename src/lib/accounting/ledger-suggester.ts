import { prisma } from '@/lib/db'

// Basic keyword mapping rules based on the spec
const LEDGER_RULES = [
  { keywords: ['laptop', 'computer', 'desktop', 'monitor', 'keyboard', 'mouse', 'printer'], ledger: 'Computer & IT Equipment' },
  { keywords: ['mobile', 'phone', 'internet', 'broadband', 'wifi', 'telecom', 'airtel', 'jio'], ledger: 'Communication Expense' },
  { keywords: ['freight', 'transport', 'courier', 'shipping', 'delivery', 'logistics'], ledger: 'Freight Charges' },
  { keywords: ['fuel', 'diesel', 'petrol', 'cng', 'gas'], ledger: 'Fuel Expense' },
  { keywords: ['stationery', 'paper', 'pen', 'ink', 'toner', 'cartridge'], ledger: 'Printing & Stationery' },
  { keywords: ['electricity', 'power', 'electric', 'mseb', 'bescom'], ledger: 'Electricity Expense' },
  { keywords: ['legal', 'consultation', 'advisory', 'audit', 'professional'], ledger: 'Professional Fees' },
  { keywords: ['rent', 'lease', 'office space', 'warehouse'], ledger: 'Rent Expense' },
  { keywords: ['insurance', 'premium', 'policy', 'claim'], ledger: 'Insurance Expense' },
  { keywords: ['furniture', 'chair', 'table', 'desk', 'cabinet', 'shelf'], ledger: 'Furniture & Fixtures' },
  { keywords: ['repair', 'maintenance', 'service', 'amc'], ledger: 'Repairs & Maintenance' },
]

export async function suggestLedgers(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    })

    if (!invoice || invoice.items.length === 0) return

    const suggestions: any[] = []

    for (const item of invoice.items) {
      const description = item.description.toLowerCase()
      let matchedLedger = 'Miscellaneous Expenses' // Default
      let confidence = 0.5
      let reasoning = 'Fallback default ledger'

      // Run keyword matching
      for (const rule of LEDGER_RULES) {
        if (rule.keywords.some(kw => description.includes(kw))) {
          matchedLedger = rule.ledger
          confidence = 0.85
          reasoning = 'Matched keyword rule'
          break
        }
      }

      suggestions.push({
        invoiceId: invoiceId,
        itemId: item.id,
        suggestedLedger: matchedLedger,
        confidenceScore: confidence,
        sourceReason: reasoning,
        // Auto-approve the suggested ledger for the MVP unless overridden
        approvedLedger: matchedLedger 
      })
    }

    // Clear old suggestions
    await prisma.ledgerSuggestion.deleteMany({ where: { invoiceId } })

    // Save new suggestions
    await prisma.ledgerSuggestion.createMany({
      data: suggestions
    })

    console.log(`[Ledger] Suggested ledgers for Invoice ${invoiceId}`)

  } catch (error) {
    console.error(`[Ledger] Error suggesting ledgers for Invoice ${invoiceId}:`, error)
  }
}
