import { requireAdmin } from '@/lib/require-admin'
import { fetchAll } from '@/lib/fetch-all'
import CreateJoke from '@/components/CreateJoke'
import JokeRow from '@/components/JokeRow'

type Joke = {
  id: number
  text: string | null
  author: string | null
  created_at: string
}

export default async function JokesAdminPage() {
  const { admin } = await requireAdmin()

  const [jokes, votes] = await Promise.all([
    fetchAll<Joke>(admin, 'jokes', 'id, text, author, created_at'),
    fetchAll<{ id: number; caption_id: number; vote_type: string }>(
      admin,
      'caption_votes',
      'id, caption_id, vote_type'
    ),
  ])

  const tally = new Map<number, { up: number; down: number }>()
  for (const v of votes) {
    const t = tally.get(v.caption_id) ?? { up: 0, down: 0 }
    if (v.vote_type === 'up') t.up++
    else t.down++
    tally.set(v.caption_id, t)
  }

  const rows = [...jokes].sort((a, b) => b.id - a.id)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Jokes ({jokes.length})</h1>
      <CreateJoke />
      <ul className="space-y-3">
        {rows.map((j) => {
          const t = tally.get(j.id) ?? { up: 0, down: 0 }
          return (
            <JokeRow
              key={j.id}
              id={j.id}
              text={j.text ?? ''}
              author={j.author ?? ''}
              createdAt={j.created_at}
              up={t.up}
              down={t.down}
            />
          )
        })}
      </ul>
    </div>
  )
}
