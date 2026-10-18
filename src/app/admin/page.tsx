import { requireAdmin } from '@/lib/require-admin'
import { fetchAll } from '@/lib/fetch-all'

type Joke = {
  id: number
  text: string | null
  author: string | null
  created_at: string
}
type Vote = {
  id: number
  caption_id: number
  user_id: string
  vote_type: 'up' | 'down'
  created_at: string
}
type Profile = { id: string; email: string | null; created_at: string }

const isAI = (j: Joke) => j.author === 'Gemini'
const snippet = (s: string | null) => {
  const t = s ?? ''
  return t.length > 90 ? t.slice(0, 90) + '…' : t
}
const pct = (n: number) => `${Math.round(n * 100)}%`

function Card({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default async function Dashboard() {
  const { admin } = await requireAdmin()

  const [jokes, votes, profiles] = await Promise.all([
    fetchAll<Joke>(admin, 'jokes', 'id, text, author, created_at'),
    fetchAll<Vote>(
      admin,
      'caption_votes',
      'id, caption_id, user_id, vote_type, created_at'
    ),
    fetchAll<Profile>(admin, 'profiles', 'id, email, created_at', 'created_at'),
  ])

  // Votes per joke
  const tally = new Map<number, { up: number; down: number }>()
  for (const v of votes) {
    const t = tally.get(v.caption_id) ?? { up: 0, down: 0 }
    if (v.vote_type === 'up') t.up++
    else t.down++
    tally.set(v.caption_id, t)
  }

  const scored = jokes.map((joke) => {
    const t = tally.get(joke.id) ?? { up: 0, down: 0 }
    const total = t.up + t.down
    return {
      joke,
      up: t.up,
      down: t.down,
      total,
      net: t.up - t.down,
      // 1 = perfectly split, 0 = everyone agrees
      split: total ? 1 - Math.abs(t.up - t.down) / total : 0,
    }
  })

  const topJokes = [...scored]
    .filter((s) => s.total > 0)
    .sort((a, b) => b.net - a.net || b.total - a.total)
    .slice(0, 5)

  const divisive = [...scored]
    .filter((s) => s.total >= 2)
    .sort((a, b) => b.split - a.split || b.total - a.total)
    .slice(0, 5)

  // AI vs hand-written
  const group = (ai: boolean) => {
    const g = scored.filter((s) => isAI(s.joke) === ai)
    const up = g.reduce((n, s) => n + s.up, 0)
    const total = g.reduce((n, s) => n + s.total, 0)
    return {
      jokes: g.length,
      votes: total,
      perJoke: g.length ? total / g.length : 0,
      upRate: total ? up / total : 0,
    }
  }
  const ai = group(true)
  const human = group(false)

  // Votes per day, last 14 days (UTC)
  const perDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - (13 - i))
    return { date: d.toISOString().slice(0, 10), up: 0, down: 0 }
  })
  const dayIndex = new Map(perDay.map((d) => [d.date, d]))
  for (const v of votes) {
    const d = dayIndex.get(v.created_at.slice(0, 10))
    if (d) {
      if (v.vote_type === 'up') d.up++
      else d.down++
    }
  }
  const maxDay = Math.max(1, ...perDay.map((d) => d.up + d.down))

  // Most active voters
  const byUser = new Map<string, number>()
  for (const v of votes) byUser.set(v.user_id, (byUser.get(v.user_id) ?? 0) + 1)
  const emailOf = new Map(profiles.map((p) => [p.id, p.email ?? p.id]))
  const topVoters = [...byUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const ups = votes.filter((v) => v.vote_type === 'up').length

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card label="Users" value={profiles.length} />
        <Card
          label="Jokes"
          value={jokes.length}
          sub={`${jokes.filter(isAI).length} AI-generated`}
        />
        <Card label="Votes" value={votes.length} />
        <Card
          label="Upvote rate"
          value={votes.length ? pct(ups / votes.length) : '–'}
        />
        <Card
          label="Votes / joke"
          value={jokes.length ? (votes.length / jokes.length).toFixed(1) : '–'}
        />
      </div>

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-1">Votes per day (last 14 days)</h2>
        <p className="text-xs text-gray-500 mb-4">
          <span className="inline-block w-2 h-2 bg-green-400 mr-1" />
          up
          <span className="inline-block w-2 h-2 bg-red-300 ml-3 mr-1" />
          down
        </p>
        <div className="flex items-end gap-1 h-40">
          {perDay.map((d) => {
            const total = d.up + d.down
            return (
              <div
                key={d.date}
                className="flex-1 h-full flex flex-col justify-end"
                title={`${d.date}: ${d.up} up, ${d.down} down`}
              >
                <div
                  className="w-full flex flex-col"
                  style={{ height: `${(total / maxDay) * 100}%` }}
                >
                  <div className="bg-red-300" style={{ flexGrow: d.down }} />
                  <div className="bg-green-400" style={{ flexGrow: d.up }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {perDay.map((d) => (
            <span
              key={d.date}
              className="flex-1 text-center text-[10px] text-gray-400"
            >
              {d.date.slice(8)}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-3">AI vs. hand-written</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1"></th>
              <th>Jokes</th>
              <th>Votes</th>
              <th>Votes / joke</th>
              <th>Upvote rate</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="py-2">✨ AI (Gemini)</td>
              <td>{ai.jokes}</td>
              <td>{ai.votes}</td>
              <td>{ai.perJoke.toFixed(1)}</td>
              <td>{ai.votes ? pct(ai.upRate) : '–'}</td>
            </tr>
            <tr className="border-t">
              <td className="py-2">✍️ Hand-written</td>
              <td>{human.jokes}</td>
              <td>{human.votes}</td>
              <td>{human.perJoke.toFixed(1)}</td>
              <td>{human.votes ? pct(human.upRate) : '–'}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-3">🏆 Top jokes (net score)</h2>
          {topJokes.length === 0 && (
            <p className="text-sm text-gray-500">No votes yet.</p>
          )}
          <ol className="space-y-3">
            {topJokes.map((s) => (
              <li key={s.joke.id} className="text-sm">
                <span className="font-semibold">
                  {s.net > 0 ? '+' : ''}
                  {s.net}
                </span>{' '}
                <span className="text-gray-500">
                  ({s.up}↑ {s.down}↓)
                </span>
                <p>{snippet(s.joke.text)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold mb-1">⚖️ Most divisive</h2>
          <p className="text-xs text-gray-500 mb-3">
            Closest to a 50/50 split (at least 2 votes).
          </p>
          {divisive.length === 0 && (
            <p className="text-sm text-gray-500">Not enough votes yet.</p>
          )}
          <ol className="space-y-3">
            {divisive.map((s) => (
              <li key={s.joke.id} className="text-sm">
                <span className="font-semibold">{pct(s.split)} split</span>{' '}
                <span className="text-gray-500">
                  ({s.up}↑ {s.down}↓)
                </span>
                <p>{snippet(s.joke.text)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-3">🗳️ Most active voters</h2>
        {topVoters.length === 0 && (
          <p className="text-sm text-gray-500">No votes yet.</p>
        )}
        <ul className="text-sm space-y-1">
          {topVoters.map(([id, n]) => (
            <li key={id}>
              {emailOf.get(id) ?? id}: <span className="font-semibold">{n}</span>{' '}
              votes
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
