import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { fetchAll } from '@/lib/fetch-all'

type Vote = {
  id: number
  caption_id: number
  user_id: string
  vote_type: 'up' | 'down'
  created_at: string
}

export default async function VotesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { admin } = await requireAdmin()
  const { type } = await searchParams
  const filter = type === 'up' || type === 'down' ? type : null

  let query = admin
    .from('caption_votes')
    .select('id, caption_id, user_id, vote_type, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .limit(200)
  if (filter) query = query.eq('vote_type', filter)

  const { data, count, error } = await query
  const votes = (data ?? []) as unknown as Vote[]

  const [jokes, profiles] = await Promise.all([
    fetchAll<{ id: number; text: string | null }>(admin, 'jokes', 'id, text'),
    fetchAll<{ id: string; email: string | null }>(
      admin,
      'profiles',
      'id, email',
      'created_at'
    ),
  ])
  const jokeText = new Map(jokes.map((j) => [j.id, j.text ?? '']))
  const emailOf = new Map(profiles.map((p) => [p.id, p.email ?? p.id]))

  const tab = (label: string, value: string | null) => {
    const active = filter === value
    return (
      <Link
        href={value ? `/admin/votes?type=${value}` : '/admin/votes'}
        className={`px-3 py-1 rounded text-sm border ${
          active ? 'bg-black text-white' : 'bg-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Votes</h1>
      <p className="text-sm text-gray-500 mb-4">
        Read-only. Showing the latest {votes.length} of {count ?? votes.length}.
      </p>
      <div className="flex gap-2 mb-4">
        {tab('All', null)}
        {tab('Up', 'up')}
        {tab('Down', 'down')}
      </div>
      {error && <p className="text-red-600 mb-4">{error.message}</p>}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="p-3">When</th>
              <th className="p-3">Voter</th>
              <th className="p-3">Vote</th>
              <th className="p-3">Joke</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">
                  {v.created_at.slice(0, 16).replace('T', ' ')}
                </td>
                <td className="p-3">{emailOf.get(v.user_id) ?? v.user_id}</td>
                <td className="p-3">{v.vote_type === 'up' ? '👍' : '👎'}</td>
                <td className="p-3">
                  {(jokeText.get(v.caption_id) ?? '').slice(0, 80)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
