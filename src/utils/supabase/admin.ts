import { createClient } from '@supabase/supabase-js'

// Server-only. Uses the secret key, which bypasses RLS.
// Never import this into a 'use client' file.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
