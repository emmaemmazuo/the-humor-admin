'use client'

import { useState, useTransition, type ReactNode } from 'react'
import FieldForm, { type FormField } from '@/components/FieldForm'
import { updateRow, deleteRow } from '@/app/admin/data/actions'

export default function ResourceRow({
  slug,
  id,
  cells,
  colSpan,
  fields,
  initial,
  canUpdate,
  canDelete,
}: {
  slug: string
  id: number
  cells: ReactNode
  colSpan: number
  fields: FormField[]
  initial: Record<string, unknown>
  canUpdate: boolean
  canDelete: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const remove = () => {
    if (!confirm('Delete this row? This cannot be undone.')) return
    setError(null)
    start(async () => {
      const r = await deleteRow(slug, id)
      if (r.error) setError(r.error)
    })
  }

  return (
    <>
      <tr className="border-b align-top">
        {cells}
        <td className="p-3 whitespace-nowrap">
          {canUpdate && (
            <button
              onClick={() => {
                setEditing(!editing)
                setError(null)
              }}
              className="text-sm underline mr-3"
            >
              {editing ? 'Close' : 'Edit'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={remove}
              disabled={pending}
              className="text-sm underline text-red-600 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          {error && !editing && <p className="text-xs text-red-600 mt-1 max-w-[16rem]">{error}</p>}
        </td>
      </tr>
      {editing && (
        <tr className="border-b bg-gray-50">
          <td colSpan={colSpan} className="p-4">
            <FieldForm
              fields={fields}
              initial={initial}
              submitLabel="Save"
              pending={pending}
              error={error}
              onCancel={() => {
                setEditing(false)
                setError(null)
              }}
              onSubmit={(values) => {
                setError(null)
                start(async () => {
                  const r = await updateRow(slug, id, values)
                  if (r.error) setError(r.error)
                  else setEditing(false)
                })
              }}
            />
          </td>
        </tr>
      )}
    </>
  )
}
