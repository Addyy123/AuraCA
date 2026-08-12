# System Architecture

**Document Version:** 1.1  
**Last Updated:** August 2026

---

## 1. Technology Stack

### Frontend

| Technology | Version | Purpose | Why Chosen |
|-----------|---------|---------|------------|
| Next.js | 15 | Full-stack React framework | Server components, route handlers, server actions — single codebase for frontend + API |
| TypeScript | 5.x | Type safety | Catch errors at compile time, better DX, self-documenting code |
| Tailwind CSS | 3.x | Utility-first styling | Rapid UI development, consistent design system |
| shadcn/ui | latest | Component library | Beautiful, accessible components built on Radix UI, fully customizable |
| React Hook Form | 7.x | Form management | Performant forms with minimal re-renders |
| Zustand | 4.x | Client state | Lightweight, no boilerplate, scales well |
| TanStack Table | 8.x | Data tables | Headless, sortable, filterable tables for invoice lists |
| Recharts | 2.x | Charts | Dashboard visualizations (throughput, status breakdown) |
| Sonner | latest | Toast notifications | Clean notification UX |
| Lucide | latest | Icons | Consistent, lightweight icon set |

### Backend

| Technology | Purpose | Why Chosen |
|-----------|---------|------------|
| Next.js Route Handlers | REST API endpoints | Co-located with frontend, no separate server needed |
| Next.js Server Actions | Form mutations | Type-safe server mutations with progressive enhancement |
| Prisma ORM | Database access | Type-safe queries, auto-generated types, migration management |
| Zod | Runtime validation | Schema validation for API inputs, AI output parsing |

### Platform Services

| Service | Purpose | Why Chosen |
|---------|---------|------------|
| Supabase Auth | Authentication | Built-in email/password, JWT tokens, session management, RLS support |
| Supabase PostgreSQL | Database | Managed Postgres, row-level security, realtime subscriptions |
| Supabase Storage | File storage | S3-compatible, integrated with auth policies, direct upload support |

### Processing Services

| Service | Purpose | Why Chosen |
|---------|---------|------------|
| `pdf-parse` | Text extraction from text-based PDFs | Lightweight, no external API calls |
| Tesseract.js | OCR for scanned documents | Open-source, runs in Node.js, no API cost |
| Sharp | Image preprocessing | Fast image manipulation (grayscale, denoise, sharpen) |
| Groq API (LLaMA 3.3 70B) | AI extraction & ledger suggestion | Fast inference (~500 tokens/sec), cost-effective, good accuracy |

**Why Groq over OpenAI/Anthropic?**
- 10x faster inference speed for structured extraction tasks
- Significantly lower cost per token for high-volume processing
- LLaMA 3.3 70B provides excellent JSON extraction accuracy
- No vendor lock-in — can switch to other LLM providers if needed

### Deployment

| Service | Purpose |
|---------|---------|
| Vercel | Application hosting, CI/CD, edge functions |
| GitHub | Version control, code review, issue tracking |

---

## 2. High-Level Architecture

```mermaid
flowchart TD
    subgraph Client["🖥️ Client Browser"]
        A["User Interface\n(Next.js App Router)"]
    end

    subgraph Server["⚙️ Next.js Server"]
        B["Route Handlers\n(REST API)"]
        C["Server Actions\n(Mutations)"]
        D["Middleware\n(Auth, Validation)"]
    end

    subgraph Processing["🔄 Processing Pipeline"]
        E["Upload Service"]
        F["OCR Service\n(pdf-parse / Tesseract)"]
        G["Image Preprocessor\n(Sharp)"]
        H["AI Extraction Service\n(Groq API)"]
        I["Validation Engine"]
        J["Ledger Suggestion Engine"]
        K["Voucher Generator"]
        L["XML Generator"]
    end

    subgraph External["☁️ External Services"]
        M["Supabase Auth"]
        N["Supabase PostgreSQL"]
        O["Supabase Storage"]
        P["Groq LLM API"]
    end

    A <--> B
    A <--> C
    B --> D
    C --> D
    D --> E
    E --> O
    E --> F
    F --> G
    G --> F
    F --> H
    H --> P
    H --> I
    I --> J
    J --> K
    K --> L
    D --> M
    B --> N
    C --> N
```

---

## 3. Sequence Diagram — Invoice Processing Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js Frontend
    participant API as Route Handler
    participant Store as Supabase Storage
    participant DB as PostgreSQL
    participant OCR as OCR Service
    participant AI as Groq API
    participant Val as Validation Engine
    participant Vouch as Voucher Generator

    User->>UI: Upload invoice file
    UI->>API: POST /api/invoices/upload
    API->>Store: Store file
    Store-->>API: File URL
    API->>DB: Create invoice record (status: uploaded)
    API-->>UI: Upload success + invoice ID

    Note over API: Processing Pipeline Begins

    API->>OCR: Extract text from document
    OCR->>OCR: Detect type (text PDF vs scan)
    alt Text-based PDF
        OCR->>OCR: pdf-parse extraction
    else Scanned / Image
        OCR->>OCR: Sharp preprocessing
        OCR->>OCR: Tesseract OCR
    end
    OCR-->>API: Raw text output
    API->>DB: Save OCR text (status: processing)

    API->>AI: Send OCR text + extraction prompt
    AI-->>API: Structured JSON response
    API->>DB: Save extracted fields + confidence scores

    API->>Val: Run validation rules
    Val->>Val: GSTIN check
    Val->>Val: Arithmetic check
    Val->>Val: Duplicate check
    Val->>Val: Mandatory fields check
    Val-->>API: Validation results
    API->>DB: Save validation results (status: extracted)

    API->>Vouch: Generate voucher draft
    Vouch-->>API: Voucher + ledger suggestions
    API->>DB: Save voucher (status: needs_review)
    API-->>UI: Processing complete

    User->>UI: Review extracted data
    User->>UI: Edit if needed
    User->>API: POST /api/invoices/:id/approve
    API->>DB: Update status (status: approved)

    User->>API: POST /api/invoices/:id/export-xml
    API->>API: Generate Tally XML
    API->>DB: Save export record (status: exported)
    API-->>UI: Download XML file
```

---

## 4. Application Structure

```text
ca-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx          # Invoice list
│   │   │   │   ├── upload/page.tsx   # Upload screen
│   │   │   │   └── [id]/page.tsx     # Invoice detail + review
│   │   │   ├── exports/page.tsx      # Export history
│   │   │   ├── clients/page.tsx      # Client management
│   │   │   └── settings/page.tsx     # Firm settings
│   │   ├── api/                      # Route handlers
│   │   │   ├── auth/
│   │   │   ├── invoices/
│   │   │   ├── clients/
│   │   │   ├── companies/
│   │   │   └── exports/
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── layout/                   # Header, Sidebar, Footer
│   │   ├── forms/                    # Reusable form components
│   │   └── data-display/             # Tables, cards, charts
│   │
│   ├── features/                     # Feature modules (see §5)
│   │   ├── invoice/
│   │   ├── ocr/
│   │   ├── ai/
│   │   ├── validation/
│   │   ├── gst/
│   │   ├── voucher/
│   │   ├── tally/
│   │   ├── audit/
│   │   └── reports/
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-invoice.ts
│   │   └── use-upload.ts
│   │
│   ├── lib/                          # Core utilities
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Auth middleware
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── groq.ts                   # Groq client config
│   │   └── utils.ts                  # General utilities
│   │
│   ├── services/                     # Business logic layer
│   │   ├── upload.service.ts
│   │   ├── ocr.service.ts
│   │   ├── ai-extraction.service.ts
│   │   ├── validation.service.ts
│   │   ├── ledger.service.ts
│   │   ├── voucher.service.ts
│   │   └── xml-export.service.ts
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── invoice.ts
│   │   ├── voucher.ts
│   │   ├── validation.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   └── utils/                        # Pure utility functions
│       ├── gstin-validator.ts
│       ├── date-parser.ts
│       ├── xml-builder.ts
│       └── confidence-scorer.ts
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Migration history
│   └── seed.ts                       # Seed data
│
├── public/                           # Static assets
│   ├── logo.svg
│   └── favicon.ico
│
├── .env.example                      # Environment variable template
├── .env.local                        # Local environment (gitignored)
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
└── README.md
```

---

## 5. Feature Module Organization

Each feature module follows a consistent internal structure:

```text
features/
├── invoice/
│   ├── components/           # Feature-specific UI components
│   │   ├── InvoiceUploader.tsx
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceDetail.tsx
│   │   └── InvoiceReview.tsx
│   ├── actions/              # Server actions
│   │   ├── upload-invoice.ts
│   │   └── approve-invoice.ts
│   ├── hooks/                # Feature-specific hooks
│   │   └── use-invoice-list.ts
│   ├── utils/                # Feature-specific utilities
│   │   └── invoice-helpers.ts
│   └── index.ts              # Public exports
│
├── ocr/
│   ├── services/
│   │   ├── pdf-extractor.ts
│   │   ├── image-preprocessor.ts
│   │   └── tesseract-runner.ts
│   └── index.ts
│
├── ai/
│   ├── prompts/
│   │   ├── extraction-prompt.ts
│   │   └── ledger-prompt.ts
│   ├── services/
│   │   ├── groq-client.ts
│   │   └── response-parser.ts
│   ├── schemas/
│   │   └── extraction-schema.ts   # Zod validation for AI output
│   └── index.ts
│
├── validation/
│   ├── rules/
│   │   ├── gstin-rule.ts
│   │   ├── arithmetic-rule.ts
│   │   ├── duplicate-rule.ts
│   │   └── mandatory-fields-rule.ts
│   ├── engine.ts                   # Rule runner
│   └── index.ts
│
├── voucher/
│   ├── generators/
│   │   ├── purchase-voucher.ts
│   │   └── sales-voucher.ts
│   ├── services/
│   │   └── ledger-mapper.ts
│   └── index.ts
│
├── tally/
│   ├── templates/
│   │   └── voucher-xml.ts
│   ├── services/
│   │   └── xml-generator.ts
│   └── index.ts
│
├── audit/
│   ├── services/
│   │   └── audit-logger.ts
│   └── index.ts
│
└── reports/
    ├── components/
    │   ├── DashboardWidgets.tsx
    │   └── StatusChart.tsx
    └── index.ts
```

---

## 6. Processing Pipeline Detail

```mermaid
flowchart LR
    subgraph Stage1["Stage 1: Ingest"]
        A["Accept File"] --> B["Validate Type & Size"]
        B --> C["Store in Supabase Storage"]
        C --> D["Create Invoice Record"]
    end

    subgraph Stage2["Stage 2: Extract"]
        E["Detect Document Type"] --> F{"Text-based PDF?"}
        F -->|Yes| G["pdf-parse"]
        F -->|No| H["Sharp Preprocessing"]
        H --> I["Tesseract OCR"]
        G --> J["Raw Text Output"]
        I --> J
    end

    subgraph Stage3["Stage 3: Understand"]
        K["Build Extraction Prompt"] --> L["Call Groq API"]
        L --> M["Parse JSON Response"]
        M --> N["Validate with Zod Schema"]
    end

    subgraph Stage4["Stage 4: Validate"]
        O["GSTIN Format"] --> S["Validation Report"]
        P["Arithmetic Checks"] --> S
        Q["Duplicate Detection"] --> S
        R["Mandatory Fields"] --> S
    end

    subgraph Stage5["Stage 5: Generate"]
        T["Map to Ledgers"] --> U["Create Voucher Draft"]
        U --> V["Set for Review"]
    end

    subgraph Stage6["Stage 6: Export"]
        W["User Approves"] --> X["Generate Tally XML"]
        X --> Y["Store Export Record"]
    end

    D --> E
    J --> K
    N --> O
    S --> T
    V --> W
```

---

## 7. Environment Variables

| Variable | Description | Example | Required |
|----------|------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOi...` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJhbGciOi...` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ |
| `DIRECT_URL` | Direct Postgres URL (for Prisma migrations) | `postgresql://user:pass@host:5432/db` | ✅ |
| `GROQ_API_KEY` | Groq API authentication key | `gsk_abc123...` | ✅ |
| `GROQ_MODEL` | Groq model identifier | `llama-3.3-70b-versatile` | ❌ (default provided) |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` | ❌ |
| `OCR_CONFIDENCE_THRESHOLD` | Minimum OCR confidence score | `0.80` | ❌ (default: 0.80) |
| `AI_CONFIDENCE_THRESHOLD` | Minimum AI extraction confidence | `0.85` | ❌ (default: 0.85) |
| `MAX_FILE_SIZE_MB` | Maximum upload file size in MB | `10` | ❌ (default: 10) |
| `MAX_RETRY_ATTEMPTS` | Maximum processing retry attempts | `3` | ❌ (default: 3) |

---

## 8. Deployment Architecture

```mermaid
flowchart TD
    subgraph Users["👥 Users"]
        U["Browser / Desktop"]
    end

    subgraph Vercel["▲ Vercel"]
        V1["Edge Network (CDN)"]
        V2["Serverless Functions\n(API Routes)"]
        V3["ISR / SSR Pages"]
    end

    subgraph Supabase["🟢 Supabase Cloud"]
        S1["Auth Service"]
        S2["PostgreSQL Database"]
        S3["Storage (S3)"]
        S4["Row Level Security"]
    end

    subgraph Groq["🤖 Groq Cloud"]
        G1["LLaMA 3.3 70B\nInference API"]
    end

    U --> V1
    V1 --> V2
    V1 --> V3
    V2 --> S1
    V2 --> S2
    V2 --> S3
    V2 --> G1
    S2 --> S4
```

---

## 9. Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Page load (initial) | < 3s | Lighthouse LCP |
| Page navigation (client) | < 500ms | Route transition time |
| File upload (10 MB) | < 2s | Upload completion time |
| OCR processing (text PDF) | < 3s | End-to-end extraction |
| OCR processing (scanned image) | < 15s | End-to-end extraction |
| AI extraction (Groq) | < 8s | API call round trip |
| Validation engine | < 1s | All rules execution |
| Voucher generation | < 500ms | Draft creation time |
| XML export generation | < 1s | File generation time |
| Database queries | < 200ms | P95 query time |

---

## 10. Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Next.js App
    participant MW as Middleware
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    User->>App: Login (email + password)
    App->>Auth: signInWithPassword()
    Auth-->>App: JWT access token + refresh token
    App->>App: Store in httpOnly cookie

    User->>App: Access protected page
    App->>MW: Request with cookie
    MW->>Auth: Verify JWT
    Auth-->>MW: User session
    MW->>DB: Check user role + firm_id
    DB-->>MW: Authorization result
    MW-->>App: Allow / Deny
```

### Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | HTTPS everywhere | Vercel enforced |
| Authentication | JWT + refresh tokens | Supabase Auth |
| Authorization | Row-level security | Supabase RLS policies |
| Input validation | Server-side schema validation | Zod schemas on all inputs |
| File security | Type + size validation | Whitelist extensions, max 10 MB |
| SQL injection | Parameterized queries | Prisma ORM (no raw SQL) |
| XSS prevention | Content Security Policy | Next.js headers config |
| CSRF protection | SameSite cookies | Next.js middleware |
| Audit trail | Action logging | Audit log table with before/after values |
| Data isolation | Firm-scoped queries | All queries filtered by `firm_id` |
