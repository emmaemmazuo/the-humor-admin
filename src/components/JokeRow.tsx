'use client'

import { useState, useTransition } from 'react'
import { updateJoke, deleteJoke } from '@/app/admin/jokes/actions'

export default function JokeRow({
  id,
  text,
  author,
  createdAt,
  up,
  down,
}: {
  id: number
  text: string
  author: string
  createdAt: string
  up: number
  down: number
}) {
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState(text)
  const [draftAuthor, setDraftAuthor] = useState(author)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const save = () => {
    setError(null)
    start(async () => {
      const r = await updateJoke(id, draftText, draftAuthor)
      if (r.error) {
        setError(r.error)
      } else {
        setEditing(false)
      }
    })
  }

  const remove = () => {
    const votes = up + down
    const msg = votes
      ? `Delete this joke and its ${votes} vote(s)? This cannot be undone.`
      : 'Delete this joke? This cannot be undone.'
    if (!confirm(msg)) return
    setError(null)
    start(async () => {
      const r = await deleteJoke(id)
      if (r.error) setError(r.error)
    })
  }

  return (
    <li className="bg-white border rounded-lg p-4">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
          <input
            value={draftAuthor}
            onChange={(e) => setDraftAuthor(e.target.value)}
            maxLength={100}
            placeholder="Author"
            className="w-full border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={pending}
              className="px-3 py-1 rounded bg-black text-white text-sm disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setDraftText(text)
                setDraftAuthor(author)
                setError(null)
              }}
              className="px-3 py-1 rounded border text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {author === 'Gemini' && (
            <span style={{ fontSize: 12, background: "#f3e8ff", color: "#7e22ce", padding: "2px 8px", borderRadius: 9999 }}>
              ✨ AI-generated
            </span>
          )}
          <p className="mt-1">{text}</p>
          <p className="text-xs text-gray-500 mt-1">
            #{id} · {author ? `by ${author}` : 'no author'} ·{' '}
            {createdAt.slice(0, 10)} · {up}↑ {down}↓
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setEditing(true)}
              className="text-sm underline"
            >
              Edit
            </button>
            <button
              onClick={remove}
              disabled={pending}
              className="text-sm underline text-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </li>
  )
}
