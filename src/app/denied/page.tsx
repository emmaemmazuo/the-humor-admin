import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LogoutButton from '@/components/LogoutButton'

export default async function DeniedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-2">Not authorized</h1>
      <p className="text-gray-600 mb-4">
        {user.email} is not an administrator.
      </p>
      <LogoutButton />
    </div>
  )
}
