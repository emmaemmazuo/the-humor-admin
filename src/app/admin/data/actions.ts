'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/require-admin'
import { createCourseClient } from '@/utils/supabase/course'
import { getResource, type Resource } from '@/lib/resources'

type Result = { error?: string; success?: boolean }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Only fields listed in the resource config are ever written.
function build(resource: Resource, values: Record<string, unknown>) {
  const payload: Record<string, unknown> = {}
  for (const f of resource.fields) {
    const raw = values[f.name]
    if (f.type === 'boolean') {
      payload[f.name] = raw === true
      continue
    }
    const s = typeof raw === 'string' ? raw.trim() : ''
    if (!s) {
      if (f.required) return { error: `${f.label} is required.` }
      payload[f.name] = null
      continue
    }
    if (s.length > 5000) return { error: `${f.label} is too long.` }
    if (f.type === 'number') {
      const n = Number(s)
      if (!Number.isFinite(n)) return { error: `${f.label} must be a number.` }
      payload[f.name] = n
    } else if (f.type === 'uuid') {
      if (!UUID.test(s)) return { error: `${f.label} must be a valid UUID.` }
      payload[f.name] = s
    } else {
      payload[f.name] = s
    }
  }
  return { payload }
}

async function setup(slug: string, action: 'create' | 'update' | 'delete') {
  await requireAdmin()
  const resource = getResource(slug)
  if (!resource || !resource.can[action]) return { error: 'Not allowed.' }
  if (!process.env.COURSE_SUPABASE_URL || !process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'The course database is not configured.' }
  }
  const actor = process.env.COURSE_ACTOR_USER_ID
  if (action !== 'delete' && !actor) {
    return { error: 'COURSE_ACTOR_USER_ID is not set on the server.' }
  }
  return { resource, actor: actor ?? '', db: createCourseClient() }
}

export async function createRow(slug: string, values: Record<string, unknown>): Promise<Result> {
  const s = await setup(slug, 'create')
  if ('error' in s) return { error: s.error }
  const built = build(s.resource, values)
  if ('error' in built) return { error: built.error }

  const { error } = await s.db.from(s.resource.table).insert({
    ...built.payload,
    created_by_user_id: s.actor,
    modified_by_user_id: s.actor,
  })
  if (error) return { error: error.message }

  revalidatePath(`/admin/data/${slug}`)
  return { success: true }
}

export async function updateRow(
  slug: string,
  id: number,
  values: Record<string, unknown>
): Promise<Result> {
  const s = await setup(slug, 'update')
  if ('error' in s) return { error: s.error }
  if (!Number.isInteger(id)) return { error: 'Invalid row id.' }
  const built = build(s.resource, values)
  if ('error' in built) return { error: built.error }

  const { data, error } = await s.db
    .from(s.resource.table)
    .update({
      ...built.payload,
      modified_by_user_id: s.actor,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Row not found.' }

  revalidatePath(`/admin/data/${slug}`)
  return { success: true }
}

export async function deleteRow(slug: string, id: number): Promise<Result> {
  const s = await setup(slug, 'delete')
  if ('error' in s) return { error: s.error }
  if (!Number.isInteger(id)) return { error: 'Invalid row id.' }

  const { data, error } = await s.db
    .from(s.resource.table)
    .delete()
    .eq('id', id)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Row not found.' }

  revalidatePath(`/admin/data/${slug}`)
  return { success: true }
}
