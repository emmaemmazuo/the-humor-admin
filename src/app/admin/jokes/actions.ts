'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/require-admin'

function problem(text: string, author: string): string | null {
  const t = text.trim()
  if (t.length < 1 || t.length > 500) {
    return 'Text must be between 1 and 500 characters.'
  }
  if (author.trim().length > 100) {
    return 'Author must be 100 characters or fewer.'
  }
  return null
}

// Any spelling of "gemini" is stored as exactly "Gemini" so the AI badge matches.
function cleanAuthor(author: string): string | null {
  const a = author.trim()
  if (!a) return null
  return a.toLowerCase() === 'gemini' ? 'Gemini' : a
}

function refresh() {
  revalidatePath('/admin/jokes')
  revalidatePath('/admin')
}

export async function createJoke(text: string, author: string) {
  const { admin } = await requireAdmin()

  const bad = problem(text, author)
  if (bad) return { error: bad }

  const { error } = await admin
    .from('jokes')
    .insert({ text: text.trim(), author: cleanAuthor(author) })

  if (error) return { error: error.message }
  refresh()
  return { success: true }
}

export async function updateJoke(id: number, text: string, author: string) {
  const { admin } = await requireAdmin()

  if (!Number.isInteger(id)) return { error: 'Invalid joke id.' }
  const bad = problem(text, author)
  if (bad) return { error: bad }

  const { error } = await admin
    .from('jokes')
    .update({ text: text.trim(), author: cleanAuthor(author) })
    .eq('id', id)

  if (error) return { error: error.message }
  refresh()
  return { success: true }
}

export async function deleteJoke(id: number) {
  const { admin } = await requireAdmin()

  if (!Number.isInteger(id)) return { error: 'Invalid joke id.' }

  // Votes point at the joke, so they have to go first.
  const { error: votesError } = await admin
    .from('caption_votes')
    .delete()
    .eq('caption_id', id)
  if (votesError) return { error: votesError.message }

  const { error } = await admin.from('jokes').delete().eq('id', id)
  if (error) return { error: error.message }

  refresh()
  return { success: true }
}
