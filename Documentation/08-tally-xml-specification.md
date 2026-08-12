# Tally XML Specification

**Document Version:** 1.0  
**Last Updated:** August 2026  
**Target:** Tally Prime (Release 3.x+)

---

## 1. Overview

CA AI generates XML files compatible with Tally Prime's import functionality. This document specifies the XML structure, field mappings, and examples for each supported voucher type.

### Supported Voucher Types (Phase 1)

| Voucher Type | Tally XML Tag | Use Case |
|-------------|---------------|----------|
| Purchase | `Purchase` | Vendor invoice received |
| Sales | `Sales` | Customer invoice issued |

### Future Voucher Types (Phase 2+)

| Voucher Type | Tally XML Tag | Use Case |
|-------------|---------------|----------|
| Journal | `Journal` | Adjustment entries |
| Receipt | `Receipt` | Payment received |
| Payment | `Payment` | Payment made |

---

## 2. XML Root Structure

Every Tally import XML follows this root structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Company Name</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <!-- One or more TALLYMESSAGE blocks -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <!-- Voucher data here -->
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
```

---

## 3. Voucher XML Structure

### Common Voucher Template

```xml
<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER VCHTYPE="{voucher_type}" ACTION="Create" OBJVIEW="Accounting Voucher View">
    <DATE>{YYYYMMDD}</DATE>
    <VOUCHERTYPENAME>{voucher_type}</VOUCHERTYPENAME>
    <VOUCHERNUMBER>{voucher_number}</VOUCHERNUMBER>
    <NARRATION>{narration_text}</NARRATION>
    <EFFECTIVEDATE>{YYYYMMDD}</EFFECTIVEDATE>
    <REFERENCE>{invoice_number}</REFERENCE>
    <PARTYNAME>{party_ledger_name}</PARTYNAME>

    <!-- Accounting entries (ALLLEDGERENTRIES.LIST) -->
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>{ledger_name}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>{Yes/No}</ISDEEMEDPOSITIVE>
      <AMOUNT>{amount}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
    <!-- Repeat for each debit/credit line -->

  </VOUCHER>
</TALLYMESSAGE>
```

### Important Tally XML Conventions

| Convention | Rule |
|-----------|------|
| Date format | `YYYYMMDD` (e.g., `20260722`) — no separators |
| Amount sign | Negative for debit, Positive for credit |
| `ISDEEMEDPOSITIVE` | `Yes` for debit entries, `No` for credit entries |
| Ledger names | Must match exactly with ledger names in Tally |
| Narration | Plain text, no special characters that break XML |
| Voucher number | Must be unique within the company |
| Character encoding | UTF-8 |

---

## 4. Field Mapping — Invoice to Tally XML

| Invoice Data | Tally XML Field | Transformation |
|-------------|----------------|----------------|
| `voucher_date` | `<DATE>` | Format as `YYYYMMDD` |
| `voucher_type` | `<VOUCHERTYPENAME>` | Map: `PURCHASE` → `Purchase`, `SALES` → `Sales` |
| `voucher_number` | `<VOUCHERNUMBER>` | Use as-is |
| `narration` | `<NARRATION>` | Auto-generated text |
| `invoice_number` | `<REFERENCE>` | Use as-is |
| `vendor_name` | `<PARTYNAME>` | Use as party ledger |
| Each voucher line → | `<ALLLEDGERENTRIES.LIST>` | One entry per debit/credit line |
| `ledger_name` | `<LEDGERNAME>` | Use approved ledger name |
| `entry_type` | `<ISDEEMEDPOSITIVE>` | DEBIT → `Yes`, CREDIT → `No` |
| `amount` | `<AMOUNT>` | DEBIT → negative, CREDIT → positive |

---

## 5. Complete Examples

### Example 1: Purchase Voucher

**Scenario:** Purchased 1 Laptop (₹55,000) + 1 Laptop Bag (₹1,500) from ABC Traders with 18% GST (intra-state, Maharashtra).

| Line | Ledger | Type | Amount |
|------|--------|------|--------|
| 1 | Computer & IT Equipment | Debit | ₹55,000.00 |
| 2 | Office Supplies | Debit | ₹1,500.00 |
| 3 | Input CGST 9% | Debit | ₹5,085.00 |
| 4 | Input SGST 9% | Debit | ₹5,085.00 |
| 5 | ABC Traders | Credit | ₹66,670.00 |

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Demo CA Firm</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20260722</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>PUR-001</VOUCHERNUMBER>
            <NARRATION>Being purchase of Laptop Dell Inspiron 15, Laptop Bag from ABC Traders vide Invoice #INV-2045 dated 22-Jul-2026</NARRATION>
            <EFFECTIVEDATE>20260722</EFFECTIVEDATE>
            <REFERENCE>INV-2045</REFERENCE>
            <PARTYNAME>ABC Traders</PARTYNAME>

            <!-- Debit: Computer & IT Equipment -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Computer &amp; IT Equipment</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-55000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

            <!-- Debit: Office Supplies -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Office Supplies</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-1500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

            <!-- Debit: Input CGST -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input CGST 9%</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-5085.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

            <!-- Debit: Input SGST -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Input SGST 9%</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-5085.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

            <!-- Credit: ABC Traders (Sundry Creditor) -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>ABC Traders</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>66670.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
```

---

### Example 2: Sales Voucher

**Scenario:** Sold consulting services (₹25,000) to XYZ Corp with 18% IGST (inter-state).

| Line | Ledger | Type | Amount |
|------|--------|------|--------|
| 1 | XYZ Corp | Debit | ₹29,500.00 |
| 2 | Consulting Revenue | Credit | ₹25,000.00 |
| 3 | Output IGST 18% | Credit | ₹4,500.00 |

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Demo CA Firm</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDATA>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>20260725</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>SAL-001</VOUCHERNUMBER>
            <NARRATION>Being sale of Consulting Services to XYZ Corp vide Invoice #SAL-INV-101 dated 25-Jul-2026</NARRATION>
            <EFFECTIVEDATE>20260725</EFFECTIVEDATE>
            <REFERENCE>SAL-INV-101</REFERENCE>
            <PARTYNAME>XYZ Corp</PARTYNAME>

            <!-- Debit: XYZ Corp (Sundry Debtor) -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>XYZ Corp</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-29500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

            <!-- Credit: Consulting Revenue -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Consulting Revenue</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>25000.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

            <!-- Credit: Output IGST -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output IGST 18%</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>4500.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>

          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
```

---

### Example 3: Batch Export (Multiple Vouchers)

Multiple vouchers can be combined in a single XML file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Demo CA Firm</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>

        <!-- Voucher 1 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <!-- ... voucher 1 data ... -->
          </VOUCHER>
        </TALLYMESSAGE>

        <!-- Voucher 2 -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <!-- ... voucher 2 data ... -->
          </VOUCHER>
        </TALLYMESSAGE>

        <!-- Voucher N -->
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <!-- ... voucher N data ... -->
          </VOUCHER>
        </TALLYMESSAGE>

      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
```

---

## 6. XML Special Characters

Always escape these characters in XML values:

| Character | Escape | Example |
|-----------|--------|---------|
| `&` | `&amp;` | `Computer &amp; IT Equipment` |
| `<` | `&lt;` | `Total &lt; 1000` |
| `>` | `&gt;` | `Qty &gt; 5` |
| `"` | `&quot;` | `Size 15&quot;` |
| `'` | `&apos;` | `Ram&apos;s Store` |

---

## 7. Import Instructions for Tally Prime

### Step-by-Step Import

1. **Open Tally Prime** and load your company
2. Go to **Gateway of Tally** → **Import Data** → **Import Vouchers**
3. Or use the keyboard shortcut: **Alt + H** → **Import** → **XML**
4. Browse to the exported XML file
5. Click **Import**
6. Review the import summary — it shows success/failure count
7. Verify imported vouchers in the appropriate register (Purchase Register, Sales Register)

### Pre-Requisites in Tally

Before importing, ensure these ledgers exist in Tally:

| Ledger Type | Examples | Tally Group |
|------------|---------|-------------|
| Expense ledgers | Computer & IT Equipment, Office Supplies, etc. | Indirect Expenses / Direct Expenses |
| Party ledgers | ABC Traders, XYZ Corp | Sundry Creditors / Sundry Debtors |
| GST input ledgers | Input CGST 9%, Input SGST 9%, Input IGST 18% | Duties & Taxes |
| GST output ledgers | Output CGST 9%, Output SGST 9%, Output IGST 18% | Duties & Taxes |
| Revenue ledgers | Consulting Revenue, Sales Account | Sales Accounts |

> **Important:** Ledger names in the XML must exactly match ledger names in Tally. Even a single character difference (including case) will cause an import error.

---

## 8. Common Import Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Ledger not found` | Ledger name in XML doesn't match Tally | Create the ledger in Tally or fix the name in XML |
| `Voucher type not found` | Custom voucher type not configured | Use standard types (Purchase, Sales) |
| `Amount mismatch` | Debits ≠ Credits | Ensure total of negative amounts = total of positive amounts |
| `Duplicate voucher number` | Voucher number already exists | Use unique voucher numbers or allow Tally to auto-number |
| `Invalid date` | Date format incorrect | Ensure `YYYYMMDD` format with no separators |
| `Company name mismatch` | `SVCURRENTCOMPANY` doesn't match | Update to match the exact company name in Tally |
| `XML parsing error` | Unescaped special characters | Escape `&`, `<`, `>`, `"`, `'` in all text values |

---

## 9. XML Generator Implementation Notes

### TypeScript Implementation Skeleton

```typescript
// services/xml-export.service.ts

interface TallyVoucherData {
  companyName: string;
  voucherType: 'Purchase' | 'Sales';
  voucherNumber: string;
  date: Date;
  partyName: string;
  narration: string;
  reference: string;
  entries: {
    ledgerName: string;
    isDeemedPositive: boolean;  // true = debit, false = credit
    amount: number;             // Always positive, sign applied internally
  }[];
}

function generateTallyXml(vouchers: TallyVoucherData[]): string {
  const voucherXml = vouchers.map(v => {
    const entriesXml = v.entries.map(e => `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(e.ledgerName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${e.isDeemedPositive ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
              <AMOUNT>${e.isDeemedPositive ? -e.amount : e.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`).join('');

    return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${formatTallyDate(v.date)}</DATE>
            <VOUCHERTYPENAME>${v.voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(v.voucherNumber)}</VOUCHERNUMBER>
            <NARRATION>${escapeXml(v.narration)}</NARRATION>
            <EFFECTIVEDATE>${formatTallyDate(v.date)}</EFFECTIVEDATE>
            <REFERENCE>${escapeXml(v.reference)}</REFERENCE>
            <PARTYNAME>${escapeXml(v.partyName)}</PARTYNAME>
            ${entriesXml}
          </VOUCHER>
        </TALLYMESSAGE>`;
  }).join('\n');

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
          <SVCURRENTCOMPANY>${escapeXml(vouchers[0]?.companyName ?? '')}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${voucherXml}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

function formatTallyDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

---

## 10. Validation Before Export

Before generating XML, the system must verify:

| Check | Rule | Action on Fail |
|-------|------|----------------|
| Voucher is balanced | Sum of all amounts = 0 | Block export, show error |
| All ledger names present | No empty ledger names | Block export, show error |
| Voucher number is unique | Not already exported | Block export, show error |
| Date is valid | Parseable, not in future | Block export, show error |
| Party name exists | Non-empty string | Block export, show error |
| XML is well-formed | Parse with XML parser | Block export, fix generator |
