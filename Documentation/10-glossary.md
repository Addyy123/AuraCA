# Glossary

**Document Version:** 1.0  
**Last Updated:** August 2026

This glossary defines key terms used throughout the CA AI documentation. It is organized into four categories: Accounting, GST (Goods & Services Tax), Technical, and Product-Specific terms.

---

## 1. Accounting Terms

| Term | Definition |
|------|-----------|
| **Voucher** | A formal accounting entry that records a financial transaction. In Tally, vouchers are the primary unit of accounting data (purchase voucher, sales voucher, journal voucher, etc.). |
| **Ledger** | An account in which financial transactions are recorded. Examples: "Cash", "Bank Account", "Computer & IT Equipment", "Freight Charges". In Tally, every debit or credit entry is posted against a ledger. |
| **Debit** | An entry on the left side of an account. In the context of vouchers: expenses, assets, and amounts receivable are debited. |
| **Credit** | An entry on the right side of an account. In the context of vouchers: income, liabilities, and amounts payable are credited. |
| **Narration** | A brief text description attached to a voucher that explains the purpose of the transaction. Example: "Being purchase of Laptop from ABC Traders vide Invoice #INV-2045". |
| **Purchase Voucher** | A voucher recording the purchase of goods or services. Debits the expense/asset ledger and credits the supplier/creditor ledger. |
| **Sales Voucher** | A voucher recording the sale of goods or services. Debits the customer/debtor ledger and credits the revenue ledger. |
| **Journal Voucher** | A voucher for adjustments, corrections, or transactions that don't fit purchase/sales/receipt/payment categories. |
| **Receipt Voucher** | A voucher recording money received (e.g., payment from a customer). Debits bank/cash and credits the customer ledger. |
| **Payment Voucher** | A voucher recording money paid out (e.g., payment to a supplier). Debits the supplier ledger and credits bank/cash. |
| **Sundry Creditor** | A Tally group for parties (vendors/suppliers) to whom the business owes money. |
| **Sundry Debtor** | A Tally group for parties (customers) who owe money to the business. |
| **Chart of Accounts** | The complete list of ledgers (accounts) used by a company to record financial transactions. |
| **Invoice** | A commercial document issued by a seller to a buyer, listing goods/services provided with quantities, prices, and tax details. |
| **Credit Note** | A document issued to reduce the amount a buyer owes (e.g., for returned goods or pricing errors). Reverses part of an original invoice. |
| **Debit Note** | A document issued by a buyer to a seller requesting a reduction in the amount owed. |
| **Financial Year (FY)** | The 12-month period used for accounting and tax purposes. In India, the financial year runs from April 1 to March 31. |
| **Reconciliation** | The process of matching and verifying two sets of records (e.g., bank statement vs accounting records) to ensure they agree. |
| **Trial Balance** | A report listing all ledger balances at a point in time. Total debits should equal total credits. |
| **Audit Trail** | A chronological record of all changes made to financial data, showing who changed what, when, and the before/after values. |

---

## 2. GST Terms (Goods & Services Tax — India)

| Term | Full Form | Definition |
|------|-----------|-----------|
| **GST** | Goods and Services Tax | A unified indirect tax levied on the supply of goods and services in India. Replaced multiple older taxes (VAT, service tax, excise duty). |
| **GSTIN** | GST Identification Number | A unique 15-character alphanumeric identifier assigned to every registered GST taxpayer. Format: `{2-digit state code}{10-char PAN}{1-char entity}{1-char Z}{1-char checksum}`. Example: `27ABCDE1234F1Z5`. |
| **CGST** | Central GST | The portion of GST collected by the Central Government on intra-state (within the same state) transactions. |
| **SGST** | State GST | The portion of GST collected by the State Government on intra-state transactions. |
| **IGST** | Integrated GST | GST levied on inter-state (between different states) transactions. Collected by the Central Government and shared with the destination state. |
| **HSN Code** | Harmonized System of Nomenclature | A standardized 4–8 digit numeric code used to classify goods. Determines the applicable GST rate. Example: `8471` = Computers. |
| **SAC Code** | Services Accounting Code | A standardized numeric code used to classify services under GST. Similar to HSN but for services. Example: `998311` = Legal services. |
| **Intra-State** | — | A transaction where the supplier and buyer are in the same state. Attracts CGST + SGST. |
| **Inter-State** | — | A transaction where the supplier and buyer are in different states. Attracts IGST. |
| **Place of Supply** | — | The location where goods or services are deemed to be supplied. Determines whether CGST+SGST or IGST applies. |
| **Input Tax Credit (ITC)** | — | The credit a business receives for GST paid on purchases, which can be offset against GST collected on sales. |
| **Reverse Charge Mechanism (RCM)** | — | A mechanism where the recipient of goods/services pays the GST instead of the supplier. Applies in specific cases. |
| **GSTR-1** | — | A monthly/quarterly return filed by registered taxpayers with details of outward supplies (sales). |
| **GSTR-3B** | — | A monthly summary return for reporting total sales, purchases, ITC claimed, and net GST payable. |
| **Tax Invoice** | — | A document issued by a registered GST dealer for supply of goods/services. Must include GSTIN, HSN/SAC codes, and tax breakup. |
| **E-Way Bill** | — | An electronic document required for movement of goods above ₹50,000 in value. |
| **GST Rate Slabs** | — | The standard GST rates: 0%, 5%, 12%, 18%, and 28%. Most goods and services fall under 18%. |

---

## 3. Technical Terms

| Term | Definition |
|------|-----------|
| **OCR** | Optical Character Recognition — technology that converts images of text (from scanned documents or photos) into machine-readable text. Used to extract text from scanned invoices. |
| **LLM** | Large Language Model — an AI model trained on vast amounts of text data, capable of understanding and generating human-like text. CA AI uses LLaMA 3.3 70B via Groq for extraction. |
| **Confidence Score** | A numeric value (0.0 to 1.0) indicating how certain the AI system is about an extracted value. Higher = more reliable. |
| **JWT** | JSON Web Token — a compact, URL-safe token format used for authentication. Contains encoded user identity and permissions. |
| **RLS** | Row-Level Security — a database feature that restricts which rows a user can access based on policies. Used to ensure firm-level data isolation. |
| **ORM** | Object-Relational Mapping — a technique that maps database tables to programming language objects. Prisma is the ORM used in CA AI. |
| **API** | Application Programming Interface — a set of defined endpoints that allow different software components to communicate. |
| **REST** | Representational State Transfer — an architectural style for designing API endpoints using standard HTTP methods (GET, POST, PATCH, DELETE). |
| **SSR** | Server-Side Rendering — rendering web pages on the server before sending to the browser. Improves SEO and initial load time. |
| **ISR** | Incremental Static Regeneration — a Next.js feature that regenerates static pages on demand, combining static and dynamic benefits. |
| **Middleware** | Software that sits between the client request and the application logic, handling cross-cutting concerns like authentication, validation, and logging. |
| **Webhook** | A mechanism where one system sends real-time data to another system via HTTP when an event occurs. |
| **Exponential Backoff** | A retry strategy where the wait time between retries increases exponentially (e.g., 1s, 2s, 4s, 8s). Prevents overwhelming failed services. |
| **Idempotent** | An operation that produces the same result whether executed once or multiple times. Important for retry-safe API design. |
| **Migration** | A versioned change to the database schema (e.g., adding a table or column). Managed by Prisma in CA AI. |
| **Seed Data** | Initial data inserted into a database for development or testing purposes. |
| **Soft Delete** | Marking a record as deleted (e.g., `is_deleted = true`) instead of permanently removing it. Preserves audit trail. |

---

## 4. Product-Specific Terms

| Term | Definition |
|------|-----------|
| **Processing Pipeline** | The automated sequence of steps an invoice goes through: Upload → OCR → AI Extraction → Validation → Ledger Suggestion → Voucher Generation. |
| **Auto-Approve** | When an invoice has ≥95% overall confidence and passes all validations, it can be automatically approved without human review. |
| **Review Queue** | The list of invoices that require human inspection before approval. Invoices with <95% confidence or validation warnings land here. |
| **Reprocessing** | Re-triggering the OCR and AI extraction pipeline on an invoice that previously failed or produced incorrect results. |
| **Confidence Threshold** | The minimum confidence score required for different actions. Default: 95% for auto-approve, 80% for "likely correct" classification. |
| **Ledger Mapping** | The process of assigning each invoice line item to the appropriate accounting ledger (e.g., "Laptop" → "Computer & IT Equipment"). |
| **Keyword Rule** | A pre-defined rule that maps keywords in item descriptions to specific ledgers (e.g., any item containing "freight" maps to "Freight Charges"). |
| **Duplicate Suspect** | An invoice flagged because it closely matches an existing invoice in the system (same vendor + invoice number, or similar total + date). |
| **Firm Scoping** | The security mechanism that ensures users can only access data belonging to their own firm. Enforced via RLS and middleware. |
| **Voucher Balancing** | The accounting rule that total debits must equal total credits in a voucher. A voucher that doesn't balance cannot be exported. |
| **Tally Import** | The process of importing XML files generated by CA AI into Tally Prime to create accounting vouchers automatically. |
| **Export Attempt** | A single try to generate and store Tally XML for an approved voucher. Failed attempts are logged and can be retried. |
| **Learning Loop** | The system's ability to improve over time by capturing user corrections and using them to refine AI extraction, ledger suggestions, and confidence scoring. |
| **Vendor Normalization** | The process of identifying that different text variations refer to the same vendor (e.g., "ABC Traders", "A.B.C. Traders", "ABC TRADERS PVT LTD"). |

---

## 5. Tally-Specific Terms

| Term | Definition |
|------|-----------|
| **Tally Prime** | The latest version of Tally, a widely-used accounting software in India. CA AI generates XML compatible with Tally Prime. |
| **Tally ERP 9** | The previous version of Tally. XML format differs slightly from Tally Prime. CA AI targets Tally Prime. |
| **Gateway of Tally** | The main menu/home screen in Tally from which all features are accessed. |
| **Tally Group** | A category that organizes ledgers (e.g., "Sundry Creditors", "Indirect Expenses", "Duties & Taxes"). |
| **Tally Company** | A separate set of books in Tally. Each company has its own chart of accounts, vouchers, and reports. The XML import targets a specific company. |
| **Voucher Type** | A classification of vouchers in Tally (Purchase, Sales, Journal, Receipt, Payment, Contra, etc.). |
| **ALLLEDGERENTRIES.LIST** | The XML tag in Tally import format that represents a single debit or credit line in a voucher. |
| **ISDEEMEDPOSITIVE** | A Tally XML field that indicates whether an entry is a debit (`Yes`) or credit (`No`). |
| **SVCURRENTCOMPANY** | The XML tag specifying which Tally company the data should be imported into. Must match exactly. |

---

## 6. Abbreviations Quick Reference

| Abbreviation | Full Form |
|-------------|-----------|
| CA | Chartered Accountant |
| GST | Goods and Services Tax |
| GSTIN | GST Identification Number |
| CGST | Central Goods and Services Tax |
| SGST | State Goods and Services Tax |
| IGST | Integrated Goods and Services Tax |
| HSN | Harmonized System of Nomenclature |
| SAC | Services Accounting Code |
| ITC | Input Tax Credit |
| RCM | Reverse Charge Mechanism |
| PAN | Permanent Account Number |
| OCR | Optical Character Recognition |
| LLM | Large Language Model |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| RLS | Row-Level Security |
| ORM | Object-Relational Mapping |
| SSR | Server-Side Rendering |
| ISR | Incremental Static Regeneration |
| MVP | Minimum Viable Product |
| CRUD | Create, Read, Update, Delete |
| CI/CD | Continuous Integration / Continuous Deployment |
| XML | Extensible Markup Language |
| PDF | Portable Document Format |
| UI | User Interface |
| UX | User Experience |
| NPS | Net Promoter Score |
