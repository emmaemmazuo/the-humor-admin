import { createClient } from '@supabase/supabase-js'

// Server-only. Secret key for the course database; never import in a client component.
export function createCourseClient() {
  return createClient(
    process.env.COURSE_SUPABASE_URL!,
    process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
