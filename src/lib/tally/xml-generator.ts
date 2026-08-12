import { Voucher, VoucherLine, Firm, Invoice } from '@prisma/client'

export type FullVoucher = Voucher & {
  lines: VoucherLine[]
  invoice: Invoice & { firm: Firm }
}

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatTallyDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/**
 * Determines the correct Tally parent group for a ledger line.
 */
export function getParentGroup(ledgerName: string, entryType: string, voucherType: string): string {
  const name = ledgerName.toUpperCase()

  if (name.includes('CGST') || name.includes('SGST') || name.includes('IGST') || name.includes('GST') || name.includes('TAX')) {
    return 'Duties & Taxes'
  }
  if (name.includes('ROUND')) {
    return 'Indirect Expenses'
  }

  const isDebit = entryType === 'DEBIT'

  if (voucherType === 'PURCHASE') {
    // In a purchase voucher, the CREDIT side is the Sundry Creditor (vendor)
    return isDebit ? 'Indirect Expenses' : 'Sundry Creditors'
  } else {
    // In a sales voucher, the DEBIT side is the Sundry Debtor (customer)
    return isDebit ? 'Sundry Debtors' : 'Sales Accounts'
  }
}

/**
 * Generates the XML to create/update a SINGLE ledger in Tally.
 * This is sent as a separate request BEFORE the voucher.
 */
export function generateLedgerXml(ledgerName: string, parentGroup: string, companyName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${escapeXml(ledgerName)}" ACTION="Create">
            <NAME>${escapeXml(ledgerName)}</NAME>
            <PARENT>${escapeXml(parentGroup)}</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

/**
 * Generates the XML for a single Tally voucher (Purchase or Sales).
 * This is sent AFTER all ledgers have been created.
 */
export function generateVoucherXml(voucher: FullVoucher): string {
  // Validate Balance
  let totalDebit = 0
  let totalCredit = 0

  for (const line of voucher.lines) {
    if (line.entryType === 'DEBIT') {
      totalDebit += Number(line.amount)
    } else {
      totalCredit += Number(line.amount)
    }
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Voucher is unbalanced. Debits: ${totalDebit}, Credits: ${totalCredit}`)
  }

  const voucherType = voucher.voucherType === 'PURCHASE' ? 'Purchase' : 'Sales'
  const dateStr = formatTallyDate(voucher.voucherDate)
  const partyLedger = voucher.voucherType === 'PURCHASE'
    ? voucher.lines.find(l => l.entryType === 'CREDIT')?.ledgerName || ''
    : voucher.lines.find(l => l.entryType === 'DEBIT')?.ledgerName || ''

  // Tally strictly requires the Party Ledger to be the first entry in the XML
  const sortedLines = [...voucher.lines].sort((a, b) => {
    if (a.ledgerName === partyLedger) return -1;
    if (b.ledgerName === partyLedger) return 1;
    return 0;
  });

  let entriesXml = ''
  for (const line of sortedLines) {
    const isDebit = line.entryType === 'DEBIT'
    const amount = Number(line.amount)
    const tallyAmount = isDebit ? -amount : amount

    entriesXml += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(line.ledgerName)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
          <AMOUNT>${tallyAmount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(voucher.invoice.firm.name)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${dateStr}</DATE>
            <VOUCHERTYPENAME>${voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(voucher.voucherNumber)}</VOUCHERNUMBER>
            <NARRATION>${escapeXml(voucher.narration || '')}</NARRATION>
            <EFFECTIVEDATE>${dateStr}</EFFECTIVEDATE>
            <REFERENCE>${escapeXml(voucher.invoice.invoiceNumber || voucher.invoiceId)}</REFERENCE>
            <PARTYNAME>${escapeXml(partyLedger)}</PARTYNAME>
            <PARTYLEDGERNAME>${escapeXml(partyLedger)}</PARTYLEDGERNAME>
${entriesXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

/**
 * Generates the XML file for manual download.
 * Note: When importing manually via Import > Transactions, Tally strictly expects
 * ONLY the voucher block. (It does not support multiple IMPORTDATA blocks for different types).
 */
export function generateTallyXml(voucher: FullVoucher): string {
  return generateVoucherXml(voucher)
}
