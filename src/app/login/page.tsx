'use client'

import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-2">Admin sign in</h1>
      <p className="text-gray-500 mb-6">Authorized administrators only.</p>
      <button
        onClick={handleGoogleLogin}
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
      >
        Sign in with Google
      </button>
    </div>
  )
}
