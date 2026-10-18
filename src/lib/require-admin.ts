import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Call this at the top of EVERY admin page and EVERY admin server action.
// Not logged in -> /login. Logged in but not superadmin (or any error) -> /denied.
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_superadmin !== true) {
    redirect('/denied')
  }

  return { user, admin }
}
