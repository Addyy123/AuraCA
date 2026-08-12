import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! 

if (typeof window !== 'undefined') {
  throw new Error('Supabase admin client cannot be used on the client side.')
}

// Using the Service Role key to bypass RLS since we are running in a No-Auth single-tenant mode for now.
// Do NOT use this client on the frontend (browser). It should only be used in Server Actions or API routes.
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
