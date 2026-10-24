import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/require-admin'
import { createCourseClient } from '@/utils/supabase/course'
import { getResource, type Column } from '@/lib/resources'
import ResourceRow from '@/components/ResourceRow'
import CreateRow from '@/components/CreateRow'
import type { FormField } from '@/components/FieldForm'

const PAGE_SIZE = 25
type Row = Record<string, unknown>

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s)

function Cell({
  col,
  value,
  label,
}: {
  col: Column
  value: unknown
  label?: string
}): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">–</span>
  }
  const text = String(value)
  switch (col.kind) {
    case 'bool':
      return <span>{value === true ? '✓' : '–'}</span>
    case 'date':
      return <span className="whitespace-nowrap">{text.slice(0, 10)}</span>
    case 'image': {
      const url = col.lookup ? label : text
      if (!url || !url.startsWith('http')) return <span className="text-gray-400">–</span>
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={url}
          alt=""
          loading="lazy"
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
        />
      )
    }
    case 'long':
      return <span title={text}>{truncate(text, 120)}</span>
    case 'id':
      return <span className="font-mono text-xs">{text.slice(0, 8)}</span>
    default:
      return <span>{col.lookup ? label || text : text}</span>
  }
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await requireAdmin()
  const { slug } = await params
  const { page: pageParam, q: qParam } = await searchParams
  const resource = getResource(slug)
  if (!resource) notFound()

  const db = createCourseClient()
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const q = (qParam ?? '').trim().slice(0, 100)

  // Select only what the page needs (avoids huge columns such as embeddings).
  const selectCols = Array.from(
    new Set(['id', ...resource.columns.map((c) => c.name), ...resource.fields.map((f) => f.name)])
  ).join(', ')

  let query = db
    .from(resource.table)
    .select(selectCols, { count: resource.big ? 'estimated' : 'exact' })
    .order(resource.orderBy, { ascending: resource.ascending ?? true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (q && resource.search) query = query.ilike(resource.search, `%${q}%`)

  const { data, count, error } = await query
  const rows = (data ?? []) as unknown as Row[]

  // Human-readable labels for foreign keys (chain names, model names, image URLs...).
  const labels: Record<string, Map<string, string>> = {}
  for (const col of resource.columns) {
    if (!col.lookup) continue
    const ids = Array.from(
      new Set(rows.map((r) => r[col.name]).filter((v) => v !== null && v !== undefined))
    ) as (string | number)[]
    const map = new Map<string, string>()
    if (ids.length) {
      const { data: found } = await db
        .from(col.lookup.table)
        .select(`id, ${col.lookup.label}`)
        .in('id', ids)
      for (const f of (found ?? []) as unknown as Row[]) {
        map.set(String(f.id), String(f[col.lookup.label] ?? ''))
      }
    }
    labels[col.name] = map
  }

  // Dropdown options for select fields.
  const options: Record<string, { value: string; label: string }[]> = {}
  for (const f of resource.fields) {
    const src = f.options
    if (f.type !== 'select' || !src) continue
    const { data: opts } = await db
      .from(src.table)
      .select(`${src.value}, ${src.label}`)
      .order(src.label)
      .limit(500)
    options[f.name] = ((opts ?? []) as unknown as Row[]).map((o) => ({
      value: String(o[src.value]),
      label: String(o[src.label]),
    }))
  }
  const formFields: FormField[] = resource.fields.map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    required: f.required,
    options: options[f.name],
  }))

  const editable = resource.can.update || resource.can.delete
  const colSpan = resource.columns.length + (editable ? 1 : 0)
  const qs = q ? `&q=${encodeURIComponent(q)}` : ''
  const total = count ?? null

  return (
    <div>
      <Link href="/admin/data" className="text-sm underline text-gray-600">
        ← All course data
      </Link>
      <h1 className="text-2xl font-bold mt-2">{resource.title}</h1>
      <p className="text-sm text-gray-500 mt-1 mb-4">{resource.description}</p>

      {resource.search && (
        <form method="get" className="flex gap-2 mb-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search…"
            className="border rounded px-3 py-2 bg-white text-sm"
          />
          <button className="px-3 py-2 rounded border text-sm">Search</button>
          {q && (
            <Link href={`/admin/data/${slug}`} className="px-3 py-2 text-sm underline">
              Clear
            </Link>
          )}
        </form>
      )}

      {resource.can.create && <CreateRow slug={slug} fields={formFields} />}

      {error && <p className="text-red-600 mb-4">{error.message}</p>}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              {resource.columns.map((c) => (
                <th key={c.name} className="p-3">
                  {c.label}
                </th>
              ))}
              {editable && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = (
                <>
                  {resource.columns.map((c) => (
                    <td key={c.name} className="p-3">
                      <Cell
                        col={c}
                        value={row[c.name]}
                        label={
                          c.lookup ? labels[c.name]?.get(String(row[c.name])) : undefined
                        }
                      />
                    </td>
                  ))}
                </>
              )
              if (!editable) {
                return (
                  <tr key={String(row.id)} className="border-b align-top">
                    {cells}
                  </tr>
                )
              }
              return (
                <ResourceRow
                  key={String(row.id)}
                  slug={slug}
                  id={Number(row.id)}
                  cells={cells}
                  colSpan={colSpan}
                  fields={formFields}
                  initial={Object.fromEntries(resource.fields.map((f) => [f.name, row[f.name]]))}
                  canUpdate={resource.can.update}
                  canDelete={resource.can.delete}
                />
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="p-6 text-center text-gray-500">
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">
          Page {page}
          {total !== null && ` · ${resource.big ? 'about ' : ''}${total.toLocaleString('en-US')} rows`}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/data/${slug}?page=${page - 1}${qs}`}
              className="px-3 py-1 rounded border bg-white"
            >
              Previous
            </Link>
          )}
          {rows.length === PAGE_SIZE && (
            <Link
              href={`/admin/data/${slug}?page=${page + 1}${qs}`}
              className="px-3 py-1 rounded border bg-white"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
