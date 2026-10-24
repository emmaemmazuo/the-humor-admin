'use client'

import { useState, useTransition } from 'react'
import FieldForm, { type FormField } from '@/components/FieldForm'
import { createRow } from '@/app/admin/data/actions'

export default function CreateRow({ slug, fields }: { slug: string; fields: FormField[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 px-4 py-2 rounded bg-black text-white text-sm"
      >
        + Add new
      </button>
    )
  }

  return (
    <div className="mb-6 bg-white border rounded-lg p-4">
      <FieldForm
        fields={fields}
        submitLabel="Create"
        pending={pending}
        error={error}
        onCancel={() => {
          setOpen(false)
          setError(null)
        }}
        onSubmit={(values) => {
          setError(null)
          start(async () => {
            const r = await createRow(slug, values)
            if (r.error) setError(r.error)
            else setOpen(false)
          })
        }}
      />
    </div>
  )
}
