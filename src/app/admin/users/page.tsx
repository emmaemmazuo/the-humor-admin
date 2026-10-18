import { requireAdmin } from '@/lib/require-admin'
import { fetchAll } from '@/lib/fetch-all'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  is_superadmin: boolean
  created_at: string
}

export default async function UsersPage() {
  const { admin } = await requireAdmin()

  const [profiles, votes] = await Promise.all([
    fetchAll<Profile>(
      admin,
      'profiles',
      'id, email, full_name, is_superadmin, created_at',
      'created_at'
    ),
    fetchAll<{ id: number; user_id: string }>(
      admin,
      'caption_votes',
      'id, user_id'
    ),
  ])

  const voteCount = new Map<string, number>()
  for (const v of votes) {
    voteCount.set(v.user_id, (voteCount.get(v.user_id) ?? 0) + 1)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Users</h1>
      <p className="text-sm text-gray-500 mb-6">
        Read-only. There is deliberately no way to grant admin from this app.
      </p>
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Votes cast</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">{p.email}</td>
                <td className="p-3">{p.full_name ?? '–'}</td>
                <td className="p-3">{p.created_at.slice(0, 10)}</td>
                <td className="p-3">{voteCount.get(p.id) ?? 0}</td>
                <td className="p-3">
                  {p.is_superadmin ? (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                      superadmin
                    </span>
                  ) : (
                    'user'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
