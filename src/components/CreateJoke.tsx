'use client'

import { useState, useTransition } from 'react'
import { createJoke } from '@/app/admin/jokes/actions'

export default function CreateJoke() {
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = () => {
    setError(null)
    start(async () => {
      const r = await createJoke(text, author)
      if (r.error) {
        setError(r.error)
      } else {
        setText('')
        setAuthor('')
      }
    })
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      <p className="font-semibold mb-2">Add a joke</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Joke text"
        className="w-full border rounded px-3 py-2 mb-2"
      />
      <div className="flex gap-2 items-center">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={100}
          placeholder="Author (use Gemini to mark it AI-generated)"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={submit}
          disabled={pending}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
