# Environment & Setup Guide

**Document Version:** 1.0  
**Last Updated:** August 2026

---

## 1. Prerequisites

| Requirement | Minimum Version | Check Command | Install Guide |
|------------|----------------|---------------|---------------|
| **Node.js** | 18.17+ | `node --version` | [nodejs.org](https://nodejs.org) |
| **npm** | 9.0+ | `npm --version` | Included with Node.js |
| **Git** | 2.30+ | `git --version` | [git-scm.com](https://git-scm.com) |
| **Supabase Account** | — | — | [supabase.com](https://supabase.com) |
| **Groq API Key** | — | — | [console.groq.com](https://console.groq.com) |

### Optional (Recommended)

| Tool | Purpose | Install |
|------|---------|---------|
| **Supabase CLI** | Local development, migrations | `npm install -g supabase` |
| **VS Code** | Recommended editor | [code.visualstudio.com](https://code.visualstudio.com) |
| **Prisma VS Code Extension** | Schema highlighting, formatting | VS Code Marketplace |
| **Tailwind CSS IntelliSense** | Class autocomplete | VS Code Marketplace |

---

## 2. Environment Variables

### Complete Reference

Create a `.env.local` file in the project root with the following variables:

```env
# ─────────────────────────────────────
# Supabase Configuration (Required)
# ─────────────────────────────────────

# Your Supabase project URL
# Find at: Supabase Dashboard → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase anonymous/public key (safe for client-side)
# Find at: Supabase Dashboard → Settings → API → anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key (server-side only, DO NOT expose to client)
# Find at: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ─────────────────────────────────────
# Database Configuration (Required)
# ─────────────────────────────────────

# PostgreSQL connection string (pooled connection)
# Find at: Supabase Dashboard → Settings → Database → Connection String → URI
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct PostgreSQL connection (for Prisma migrations only)
# Find at: Supabase Dashboard → Settings → Database → Connection String → URI (direct)
DIRECT_URL=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# ─────────────────────────────────────
# AI Service Configuration (Required)
# ─────────────────────────────────────

# Groq API key for AI-powered extraction
# Get at: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_api_key_here

# ─────────────────────────────────────
# Optional Configuration
# ─────────────────────────────────────

# Groq model to use for extraction (default: llama-3.3-70b-versatile)
GROQ_MODEL=llama-3.3-70b-versatile

# Application base URL (default: http://localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Minimum OCR confidence score to proceed (default: 0.80)
OCR_CONFIDENCE_THRESHOLD=0.80

# Minimum AI extraction confidence for auto-approve (default: 0.85)
AI_CONFIDENCE_THRESHOLD=0.85

# Maximum file upload size in MB (default: 10)
MAX_FILE_SIZE_MB=10

# Maximum processing retry attempts (default: 3)
MAX_RETRY_ATTEMPTS=3
```

### Variable Categories

| Variable | Client-Safe? | Notes |
|----------|-------------|-------|
| `NEXT_PUBLIC_*` | ✅ Yes | Bundled into client JavaScript |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | Server-only, bypasses RLS |
| `DATABASE_URL` | ❌ No | Server-only, contains credentials |
| `DIRECT_URL` | ❌ No | Server-only, for migrations |
| `GROQ_API_KEY` | ❌ No | Server-only, API credentials |
| All others without `NEXT_PUBLIC_` | ❌ No | Server-only |

---

## 3. Step-by-Step Local Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/ca-ai.git
cd ca-ai
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a strong database password (save it — you'll need it)
3. Select a region close to your users (e.g., `ap-south-1` for India)
4. Wait for the project to finish provisioning (~2 minutes)

### Step 4: Get Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Settings** → **Database** → **Connection string**
   - Copy the **URI (pooled)** → `DATABASE_URL` (append `?pgbouncer=true`)
   - Copy the **URI (direct)** → `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with your database password

### Step 5: Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Go to **API Keys** → **Create API Key**
4. Copy the key → `GROQ_API_KEY`

### Step 6: Create Environment File

```bash
# Copy the template
cp .env.example .env.local

# Edit with your credentials
# Windows: notepad .env.local
# Mac/Linux: nano .env.local
```

Fill in all the values from Steps 4 and 5.

### Step 7: Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates tables in your database)
npx prisma migrate dev
```

### Step 8: Seed Initial Data (Optional)

```bash
npx prisma db seed
```

This creates a demo firm, admin user, and sample client.

### Step 9: Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 4. Supabase Configuration

### Storage Bucket Setup

Create a storage bucket for invoice documents:

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**
3. Name: `invoices`
4. Public: **No** (private bucket)
5. File size limit: **10 MB**
6. Allowed MIME types: `application/pdf, image/jpeg, image/png`

### Storage Policy

Create a policy so users can only access their firm's files:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload invoices"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
  );

-- Allow users to read their own uploads
CREATE POLICY "Users can read own invoices"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
  );
```

### Auth Configuration

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure email templates:
   - **Confirm Signup** — customize welcome email
   - **Reset Password** — customize reset email
4. Go to **Authentication** → **URL Configuration**
   - Site URL: `http://localhost:3000` (dev) or your production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`

### Row-Level Security (RLS)

Enable RLS on all tables after running migrations:

```sql
-- Enable RLS on all application tables
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE xml_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their firm's data
CREATE POLICY "Firm isolation for invoices"
  ON invoices
  FOR ALL
  USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
  );

-- Repeat similar policies for all firm-scoped tables
```

---

## 5. Prisma Workflows

### Common Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx prisma generate` | Generate Prisma Client types | After schema changes |
| `npx prisma migrate dev` | Create and apply new migration | After schema changes (dev) |
| `npx prisma migrate dev --name <name>` | Named migration | After schema changes (dev) |
| `npx prisma migrate deploy` | Apply pending migrations | Production deployment |
| `npx prisma migrate reset` | Reset database (drop + recreate) | Dev only — resets all data |
| `npx prisma db push` | Push schema without migration | Prototyping only |
| `npx prisma db seed` | Run seed script | After reset or new setup |
| `npx prisma studio` | Open visual database browser | Debugging, data inspection |
| `npx prisma validate` | Validate schema syntax | Before committing changes |
| `npx prisma format` | Format schema file | Before committing changes |

### Schema Change Workflow

```mermaid
flowchart TD
    A["Edit schema.prisma"] --> B["npx prisma validate"]
    B --> C{"Valid?"}
    C -->|No| A
    C -->|Yes| D["npx prisma format"]
    D --> E["npx prisma migrate dev --name description"]
    E --> F["npx prisma generate"]
    F --> G["Test changes"]
    G --> H["Commit schema + migration files"]
```

---

## 6. Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev server | `npm run dev` | Start development server on port 3000 |
| Build | `npm run build` | Create production build |
| Start | `npm run start` | Start production server |
| Lint | `npm run lint` | Run ESLint |
| Type check | `npx tsc --noEmit` | Run TypeScript compiler check |
| Test | `npm run test` | Run unit tests (Vitest) |
| Test watch | `npm run test:watch` | Run tests in watch mode |
| E2E tests | `npm run test:e2e` | Run Playwright E2E tests |
| Prisma Studio | `npx prisma studio` | Open database GUI |

---

## 7. VS Code Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Recommended VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 8. Common Setup Issues

### Issue: `prisma migrate dev` fails with connection error

**Cause:** Database URL is incorrect or database is not accessible.

**Fix:**
1. Double-check `DATABASE_URL` and `DIRECT_URL` in `.env.local`
2. Ensure you've replaced `[YOUR-PASSWORD]` with your actual password
3. Check if the Supabase project is running (not paused)
4. Try the direct URL: `DIRECT_URL` should use port `5432`, `DATABASE_URL` should use port `6543`

---

### Issue: `Module not found` errors after install

**Cause:** Dependencies not fully installed or node_modules corrupted.

**Fix:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue: Supabase Auth not working locally

**Cause:** Site URL or redirect URL misconfigured.

**Fix:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL to `http://localhost:3000`
3. Add `http://localhost:3000/auth/callback` to Redirect URLs

---

### Issue: Groq API returns 429 (rate limit)

**Cause:** Too many requests to Groq API in a short time.

**Fix:**
1. Free tier has limited requests per minute
2. Implement exponential backoff in the AI service
3. Consider upgrading to a paid Groq plan for production

---

### Issue: Tesseract.js is slow in development

**Cause:** First run downloads language data files (~10 MB).

**Fix:**
1. First OCR request will be slow (downloading models) — this is normal
2. Subsequent requests will be faster
3. Consider pre-loading the language data in a build script

---

### Issue: TypeScript errors after Prisma schema changes

**Cause:** Prisma Client types are out of date.

**Fix:**
```bash
npx prisma generate
```

This regenerates the TypeScript types from your schema.

---

## 9. Production Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Vercel will auto-detect Next.js

### Step 3: Set Environment Variables

Add all environment variables from `.env.local` to Vercel:
- Go to **Project Settings** → **Environment Variables**
- Add each variable
- Mark sensitive variables (API keys) as **Encrypted**

### Step 4: Configure Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npx prisma generate && next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### Step 5: Set Up Production Database

1. Create a separate Supabase project for production (or use the same one)
2. Update production environment variables in Vercel
3. Run migrations: `npx prisma migrate deploy`

### Step 6: Deploy

Vercel auto-deploys on push to `main`. For manual deploy:

```bash
npx vercel --prod
```
